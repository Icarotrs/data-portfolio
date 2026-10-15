"""python -m extractor --input demo_data/incoming --out output/clean.xlsx
python -m extractor --input … --sheet-id <ID> --credentials service-account.json"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .pipeline import price_snapshot, run
from .writers import write_google_sheets, write_xlsx

HERE = Path(__file__).resolve().parent.parent


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="extractor", description="Messy supplier files → one clean table.")
    ap.add_argument("--input", type=Path, default=HERE / "demo_data" / "incoming", help="folder with supplier files")
    ap.add_argument("--mappings", type=Path, default=HERE / "mappings", help="folder with one JSON mapping per supplier")
    ap.add_argument("--out", type=Path, default=HERE / "output" / "clean.xlsx", help="local .xlsx output")
    ap.add_argument("--sheet-id", help="Google Sheet ID to write the three tabs into (optional)")
    ap.add_argument("--credentials", type=Path, help="service-account JSON for Google Sheets")
    ap.add_argument("--snapshot", type=Path, default=HERE / "output" / "last_prices.json",
                    help="prices from the last run, for the 'price changes' columns")
    ap.add_argument("--year", type=int, help="year for dates written without one (default: this year)")
    args = ap.parse_args(argv)

    previous = json.loads(args.snapshot.read_text()) if args.snapshot.exists() else None
    result = run(args.input, args.mappings, previous, args.year)

    for f in result.files:
        print(f"  {f['file']:<34} {f['supplier']:<22} {f['rows']:>4} rows")
    for name in result.unmatched:
        print(f"  {name:<34} (no mapping matched - skipped)", file=sys.stderr)
    print(f"-> {len(result.data)} clean rows, {len(result.log)} fixes logged")

    path = write_xlsx(result, args.out)
    print(f"-> {path}")
    if args.sheet_id:
        if not args.credentials:
            ap.error("--sheet-id needs --credentials")
        print(f"-> {write_google_sheets(result, args.sheet_id, args.credentials)}")

    args.snapshot.parent.mkdir(parents=True, exist_ok=True)
    args.snapshot.write_text(json.dumps(price_snapshot(result.data), indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
