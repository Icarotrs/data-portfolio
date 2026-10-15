"""Files in → one clean table, a summary and a log of every fix."""

from __future__ import annotations

import fnmatch
import json
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

import pandas as pd

from . import clean
from .readers import read_any

OUTPUT_COLUMNS = ["supplier", "sku", "product", "size", "color", "unit_price", "currency",
                  "stock_qty", "updated_on", "source_file", "source_row"]
LOG_COLUMNS = ["file", "row", "column", "original", "cleaned", "rule"]


@dataclass
class Result:
    data: pd.DataFrame
    summary: pd.DataFrame
    log: pd.DataFrame
    files: list[dict] = field(default_factory=list)  # per file: name, supplier, rows, reader info
    unmatched: list[str] = field(default_factory=list)


def load_mappings(folder: Path) -> list[dict]:
    """One JSON file per supplier format. See mappings/README.md."""
    mappings = []
    for p in sorted(Path(folder).glob("*.json")):
        m = json.loads(p.read_text(encoding="utf-8"))
        for key in ("supplier", "match", "columns"):
            if key not in m:
                raise ValueError(f"{p.name}: missing '{key}'")
        for col in ("sku", "product", "unit_price"):
            if col not in m["columns"] and not (col == "product" and "merge" in m):
                raise ValueError(f"{p.name}: columns must map '{col}'")
        m["_file"] = p.name
        mappings.append(m)
    return mappings


def find_mapping(filename: str, mappings: list[dict]) -> dict | None:
    for m in mappings:
        if fnmatch.fnmatch(filename.lower(), m["match"].lower()):
            return m
    return None


class _Log:
    def __init__(self):
        self.rows: list[dict] = []

    def add(self, file, row, column, original, cleaned, rule):
        self.rows.append({"file": file, "row": row, "column": column,
                          "original": "" if original is None else str(original),
                          "cleaned": "" if cleaned is None else str(cleaned), "rule": rule})


def _clean_file(df: pd.DataFrame, m: dict, file: str, log: _Log, default_year: int) -> list[dict]:
    cols = m["columns"]
    missing = [src for src in cols.values() if src not in df.columns]
    if missing:
        raise ValueError(f"{file}: columns not found {missing}; the file has {list(df.columns)}")
    decimal = m.get("decimal", ".")
    order = m.get("date_order", "MDY")
    header_rows = m.get("header_rows", 1) + m.get("skip_rows", 0)
    out = []
    for i, src in df.iterrows():
        row_no = int(i) + header_rows + 1  # row number as seen in the source file
        rec = {"supplier": m["supplier"], "currency": m.get("currency", ""),
               "source_file": file, "source_row": row_no, "size": "", "color": ""}

        # Merged columns → one (e.g. "Name" + "Variant")
        for target, sources in (m.get("merge") or {}).items():
            parts = [clean.clean_text(src[s]) for s in sources if clean.clean_text(src[s])]
            joined = " ".join(parts)
            if target == "product":
                joined = clean.title_case(joined)
            rec[target] = joined
            original = " | ".join(clean.clean_text(src[s]) for s in sources)
            rule = "merged columns" + (", title-cased" if target == "product" else "")
            log.add(file, row_no, target, original, joined, rule)

        for target, source in cols.items():
            raw = src[source]
            text = clean.clean_text(raw)
            if target == "sku":
                v = clean.normalize_sku(raw)
                if v != str(raw):
                    log.add(file, row_no, target, raw, v, "SKU trimmed and uppercased")
            elif target == "product":
                v = clean.title_case(raw)
                if v != str(raw):
                    log.add(file, row_no, target, raw, v, "name trimmed and title-cased")
            elif target in ("unit_price", "stock_qty"):
                v = clean.parse_number(raw, decimal)
                if v is None:
                    if text:
                        log.add(file, row_no, target, raw, "", "not a number → left blank")
                else:
                    rules = []
                    if any(c in text for c in "$€£") or any(k in text.upper() for k in ("USD", "EUR", "BRL", "GBP")):
                        rules.append("currency text removed")
                    if decimal == "," and "," in text:
                        rules.append("European decimal comma")
                    elif "," in text:
                        rules.append("thousands separator removed")
                    if rules or str(raw).strip() != text:
                        log.add(file, row_no, target, raw, v, ", ".join(rules) or "trimmed")
                    if target == "stock_qty":
                        v = int(round(v))
            elif target == "updated_on":
                v = clean.parse_date(raw, order, default_year)
                if v is None:
                    if text:
                        log.add(file, row_no, target, raw, "", "date not understood → left blank")
                elif text != v.isoformat():
                    log.add(file, row_no, target, raw, v.isoformat(), f"date normalized ({order if '/' in text or '.' in text else 'text'})")
            elif target == "currency":
                v = clean.clean_text(raw).upper().replace("US$", "USD").replace("$", "USD").replace("€", "EUR")
            else:
                v = text
            rec[target] = v

        # One column holding two values, e.g. "M / Blue"
        split = m.get("split")
        if split:
            raw = clean.clean_text(src[split["source"]])
            parts = [p.strip() for p in raw.split(split.get("separator", "/"))] if raw else []
            for k, target in enumerate(split["into"]):
                val = parts[k] if k < len(parts) else ""
                rec[target] = val.upper() if target == "size" else clean.title_case(val)
            if raw:
                log.add(file, row_no, "+".join(split["into"]), raw,
                        " | ".join(rec[t] for t in split["into"]), "split column")
        out.append(rec)
    return out


