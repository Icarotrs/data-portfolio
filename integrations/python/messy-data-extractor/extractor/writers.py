"""Output: Google Sheets (three tabs) or a local .xlsx with the same tabs."""

from __future__ import annotations

from datetime import date
from pathlib import Path

import pandas as pd

TABS = ("Clean data", "Summary", "Fix log")


def _tables(result) -> dict[str, pd.DataFrame]:
    return {"Clean data": result.data, "Summary": result.summary, "Fix log": result.log}


def write_xlsx(result, path: Path) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(path, engine="openpyxl") as xw:
        for name, df in _tables(result).items():
            df.to_excel(xw, sheet_name=name, index=False)
            ws = xw.sheets[name]
            ws.freeze_panes = "A2"
            for col in ws.columns:
                width = max(len(str(c.value or "")) for c in col[:200])
                ws.column_dimensions[col[0].column_letter].width = min(max(10, width + 2), 60)
    return path


def _cell(v):
    if isinstance(v, date):
        return v.isoformat()
    if v is None or (isinstance(v, float) and v != v):
        return ""
    return v


def write_google_sheets(result, spreadsheet_id: str, credentials_file: Path) -> str:
    """Writes the three tabs into an existing Google Sheet with a service
    account (share the sheet with the service account's email first).
    Requires `pip install gspread`."""
    import gspread  # optional dependency

    gc = gspread.service_account(filename=str(credentials_file))
    sh = gc.open_by_key(spreadsheet_id)
    existing = {ws.title: ws for ws in sh.worksheets()}
    for name, df in _tables(result).items():
        values = [list(df.columns)] + [[_cell(v) for v in row] for row in df.itertuples(index=False)]
        ws = existing.get(name) or sh.add_worksheet(title=name, rows=max(len(values), 10), cols=max(len(df.columns), 5))
        ws.clear()
        ws.update(values, "A1", value_input_option="USER_ENTERED")
        ws.freeze(rows=1)
    return sh.url
