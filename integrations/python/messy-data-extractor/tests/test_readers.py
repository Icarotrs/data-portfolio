import pytest

from extractor import readers


def test_combine_two_header_rows_with_merged_cells():
    top = ["Item", "", "Pricing", None, "Inventory", None]
    bottom = ["Code", "Description", "Unit price", "Currency", "On hand", "Updated"]
    assert readers.combine_headers([top, bottom]) == [
        "Item Code", "Item Description", "Pricing Unit price", "Pricing Currency",
        "Inventory On hand", "Inventory Updated"]


def test_csv_semicolon_cp1252(demo_dir):
    df, info = readers.read_csv(demo_dir / "nordhaus_pricelist.csv")
    assert info["delimiter"] == ";"
    assert info["encoding"] == "cp1252"            # utf-8 fails on the cp1252 bytes for é and €
    assert list(df.columns) == ["Art.-Nr.", "Bezeichnung", "Preis", "Bestand", "Datum"]
    assert len(df) == 8
    assert any("€" in v for v in df["Preis"])
    assert any("é" in v for v in df["Bezeichnung"])


def test_csv_comma_utf8(demo_dir):
    df, info = readers.read_csv(demo_dir / "maple_supplies.csv")
    assert info["delimiter"] == ","
    assert info["encoding"].startswith("utf-8")
    assert len(df) == 11                            # 10 products + 1 duplicate


def test_excel_two_row_header(demo_dir):
    df, _ = readers.read_excel(demo_dir / "pacific_stock.xlsx", header_rows=2)
    assert "Pricing Unit price" in df.columns
    assert "Inventory Updated" in df.columns
    assert len(df) == 8


def test_pdf_table_over_two_pages(demo_dir):
    df, info = readers.read_pdf(demo_dir / "lakeside_catalog.pdf")
    assert info["pages"] == 2
    assert list(df.columns) == ["SKU", "Product", "Size / Color", "Price", "Qty", "Updated"]
    assert len(df) == 30                            # repeated header on page 2 dropped
    assert df.iloc[0]["SKU"] == "LS-300"


def test_unsupported_format(tmp_path):
    p = tmp_path / "x.doc"
    p.write_text("hi")
    with pytest.raises(ValueError, match="unsupported"):
        readers.read_any(p, {})
