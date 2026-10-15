"""Prepares the Olist public dataset for Power BI, plus the simulated tables.

  python prepare_data.py --source path/to/olist.zip     (or the unzipped folder)
  python prepare_data.py --download                      (needs the Kaggle CLI + API token)

Writes to ./data/:
  Real (cleaned) Olist tables, values in BRL:
    orders.csv, order_items.csv, order_payments.csv, order_reviews.csv,
    customers.csv, products.csv, sellers.csv, geolocation.csv
  Simulated (every row has is_simulated = TRUE):
    product_cost_by_category.csv   cost as a % of price, per category
    fee_assumptions.csv            marketplace commission and payment fees
    ad_spend_by_channel.csv        monthly spend for Google, Meta, TikTok, Email
    order_channel_attribution.csv  which channel each order is attributed to
  data_report.txt                  row counts and what was cleaned

The Olist dataset (Brazilian E-Commerce Public Dataset by Olist, CC BY-NC-SA
4.0) is on Kaggle: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce
Olist does not publish product costs, fees or ad spend, so those are
simulated here with a fixed seed and labeled as simulated.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import subprocess
import sys
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent

FILES = {
    "orders": "olist_orders_dataset.csv",
    "order_items": "olist_order_items_dataset.csv",
    "order_payments": "olist_order_payments_dataset.csv",
    "order_reviews": "olist_order_reviews_dataset.csv",
    "customers": "olist_customers_dataset.csv",
    "products": "olist_products_dataset.csv",
    "sellers": "olist_sellers_dataset.csv",
    "geolocation": "olist_geolocation_dataset.csv",
    "category_translation": "product_category_name_translation.csv",
}
ORDER_DATES = ["order_purchase_timestamp", "order_approved_at", "order_delivered_carrier_date",
               "order_delivered_customer_date", "order_estimated_delivery_date"]
CHANNELS = ["Google", "Meta", "TikTok", "Email"]
SEED = 42


# ── Loading ─────────────────────────────────────────────────────────────
def load_raw(source: Path) -> dict[str, pd.DataFrame]:
    """Reads the 9 Olist CSVs from a folder or the Kaggle zip."""
    source = Path(source)
    if source.suffix.lower() == ".zip":
        with zipfile.ZipFile(source) as z:
            names = {Path(n).name: n for n in z.namelist()}
            missing = [f for f in FILES.values() if f not in names]
            if missing:
                raise SystemExit(f"{source}: missing {missing}")
            return {k: pd.read_csv(io.BytesIO(z.read(names[f])), dtype=str) for k, f in FILES.items()}
    missing = [f for f in FILES.values() if not (source / f).exists()]
    if missing:
        raise SystemExit(f"{source}: missing {missing}")
    return {k: pd.read_csv(source / f, dtype=str) for k, f in FILES.items()}


def download(dest: Path) -> Path:
    """Downloads the dataset with the Kaggle CLI (pip install kaggle; token in ~/.kaggle/kaggle.json)."""
    dest.mkdir(parents=True, exist_ok=True)
    cmd = ["kaggle", "datasets", "download", "-d", "olistbr/brazilian-ecommerce", "-p", str(dest)]
    try:
        subprocess.run(cmd, check=True)
    except FileNotFoundError:
        raise SystemExit("Kaggle CLI not found. pip install kaggle, add your API token, or download the zip by hand and use --source.")
    return dest / "brazilian-ecommerce.zip"


# ── Cleaning ────────────────────────────────────────────────────────────
def clean(raw: dict[str, pd.DataFrame], log: list[str]) -> dict[str, pd.DataFrame]:
    out: dict[str, pd.DataFrame] = {}

    o = raw["orders"].copy()
    for c in ORDER_DATES:
        o[c] = pd.to_datetime(o[c], errors="coerce")
    o["order_status"] = o["order_status"].str.strip().str.lower()
    o["purchase_date"] = o["order_purchase_timestamp"].dt.date
    o["purchase_month"] = o["order_purchase_timestamp"].dt.to_period("M").dt.to_timestamp().dt.date
    o["delivery_days"] = (o["order_delivered_customer_date"] - o["order_purchase_timestamp"]).dt.days
    o["is_late"] = o["order_delivered_customer_date"] > o["order_estimated_delivery_date"]
    out["orders"] = o

    items = raw["order_items"].copy()
    for c in ("price", "freight_value"):
        items[c] = pd.to_numeric(items[c], errors="coerce")
    items["order_item_id"] = pd.to_numeric(items["order_item_id"], errors="coerce").astype("Int64")
    items["shipping_limit_date"] = pd.to_datetime(items["shipping_limit_date"], errors="coerce")
    items["line_key"] = items["order_id"] + "-" + items["order_item_id"].astype(str)
    out["order_items"] = items

    pay = raw["order_payments"].copy()
    pay["payment_value"] = pd.to_numeric(pay["payment_value"], errors="coerce")
    pay["payment_installments"] = pd.to_numeric(pay["payment_installments"], errors="coerce").astype("Int64")
    pay["payment_sequential"] = pd.to_numeric(pay["payment_sequential"], errors="coerce").astype("Int64")
    out["order_payments"] = pay

    rev = raw["order_reviews"].copy()
    before = len(rev)
    rev["review_creation_date"] = pd.to_datetime(rev["review_creation_date"], errors="coerce")
    rev = rev.sort_values("review_creation_date").drop_duplicates("review_id", keep="last")
    log.append(f"order_reviews: {before - len(rev)} duplicated review_id rows removed (kept the latest)")
    rev["review_score"] = pd.to_numeric(rev["review_score"], errors="coerce").astype("Int64")
    out["order_reviews"] = rev

    out["customers"] = raw["customers"].copy()

    prod = raw["products"].copy()
    tr = raw["category_translation"].set_index("product_category_name")["product_category_name_english"]
    prod["category"] = prod["product_category_name"].map(tr)
    missing_tr = prod["category"].isna() & prod["product_category_name"].notna()
    prod.loc[missing_tr, "category"] = prod.loc[missing_tr, "product_category_name"]
    prod["category"] = prod["category"].fillna("unknown").str.replace("_", " ").str.strip()
    log.append(f"products: {int(missing_tr.sum())} products whose category has no English name kept the Portuguese name; "
               f"{int(raw['products']['product_category_name'].isna().sum())} without a category set to 'unknown'")
    for c in ("product_weight_g", "product_length_cm", "product_height_cm", "product_width_cm", "product_photos_qty"):
        prod[c] = pd.to_numeric(prod[c], errors="coerce")
    out["products"] = prod

    out["sellers"] = raw["sellers"].copy()

    geo = raw["geolocation"].copy()
    for c in ("geolocation_lat", "geolocation_lng"):
        geo[c] = pd.to_numeric(geo[c], errors="coerce")
    before = len(geo)
    # One row per zip prefix (the raw table has ~1M rows with many repeats).
    geo = (geo.groupby("geolocation_zip_code_prefix", as_index=False)
              .agg(lat=("geolocation_lat", "median"), lng=("geolocation_lng", "median"),
                   city=("geolocation_city", "first"), state=("geolocation_state", "first")))
    log.append(f"geolocation: {before:,} rows -> {len(geo):,} (one per zip prefix, median coordinates)")
    out["geolocation"] = geo
    return out


# ── Simulated tables ────────────────────────────────────────────────────
def simulate_costs(products: pd.DataFrame, seed: int = SEED) -> pd.DataFrame:
    """Product cost as a share of the selling price, per category: 35%–75%,
    fixed per category name so it doesn't change between runs."""
    rows = []
    for cat in sorted(products["category"].dropna().unique()):
        h = int(hashlib.sha256(f"{seed}:{cat}".encode()).hexdigest()[:8], 16) / 0xFFFFFFFF
        rows.append({"category": cat, "cost_pct_of_price": round(0.35 + 0.40 * h, 3), "is_simulated": True})
    return pd.DataFrame(rows)


