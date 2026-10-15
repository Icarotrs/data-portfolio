"""Cleanup rules for single values. Each function returns the clean value,
or None when the value can't be understood (the caller logs it)."""

from __future__ import annotations

import re
from datetime import date, datetime

MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], start=1)}

_SMALL_WORDS = {"and", "of", "for", "with", "de", "da", "do"}


def clean_text(value) -> str:
    """Trim and collapse whitespace; None/NaN become ''."""
    if value is None:
        return ""
    if isinstance(value, float) and value != value:  # NaN
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def title_case(value) -> str:
    """'  STAINLESS steel  BOTTLE ' → 'Stainless Steel Bottle'. Keeps tokens with digits
    (e.g. '500ml', 'XL') as they are, except lowercase units."""
    words = clean_text(value).split(" ")
    out = []
    for i, w in enumerate(words):
        lw = w.lower()
        if not w:
            continue
        if any(ch.isdigit() for ch in w):
            out.append(lw if re.fullmatch(r"\d+(ml|l|g|kg|cm|mm|oz|lb)", lw) else w.upper())
        elif i > 0 and lw in _SMALL_WORDS:
            out.append(lw)
        elif len(w) <= 3 and w.isupper() and w.isalpha():
            out.append(w)  # short codes like XL, USB, LED
        else:
            out.append(lw[:1].upper() + lw[1:])
    return " ".join(out)


def parse_number(value, decimal: str = ".") -> float | None:
    """Prices and quantities with currency text and either decimal style.

    decimal="," → '1.234,56' and '12,5' (European); decimal="." → '1,234.56'.
    Strips currency symbols/codes ('$', 'US$', 'EUR', '€', 'R$'). Returns None
    if no number is found.
    """
    if value is None:
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return None if value != value else float(value)
    s = clean_text(value)
    s = re.sub(r"(?i)(us\$|r\$|usd|eur|brl|gbp|\$|€|£)", "", s).strip()
    s = s.replace(" ", "")
    negative = s.startswith("-") or (s.startswith("(") and s.endswith(")"))
    s = s.strip("()-+")
    if not re.fullmatch(r"[\d.,]+", s or "x"):
        return None
    if decimal == ",":
        s = s.replace(".", "").replace(",", ".")
    else:
        s = s.replace(",", "")
    if s.count(".") > 1:
        return None
    try:
        n = float(s)
    except ValueError:
        return None
    return -n if negative else n


def parse_date(value, order: str = "MDY", default_year: int | None = None) -> date | None:
    """Mixed date formats → date.

    Handles ISO '2024-04-03', numeric '03/04/24' or '03.04.2024' (read with
    `order`, "MDY" or "DMY"), '3 Apr 2024', 'April 3, 2024' and 'April 3'
    (year from `default_year`). Excel dates/datetimes pass through.
    """
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    s = clean_text(value).lower().replace(",", "")
    if not s:
        return None
    try:
        m = re.fullmatch(r"(\d{4})-(\d{1,2})-(\d{1,2})(?:[ t].*)?", s)
        if m:
            return date(int(m[1]), int(m[2]), int(m[3]))
        m = re.fullmatch(r"(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})", s)
        if m:
            a, b, y = int(m[1]), int(m[2]), int(m[3])
            y = y + 2000 if y < 100 else y
            month, day = (a, b) if order == "MDY" else (b, a)
            return date(y, month, day)
        m = re.fullmatch(r"([a-z]{3})[a-z]*\.? (\d{1,2})(?:st|nd|rd|th)?(?: (\d{4}))?", s)
        if m and m[1] in MONTHS:
            y = int(m[3]) if m[3] else default_year
            return date(y, MONTHS[m[1]], int(m[2])) if y else None
        m = re.fullmatch(r"(\d{1,2}) ([a-z]{3})[a-z]*\.?(?: (\d{4}))?", s)
        if m and m[2] in MONTHS:
            y = int(m[3]) if m[3] else default_year
            return date(y, MONTHS[m[2]], int(m[1])) if y else None
    except ValueError:  # e.g. month 13
        return None
    return None


def normalize_sku(value) -> str:
    """' ab-123 ' → 'AB-123'; spaces inside become dashes."""
    return re.sub(r"\s+", "-", clean_text(value)).upper()
