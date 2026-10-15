"""Tests on a small synthetic dataset with the exact Olist file layout."""

import sys
import zipfile
from pathlib import Path

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import prepare_data as pdp  # noqa: E402


def write_fixture(folder: Path) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    orders = []
    items = []
    payments = []
    for i in range(400):
        oid = f"o{i:04d}"
        cust = f"c{i:04d}"
        month = 1 + i % 12
        orders.append([oid, cust, "delivered" if i % 10 else "canceled", f"2017-{month:02d}-10 10:00:00",
                       f"2017-{month:02d}-10 11:00:00", f"2017-{month:02d}-12 09:00:00",
                       f"2017-{month:02d}-{15 + i % 10} 12:00:00", f"2017-{month:02d}-20 00:00:00"])
        items.append([oid, "1", f"p{i % 20:02d}", "s1", f"2017-{month:02d}-12 00:00:00", "100.00", "10.00"])
        if i % 3 == 0:
            items.append([oid, "2", "p99", "s2", f"2017-{month:02d}-12 00:00:00", "5.00", "30.00"])  # cheap item, high freight → loss
        payments.append([oid, "1", "credit_card" if i % 2 else "boleto", "1", "110.00"])
    customers = [[f"c{i:04d}", f"u{i % 300:04d}", "01000", "sao paulo", "SP"] for i in range(400)]
    products = [[f"p{j:02d}", "beleza_saude" if j % 2 else "cama_mesa_banho", "40", "500", "1", "100", "10", "10", "10"] for j in range(20)]
    products.append(["p99", "categoria_nova", "10", "100", "1", "50", "5", "5", "5"])
    products.append(["p98", "", "", "", "", "", "", "", ""])
    reviews = [["r1", "o0001", "5", "", "", "2017-01-20 00:00:00", "2017-01-21 00:00:00"],
               ["r1", "o0001", "4", "", "", "2017-01-22 00:00:00", "2017-01-23 00:00:00"],
               ["r2", "o0002", "1", "", "", "2017-02-20 00:00:00", "2017-02-21 00:00:00"]]
    geo = [["01000", "-23.5", "-46.6", "sao paulo", "SP"], ["01000", "-23.7", "-46.8", "sao paulo", "SP"],
           ["20000", "-22.9", "-43.2", "rio de janeiro", "RJ"]]
    tr = [["beleza_saude", "health_beauty"], ["cama_mesa_banho", "bed_bath_table"]]
    sellers = [["s1", "01000", "sao paulo", "SP"], ["s2", "20000", "rio de janeiro", "RJ"]]

    def w(name, header, rows):
        pd.DataFrame(rows, columns=header).to_csv(folder / name, index=False)

    w(pdp.FILES["orders"], ["order_id", "customer_id", "order_status"] + pdp.ORDER_DATES, orders)
    w(pdp.FILES["order_items"], ["order_id", "order_item_id", "product_id", "seller_id", "shipping_limit_date", "price", "freight_value"], items)
    w(pdp.FILES["order_payments"], ["order_id", "payment_sequential", "payment_type", "payment_installments", "payment_value"], payments)
    w(pdp.FILES["order_reviews"], ["review_id", "order_id", "review_score", "review_comment_title", "review_comment_message", "review_creation_date", "review_answer_timestamp"], reviews)
    w(pdp.FILES["customers"], ["customer_id", "customer_unique_id", "customer_zip_code_prefix", "customer_city", "customer_state"], customers)
    w(pdp.FILES["products"], ["product_id", "product_category_name", "product_name_lenght", "product_description_lenght", "product_photos_qty", "product_weight_g", "product_length_cm", "product_height_cm", "product_width_cm"], products)
    w(pdp.FILES["sellers"], ["seller_id", "seller_zip_code_prefix", "seller_city", "seller_state"], sellers)
    w(pdp.FILES["geolocation"], ["geolocation_zip_code_prefix", "geolocation_lat", "geolocation_lng", "geolocation_city", "geolocation_state"], geo)
    w(pdp.FILES["category_translation"], ["product_category_name", "product_category_name_english"], tr)
    return folder


