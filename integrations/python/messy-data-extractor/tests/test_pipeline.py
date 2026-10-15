import json
from datetime import date

import pandas as pd
import pytest

from extractor import pipeline
from extractor.writers import TABS, write_xlsx


@pytest.fixture(scope="module")
def result(demo_dir, mappings_dir):
    return pipeline.run(demo_dir, mappings_dir, default_year=2026)


def test_every_file_is_read(result):
    assert {f["supplier"] for f in result.files} == {
        "Nordhaus Supply", "Pacific Wholesale", "Lakeside Home Co.", "Maple Supplies"}
    assert result.unmatched == []


def test_one_consistent_table(result):
    df = result.data
    assert list(df.columns) == pipeline.OUTPUT_COLUMNS
    assert len(df) == 8 + 8 + 30 + 10                 # the Maple duplicate is gone
    assert df["unit_price"].map(lambda v: isinstance(v, float)).all()
    assert df["stock_qty"].map(lambda v: isinstance(v, int)).all()
    assert df["updated_on"].map(lambda v: isinstance(v, date)).all()
    assert df["sku"].str.fullmatch(r"[A-Z]{2}-\d{3}").all()
    assert set(df["currency"]) == {"EUR", "USD"}


def test_european_prices_become_numbers(result):
    nh = result.data[result.data.supplier == "Nordhaus Supply"]
    assert (nh["unit_price"] > 0).all()
    assert (nh["currency"] == "EUR").all()


def test_split_and_merge(result):
    ls = result.data[result.data.supplier == "Lakeside Home Co."]
    assert set(ls["size"]) <= {"S", "M", "L", "XL"}
    assert set(ls["color"]) <= {"Navy", "Sand", "Olive", "White"}
    mp = result.data[result.data.supplier == "Maple Supplies"]
    assert "Stainless Steel Bottle 750ml" in set(mp["product"])


def test_duplicate_keeps_newest(result):
    dup = result.log[result.log.rule == "duplicate removed"]
    assert len(dup) == 1
    sku = dup.iloc[0]["original"].split(" ")[0]
    kept = result.data[(result.data.supplier == "Maple Supplies") & (result.data.sku == sku)]
    assert len(kept) == 1
    assert kept.iloc[0]["unit_price"] != 9.99         # the older row had 9.99


@pytest.mark.parametrize("rule", [
    "European decimal comma", "currency text removed", "thousands separator removed",
    "date normalized (DMY)", "date normalized (MDY)", "date normalized (text)",
    "split column", "merged columns", "name trimmed and title-cased",
    "SKU trimmed and uppercased", "duplicate removed",
])
def test_every_kind_of_fix_is_logged(result, rule):
    assert result.log.rule.str.contains(rule, regex=False).any(), rule


def test_log_points_to_the_source(result):
    row = result.log[result.log.rule.str.contains("European")].iloc[0]
    assert row["file"] == "nordhaus_pricelist.csv"
    assert row["row"] >= 2
    assert "€" in row["original"]


def test_price_changes_against_previous_run(demo_dir, mappings_dir, result):
    snap = pipeline.price_snapshot(result.data)
    key = next(iter(snap))
    snap[key] = snap[key] - 1                         # pretend it was cheaper last time
    again = pipeline.run(demo_dir, mappings_dir, previous_prices=snap, default_year=2026)
    supplier = key.split("|")[0]
    row = again.summary[again.summary.supplier == supplier].iloc[0]
    assert row["price_increases"] == 1
    assert row["price_decreases"] == 0


def test_bad_values_are_logged_not_dropped(tmp_path, mappings_dir):
    (tmp_path / "maple_bad.csv").write_text(
        "Item #,Name,Variant,Price (USD),Stock,Last update\nmp 1,cup,,call us,3,someday\n", encoding="utf-8")
    r = pipeline.run(tmp_path, mappings_dir, default_year=2026)
    assert len(r.data) == 1
    assert pd.isna(r.data.iloc[0]["unit_price"])
    assert set(r.log.rule) >= {"not a number → left blank", "date not understood → left blank"}


def test_missing_column_names_the_file(tmp_path, mappings_dir):
    (tmp_path / "maple_x.csv").write_text("Item,Price\n1,2\n", encoding="utf-8")
    with pytest.raises(ValueError, match="maple_x.csv: columns not found"):
        pipeline.run(tmp_path, mappings_dir)


def test_unmatched_files_are_reported(tmp_path, mappings_dir):
    (tmp_path / "unknown.csv").write_text("a,b\n1,2\n")
    assert pipeline.run(tmp_path, mappings_dir).unmatched == ["unknown.csv"]


def test_xlsx_has_three_tabs(result, tmp_path):
    path = write_xlsx(result, tmp_path / "out.xlsx")
    sheets = pd.read_excel(path, sheet_name=None)
    assert tuple(sheets) == TABS
    assert len(sheets["Clean data"]) == len(result.data)


def test_mapping_validation(tmp_path):
    (tmp_path / "bad.json").write_text(json.dumps({"supplier": "X", "match": "*.csv", "columns": {"sku": "A"}}))
    with pytest.raises(ValueError, match="must map 'product'"):
        pipeline.load_mappings(tmp_path)
