"""Read each file format into a raw DataFrame of strings, with the header
already resolved (one row, even when the source has two)."""

from __future__ import annotations

import csv
import io
import re
from pathlib import Path

import pandas as pd

ENCODINGS = ("utf-8-sig", "utf-8", "cp1252", "latin-1")
DELIMITERS = ";,\t|"


def detect_encoding(raw: bytes, preferred: str | None = None) -> str:
    """The first encoding that decodes the bytes (mapping's choice first)."""
    for enc in ([preferred] if preferred else []) + list(ENCODINGS):
        try:
            raw.decode(enc)
            return enc
        except (UnicodeDecodeError, LookupError):
            continue
    return "latin-1"  # decodes anything


def detect_delimiter(text: str, preferred: str | None = None) -> str:
    if preferred:
        return preferred
    sample = "\n".join(text.splitlines()[:20])
    try:
        return csv.Sniffer().sniff(sample, delimiters=DELIMITERS).delimiter
    except csv.Error:
        counts = {d: sample.count(d) for d in DELIMITERS}
        return max(counts, key=counts.get)


def combine_headers(rows: list[list[str]]) -> list[str]:
    """Two header rows (the first with merged cells) → one header per column.

    ['Product', '',      'Price', '']       (merged "Product" over 2 columns)
    ['SKU',     'Name',  'Unit',  'Currency']
    → ['Product SKU', 'Product Name', 'Price Unit', 'Price Currency']
    """
    top, bottom = rows[0], rows[1]
    out, current = [], ""
    for i in range(max(len(top), len(bottom))):
        t = str(top[i]).strip() if i < len(top) and top[i] is not None else ""
        b = str(bottom[i]).strip() if i < len(bottom) and bottom[i] is not None else ""
        if t and t.lower() != "nan":
            current = t
        t_eff = current
        b = "" if b.lower() == "nan" else b
        out.append(f"{t_eff} {b}".strip() if b and b != t_eff else t_eff)
    return out


def _frame(header: list[str], rows: list[list]) -> pd.DataFrame:
    width = len(header)
    rows = [list(r) + [""] * (width - len(r)) if len(r) < width else list(r)[:width] for r in rows]
    df = pd.DataFrame(rows, columns=header, dtype=object)
    df = df.where(df.notna(), "")
    keep = df.apply(lambda r: any(str(v).strip() for v in r), axis=1)
    return df[keep].reset_index(drop=True)


def read_csv(path: Path, encoding: str | None = None, delimiter: str | None = None,
             header_rows: int = 1, skip_rows: int = 0) -> tuple[pd.DataFrame, dict]:
    raw = Path(path).read_bytes()
    enc = detect_encoding(raw, encoding)
    text = raw.decode(enc)
    delim = detect_delimiter(text, delimiter)
    rows = list(csv.reader(io.StringIO(text), delimiter=delim))[skip_rows:]
    rows = [r for r in rows if any(c.strip() for c in r)]
    header = combine_headers(rows[:2]) if header_rows == 2 else [c.strip() for c in rows[0]]
    return _frame(header, rows[header_rows:]), {"encoding": enc, "delimiter": delim}


def read_excel(path: Path, sheet: str | int = 0, header_rows: int = 1, skip_rows: int = 0) -> tuple[pd.DataFrame, dict]:
    df = pd.read_excel(path, sheet_name=sheet, header=None, dtype=object, skiprows=skip_rows)
    rows = df.where(df.notna(), "").values.tolist()
    rows = [r for r in rows if any(str(c).strip() for c in r)]
    header = combine_headers(rows[:2]) if header_rows == 2 else [str(c).strip() for c in rows[0]]
    return _frame(header, rows[header_rows:]), {"sheet": sheet}


def read_pdf(path: Path, header_rows: int = 1) -> tuple[pd.DataFrame, dict]:
    """Text-based PDF tables (not scanned images).

    Uses pdfplumber's table finder first; if a page has no ruled table,
    splits text lines on runs of 2+ spaces. Repeated header rows on later
    pages are dropped.
    """
    import pdfplumber

    rows: list[list[str]] = []
    method = "table"
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            if tables:
                for t in tables:
                    rows.extend([[c or "" for c in r] for r in t])
            else:
                method = "text"
                for line in (page.extract_text() or "").splitlines():
                    parts = re.split(r"\s{2,}", line.strip())
                    if len(parts) >= 3:
                        rows.append(parts)
    if not rows:
        raise ValueError(f"{path}: no table found (is it a scanned image? OCR is not supported)")
    header = combine_headers(rows[:2]) if header_rows == 2 else [c.strip() for c in rows[0]]
    first = [c.strip() for c in rows[0]]
    body = [r for r in rows[header_rows:] if [c.strip() for c in r] != first]
    return _frame(header, body), {"method": method, "pages": len(pdf.pages)}


def read_any(path: Path, mapping: dict) -> tuple[pd.DataFrame, dict]:
    fmt = mapping.get("format") or Path(path).suffix.lower().lstrip(".")
    header_rows = mapping.get("header_rows", 1)
    skip_rows = mapping.get("skip_rows", 0)
    if fmt == "csv":
        return read_csv(path, mapping.get("encoding"), mapping.get("delimiter"), header_rows, skip_rows)
    if fmt in ("xlsx", "xls", "excel"):
        return read_excel(path, mapping.get("sheet", 0), header_rows, skip_rows)
    if fmt == "pdf":
        return read_pdf(path, header_rows)
    raise ValueError(f"{path}: unsupported format '{fmt}'")