def simulate_fees() -> pd.DataFrame:
    """Marketplace commission and payment fees (simulated; Olist does not publish them)."""
    return pd.DataFrame([
        {"fee": "marketplace_commission", "applies_to": "all", "pct_of_price": 0.16, "is_simulated": True},
        {"fee": "payment_fee", "applies_to": "credit_card", "pct_of_price": 0.035, "is_simulated": True},
        {"fee": "payment_fee", "applies_to": "boleto", "pct_of_price": 0.015, "is_simulated": True},
        {"fee": "payment_fee", "applies_to": "voucher", "pct_of_price": 0.0, "is_simulated": True},
        {"fee": "payment_fee", "applies_to": "debit_card", "pct_of_price": 0.02, "is_simulated": True},
        {"fee": "payment_fee", "applies_to": "not_defined", "pct_of_price": 0.0, "is_simulated": True},
    ])


def simulate_attribution(orders: pd.DataFrame, seed: int = SEED) -> pd.DataFrame:
    """Assigns every order to one ad channel (simulated last-click attribution).
    Shares: Google 40%, Meta 30%, TikTok 15%, Email 15%."""
    weights = np.array([0.40, 0.30, 0.15, 0.15])
    cum = np.cumsum(weights)
    def channel(order_id: str) -> str:
        h = int(hashlib.sha256(f"{seed}:{order_id}".encode()).hexdigest()[:8], 16) / 0xFFFFFFFF
        return CHANNELS[int(np.searchsorted(cum, h, side="right").clip(0, 3))]
    return pd.DataFrame({"order_id": orders["order_id"], "channel": orders["order_id"].map(channel), "is_simulated": True})