def _dedupe(rows: list[dict], log: _Log) -> list[dict]:
    """Same supplier + SKU: keep the most recent (by date, then last in file)."""
    best: dict[tuple, dict] = {}
    for r in rows:
        key = (r["supplier"], r["sku"])
        prev = best.get(key)
        if prev is None:
            best[key] = r
            continue
        newer = (r["updated_on"] or date.min) >= (prev["updated_on"] or date.min)
        keep, drop = (r, prev) if newer else (prev, r)
        best[key] = keep
        log.add(drop["source_file"], drop["source_row"], "row", f"{drop['sku']} {drop['updated_on'] or ''}".strip(),
                f"kept row {keep['source_row']}", "duplicate removed")
    return list(best.values())


def _summary(df: pd.DataFrame, previous: dict | None) -> pd.DataFrame:
    rows = []
    for supplier, g in df.groupby("supplier", sort=True):
        changes_up = changes_down = 0
        if previous:
            for _, r in g.iterrows():
                old = previous.get(f"{supplier}|{r['sku']}")
                if old is not None and pd.notna(r["unit_price"]):
                    if r["unit_price"] > old:
                        changes_up += 1
                    elif r["unit_price"] < old:
                        changes_down += 1
        rows.append({
            "supplier": supplier,
            "products": len(g),
            "units_in_stock": int(pd.to_numeric(g["stock_qty"], errors="coerce").fillna(0).sum()),
            "avg_unit_price": round(float(pd.to_numeric(g["unit_price"], errors="coerce").mean()), 2),
            "currency": ", ".join(sorted(set(g["currency"]) - {""})),
            "price_increases": changes_up if previous else "",
            "price_decreases": changes_down if previous else "",
            "latest_update": max((d for d in g["updated_on"] if d), default=""),
        })
    return pd.DataFrame(rows)


def run(input_dir: Path, mappings_dir: Path, previous_prices: dict | None = None,
        default_year: int | None = None) -> Result:
    """Process every file in input_dir that matches a mapping."""
    mappings = load_mappings(mappings_dir)
    default_year = default_year or date.today().year
    log = _Log()
    rows, files, unmatched = [], [], []
    for path in sorted(Path(input_dir).iterdir()):
        if path.is_dir() or path.name.startswith("."):
            continue
        m = find_mapping(path.name, mappings)
        if not m:
            unmatched.append(path.name)
            continue
        df, info = read_any(path, m)
        cleaned = _clean_file(df, m, path.name, log, default_year)
        files.append({"file": path.name, "supplier": m["supplier"], "mapping": m["_file"], "rows": len(cleaned), **info})
        rows.extend(cleaned)

    rows = _dedupe(rows, log)
    data = pd.DataFrame(rows, columns=OUTPUT_COLUMNS).sort_values(["supplier", "sku"]).reset_index(drop=True)
    return Result(data=data, summary=_summary(data, previous_prices),
                  log=pd.DataFrame(log.rows, columns=LOG_COLUMNS), files=files, unmatched=unmatched)


def price_snapshot(data: pd.DataFrame) -> dict:
    """{supplier|sku: price} to compare against on the next run."""
    return {f"{r.supplier}|{r.sku}": r.unit_price for r in data.itertuples() if pd.notna(r.unit_price)}