@pytest.fixture(scope="module")
def tables(tmp_path_factory):
    src = write_fixture(tmp_path_factory.mktemp("olist"))
    return pdp.run(src, tmp_path_factory.mktemp("out"))


def test_writes_all_tables(tables):
    assert set(tables) == {"orders", "order_items", "order_payments", "order_reviews", "customers", "products",
                           "sellers", "geolocation", "product_cost_by_category", "fee_assumptions",
                           "order_channel_attribution", "ad_spend_by_channel"}


def test_simulated_tables_are_labeled(tables):
    for name in ("product_cost_by_category", "fee_assumptions", "order_channel_attribution", "ad_spend_by_channel"):
        assert tables[name]["is_simulated"].all(), name
    for name in ("orders", "order_items", "products"):
        assert "is_simulated" not in tables[name].columns


def test_reviews_deduplicated_keeping_latest(tables):
    r = tables["order_reviews"]
    assert len(r) == 2
    assert int(r.loc[r.review_id == "r1", "review_score"].iloc[0]) == 4


def test_categories_translated_with_fallbacks(tables):
    cats = dict(zip(tables["products"].product_id, tables["products"].category))
    assert cats["p01"] == "health beauty"
    assert cats["p99"] == "categoria nova"      # no English name: Portuguese kept
    assert cats["p98"] == "unknown"


def test_geolocation_one_row_per_zip(tables):
    g = tables["geolocation"]
    assert len(g) == 2
    assert g.loc[g.geolocation_zip_code_prefix == "01000", "lat"].iloc[0] == pytest.approx(-23.6)


def test_orders_enriched(tables):
    o = tables["orders"]
    assert set(o.payment_type) == {"credit_card", "boleto"}
    assert set(o.channel) <= set(pdp.CHANNELS)
    # 400 orders from 300 people: 300 first orders
    assert o.is_first_order.sum() == 300
    assert o.purchase_month.notna().all()
    assert o.is_late.any() and (~o.is_late).any()


def test_costs_fixed_per_category_and_in_range(tables, tmp_path):
    c = tables["product_cost_by_category"]
    assert c.cost_pct_of_price.between(0.35, 0.75).all()
    again = pdp.simulate_costs(tables["products"])
    assert c.equals(again)


def test_attribution_deterministic_and_close_to_shares():
    orders = pd.DataFrame({"order_id": [f"x{i}" for i in range(20000)]})
    a = pdp.simulate_attribution(orders)
    assert a.equals(pdp.simulate_attribution(orders))
    shares = a.channel.value_counts(normalize=True)
    assert shares["Google"] == pytest.approx(0.40, abs=0.02)
    assert shares["Email"] == pytest.approx(0.15, abs=0.02)


def test_ad_spend_monthly_per_channel(tables):
    s = tables["ad_spend_by_channel"]
    assert (s.spend_brl > 0).all()
    assert not s.duplicated(["month", "channel"]).any()


def test_reference_totals_match_hand_calculation(tables):
    ref = pdp.reference_totals(tables)
    o, it = tables["orders"], tables["order_items"]
    delivered = set(o.loc[o.order_status == "delivered", "order_id"])
    d = it[it.order_id.isin(delivered)]
    assert ref["delivered_orders"] == len(delivered)
    assert ref["revenue_brl"] == pytest.approx(d.price.sum())
    # the 5.00 item with 30.00 freight always loses money
    assert ref["loss_making_products"] >= 1
    assert ref["net_margin_brl"] < ref["revenue_brl"]
    assert set(ref["roas_by_channel"]) <= set(pdp.CHANNELS)


def test_reads_the_kaggle_zip(tmp_path):
    src = write_fixture(tmp_path / "csv")
    z = tmp_path / "brazilian-ecommerce.zip"
    with zipfile.ZipFile(z, "w") as zf:
        for p in src.iterdir():
            zf.write(p, p.name)
    raw = pdp.load_raw(z)
    assert len(raw["orders"]) == 400


def test_missing_file_is_reported(tmp_path):
    (tmp_path / "x").mkdir()
    with pytest.raises(SystemExit, match="missing"):
        pdp.load_raw(tmp_path / "x")