def simulate_ad_spend(orders: pd.DataFrame, items: pd.DataFrame, attribution: pd.DataFrame, seed: int = SEED) -> pd.DataFrame:
    """Monthly spend per channel, derived from the attributed revenue and a
    simulated target ROAS per channel with month-to-month noise. Built so the
    channels differ (some above, some below 3× ROAS), which is what the
    Marketing page is meant to show. The resulting numbers describe nothing real."""
    rng = np.random.default_rng(seed)
    base_roas = {"Google": 4.2, "Meta": 2.6, "TikTok": 1.7, "Email": 9.0}
    rev = (items.groupby("order_id")["price"].sum().rename("revenue").reset_index()
           .merge(attribution, on="order_id")
           .merge(orders[["order_id", "purchase_month", "order_status"]], on="order_id"))
    rev = rev[rev["order_status"] == "delivered"]
    monthly = rev.groupby(["purchase_month", "channel"], as_index=False)["revenue"].sum()
    monthly["target_roas"] = monthly["channel"].map(base_roas) * rng.normal(1.0, 0.12, len(monthly)).clip(0.7, 1.3)
    monthly["spend_brl"] = (monthly["revenue"] / monthly["target_roas"]).round(2)
    monthly = monthly.rename(columns={"purchase_month": "month"})[["month", "channel", "spend_brl"]]
    monthly["is_simulated"] = True
    return monthly.sort_values(["month", "channel"]).reset_index(drop=True)


def reference_totals(t: dict[str, pd.DataFrame]) -> dict:
    """The report's headline numbers computed in pandas with the same
    definitions as measures.dax, over delivered orders — to cross-check the
    Power BI report after building it (filter: order_status = delivered)."""
    o = t["orders"]
    items = t["order_items"].merge(o[["order_id", "order_status", "payment_type", "channel"]], on="order_id")
    items = items[items["order_status"] == "delivered"]
    items = items.merge(t["products"][["product_id", "category"]], on="product_id", how="left")
    items = items.merge(t["product_cost_by_category"][["category", "cost_pct_of_price"]], on="category", how="left")
    fees = t["fee_assumptions"]
    commission = float(fees.loc[fees["fee"] == "marketplace_commission", "pct_of_price"].iloc[0])
    pay = fees[fees["fee"] == "payment_fee"].set_index("applies_to")["pct_of_price"]
    items["pay_pct"] = items["payment_type"].map(pay).fillna(0.0)
    items["net"] = (items["price"] - items["freight_value"] - items["price"] * commission
                    - items["price"] * items["pay_pct"] - items["price"] * items["cost_pct_of_price"].fillna(0))
    by_product = items.groupby("product_id")["net"].sum()
    revenue_by_channel = items.groupby("channel")["price"].sum()
    spend = t["ad_spend_by_channel"].groupby("channel")["spend_brl"].sum()
    return {
        "delivered_orders": int(items["order_id"].nunique()),
        "revenue_brl": round(float(items["price"].sum()), 2),
        "net_margin_brl": round(float(items["net"].sum()), 2),
        "products_sold": int(by_product.size),
        "loss_making_products": int((by_product < 0).sum()),
        "roas_by_channel": {c: round(float(revenue_by_channel.get(c, 0) / spend[c]), 2) for c in spend.index if spend[c]},
    }


