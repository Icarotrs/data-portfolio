from datetime import date, datetime

import pytest

from extractor import clean


@pytest.mark.parametrize("raw,decimal,expected", [
    ("1.234,50 €", ",", 1234.5),          # European decimals + currency symbol
    ("12,5", ",", 12.5),
    ("  7  ", ",", 7.0),
    ("$1,299.00", ".", 1299.0),           # thousands separator + dollar sign
    ("US$ 45.10", ".", 45.1),
    ("USD 3", ".", 3.0),
    ("R$ 1.050,00", ",", 1050.0),
    ("(12.00)", ".", -12.0),               # accounting negative
    (19.99, ".", 19.99),                   # already a number (Excel)
    ("n/a", ".", None),
    ("", ".", None),
    ("1.2.3", ".", None),
])
def test_parse_number(raw, decimal, expected):
    assert clean.parse_number(raw, decimal) == expected


@pytest.mark.parametrize("raw,order,expected", [
    ("2024-04-03", "MDY", date(2024, 4, 3)),
    ("03/04/24", "MDY", date(2024, 3, 4)),     # same text, two meanings: the mapping decides
    ("03/04/24", "DMY", date(2024, 4, 3)),
    ("03.04.2024", "DMY", date(2024, 4, 3)),
    ("April 3", "MDY", date(2026, 4, 3)),       # no year -> default_year
    ("Apr 3, 2024", "MDY", date(2024, 4, 3)),
    ("3 Apr 2024", "DMY", date(2024, 4, 3)),
    (datetime(2024, 4, 3, 10, 30), "MDY", date(2024, 4, 3)),
    ("13/13/24", "MDY", None),
    ("sometime", "MDY", None),
])
def test_parse_date(raw, order, expected):
    assert clean.parse_date(raw, order, default_year=2026) == expected


def test_parse_date_without_year_needs_default():
    assert clean.parse_date("April 3", "MDY", default_year=None) is None


def test_text_rules():
    assert clean.clean_text("  a   b  ") == "a b"
    assert clean.clean_text(float("nan")) == ""
    assert clean.title_case("  STAINLESS steel  BOTTLE 750ML ") == "Stainless Steel Bottle 750ml"
    assert clean.title_case("set of LED lights") == "Set of LED Lights"
    assert clean.normalize_sku(" pc 201 ") == "PC-201"