def enrich_orders(orders: pd.DataFrame, payments: pd.DataFrame, customers: pd.DataFrame,
                  attribution: pd.DataFrame) -> pd.DataFrame:
    """Adds the columns the DAX measures need, so Power Query stays simple:
      payment_type    the order's main payment type (largest payment value)
      is_first_order  first order of the person (customer_unique_id) in the dataset
      channel         simulated ad channel (from order_channel_attribution)"""
    o = orders.copy()
    main_pay = (payments.sort_values("payment_value", ascending=False)
                .drop_duplicates("order_id")[["order_id", "payment_type"]])
    o = o.merge(main_pay, on="order_id", how="left")
    o["payment_type"] = o["payment_type"].fillna("not_defined")

    o = o.merge(customers[["customer_id", "customer_unique_id"]], on="customer_id", how="left")
    first = o.sort_values("order_purchase_timestamp").drop_duplicates("customer_unique_id")["order_id"]
    o["is_first_order"] = o["order_id"].isin(set(first))
    o = o.drop(columns=["customer_unique_id"])

    o = o.merge(attribution[["order_id", "channel"]], on="order_id", how="left")
    return o


# ── Main ────────────────────────────────────────────────────────────────
def run(source: Path, out_dir: Path) -> dict[str, pd.DataFrame]:
    log: list[str] = []
    raw = load_raw(source)
    tables = clean(raw, log)
    tables["product_cost_by_category"] = simulate_costs(tables["products"])
    tables["fee_assumptions"] = simulate_fees()
    tables["order_channel_attribution"] = simulate_attribution(tables["orders"])
    tables["ad_spend_by_channel"] = simulate_ad_spend(tables["orders"], tables["order_items"], tables["order_channel_attribution"])
    tables["orders"] = enrich_orders(tables["orders"], tables["order_payments"], tables["customers"],
                                     tables["order_channel_attribution"])

    out_dir.mkdir(parents=True, exist_ok=True)
    lines = ["Olist data prepared for Power BI", ""]
    for name, df in tables.items():
        df.to_csv(out_dir / f"{name}.csv", index=False, encoding="utf-8")
        sim = " (simulated)" if "is_simulated" in df.columns else ""
        lines.append(f"{name + '.csv':<34} {len(df):>9,} rows{sim}")
    lines += ["", "Cleaning:"] + [f"- {l}" for l in log]
    lines += ["", f"Orders in the dataset: {tables['orders']['order_id'].nunique():,}",
              f"Delivered orders: {(tables['orders']['order_status'] == 'delivered').sum():,}"]
    ref = reference_totals(tables)
    lines += ["", "Reference totals (same definitions as measures.dax, delivered orders only;",
              "they depend on the SIMULATED cost, fee and ad spend tables):"]
    lines += [f"  {k}: {v}" for k, v in ref.items()]
    (out_dir / "data_report.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return tables


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--source", type=Path, help="the Kaggle zip or the folder with the 9 Olist CSVs")
    g.add_argument("--download", action="store_true", help="download with the Kaggle CLI first")
    ap.add_argument("--out", type=Path, default=HERE / "data")
    args = ap.parse_args(argv)
    source = download(HERE / "raw") if args.download else args.source
    run(source, args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
