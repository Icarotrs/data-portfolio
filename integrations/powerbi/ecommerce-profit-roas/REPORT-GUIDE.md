# E-commerce Profit & ROAS — build the report in Power BI Desktop

This folder has everything except the `.pbix` file, which you build in Power BI Desktop (Windows, free) in about 1–2 hours by following these steps.

| File | What it is |
| --- | --- |
| `prepare_data.py` | Loads the 9 Olist CSVs, cleans them and writes 8 tables to `data/`, plus 4 **simulated** tables and `data_report.txt` |
| `measures.dax` | Every measure, calculated column and helper table, commented |
| `REPORT-GUIDE.md` | This guide: model, the four pages, formatting |
| `tests/test_prepare.py` | 12 tests on a small dataset with Olist's exact file layout |

**What is real and what is simulated.** Orders, items, prices, freight, payments, reviews, customers, products, sellers and geolocation are the real public Olist dataset (a Brazilian marketplace, values in **BRL**, 2016–2018). Product cost, marketplace commission, payment fees, channel attribution and ad spend are **simulated** with a fixed seed (Olist doesn't publish them); each of those tables has `is_simulated = TRUE`, and every page of the report must say so.

---

## 1. Prepare the data

```bash
cd integrations/powerbi/ecommerce-profit-roas
pip install -r requirements.txt
```

Get the dataset (free Kaggle account): <https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce> → **Download** (`archive.zip`). Then:

```bash
python prepare_data.py --source path/to/archive.zip
```

(Or `python prepare_data.py --download` if you have the Kaggle CLI and API token set up.)

Open `data/data_report.txt`: it lists the row count of every table, what was cleaned, and **reference totals** (revenue, net margin, loss-making products, ROAS per channel) computed in Python with the same definitions as `measures.dax`. You'll use them in step 7 to check the report.

## 2. Import

Power BI Desktop → **Get data → Text/CSV**, one file at a time, and import all 12 CSVs from `data/` as separate tables, keeping the file names as table names. (Don't use *Get data → Folder → Combine*: that merges the files into one table.)

In **Transform data** (Power Query), check the types:

| Table | Column | Type |
| --- | --- | --- |
| orders | `order_purchase_timestamp` and the other `*_date` / `*_at` columns | Date/Time |
| orders | `purchase_date`, `purchase_month` | Date |
| orders | `is_late`, `is_first_order` | True/False |
| order_items | `price`, `freight_value` | Decimal number |
| order_payments | `payment_value` | Decimal number |
| order_reviews | `review_score` | Whole number |
| product_cost_by_category | `cost_pct_of_price` | Decimal number |
| fee_assumptions | `pct_of_price` | Decimal number |
| ad_spend_by_channel | `month` | Date; `spend_brl`: Decimal number |

`orders` already has three helper columns made by the script: `payment_type` (the order's main payment type), `is_first_order` (first order of that person) and `channel` (simulated attribution).

Close & Apply.

## 3. Model

Create the two helper tables from the top of `measures.dax` (**Modeling → New table**): `Date` and `Channel`. Mark `Date` as a date table (*Table tools → Mark as date table → Date*).

Relationships (*Model view*, drag column to column; all single direction, from the "one" side to the "many" side):

| From (many) | To (one) |
| --- | --- |
| `order_items[order_id]` | `orders[order_id]` |
| `order_items[product_id]` | `products[product_id]` |
| `order_items[seller_id]` | `sellers[seller_id]` |
| `orders[customer_id]` | `customers[customer_id]` |
| `order_payments[order_id]` | `orders[order_id]` |
| `order_reviews[order_id]` | `orders[order_id]` |
| `products[category]` | `product_cost_by_category[category]` |
| `orders[purchase_date]` | `Date[Date]` |
| `orders[channel]` | `Channel[Channel]` |
| `ad_spend_by_channel[month]` | `Date[Date]` |
| `ad_spend_by_channel[channel]` | `Channel[Channel]` |

Leave `fee_assumptions`, `order_channel_attribution` and `geolocation` unrelated (the measures read `fee_assumptions` with `LOOKUPVALUE`; the other two are for reference and maps).

## 4. Measures

From `measures.dax`:

1. On **order_items**, add the two calculated columns (*Table tools → New column*): `Cost %` and `Payment fee %`.
2. Create a measure table (*Home → Enter data*, one empty column, name it `_Measures`) and add every measure (*New measure*), keeping the names. Formats: currency measures `R$ #,0`; `%` measures as Percentage, 1 decimal; `ROAS` as `0.0"×"`.

Report-level filter: **Filters pane → Filters on all pages → `orders[order_status]` = delivered.** Margin and ROAS only make sense on delivered orders.

## 5. The four pages

Use the same header on every page: title, a period slicer (`Date[Month]`, between) and a small card **"Simulated inputs: product cost, fees, attribution and ad spend. Values in BRL (Olist, Brazil)."**

### Page 1 — Monthly P&L
- KPI cards: `Revenue`, `Net margin`, `Net margin %`, `Orders`, `Average order value`.
- **Line and clustered column chart**: X = `Date[Month]`; columns = `Revenue`; line = `Net margin %`.
- **Stacked bar** "Where the money goes": values `Freight`, `Commission`, `Payment fees`, `Product cost`, `Net margin` (each as its own series) — one bar for the selected period.
- **Matrix** P&L: rows = `Date[Month]`; values = `Revenue`, `Freight`, `Commission`, `Payment fees`, `Product cost`, `Net margin`, `Net margin %`.

### Page 2 — Product ranking by net margin
- KPI cards: `Loss-making products`, `Revenue from loss-making products %`.
- **Table**: `products[product_id]`, `products[category]`, `Orders`, `Revenue`, `Freight`, `Product cost`, `Net margin`, `Net margin %`. Sort by `Net margin` ascending so losses come first.
- **Bar chart**: `products[category]` by `Net margin` (top and bottom 10 with a *Top N* visual filter).
- Slicer: `products[category]`.

### Page 3 — Order drill-down
- **Table**: `orders[order_id]`, `orders[purchase_date]`, `orders[payment_type]`, `Revenue`, `Freight`, `Net margin`, `orders[delivery_days]`, `orders[is_late]`, `Average review score`.
- Cards: `Late delivery %`, `Average review score`.
- Turn on **drill-through**: on this page, add `products[product_id]` to *Drill through*, so right-clicking a product on page 2 opens its orders here.

### Page 4 — Marketing (all inputs simulated)
- Cards: `Ad spend`, `Attributed revenue`, `ROAS`, `New customers`, `Cost per new customer`, `Net margin after ads`.
- **Clustered bar** "ROAS by channel": Y = `Channel[Channel]`, X = `ROAS`, plus a **constant line** at 3 (*Analytics pane → Constant line*, label "Target 3×").
- **Table**: `Channel[Channel]`, `Ad spend`, `Attributed revenue`, `ROAS`, `New customers`, `Cost per new customer`.
- **Line chart**: `Date[Month]` × `ROAS`, legend `Channel[Channel]`.
- **Card** with the `Marketing note` measure (plain-language line naming the channels below 3×, ending with "(simulated ad spend)").

## 6. Conditional formatting

1. **Negative margin, red** — page 2 table → `Net margin` → *Conditional formatting → Background color → Format style: Rules*: if value `<` `0` (Number) → light red `#FDE2E1`; add the same rule on **Font color** → dark red `#9B1C1C`. Repeat for `Net margin %`.
2. **Whole row for loss-making products** — on every other column of that table: *Background color → Format style: Field value → based on field `Is loss-making`*, with *Rules*: `= 1` → `#FDE2E1`. Add a column with icons too (*Conditional formatting → Icons*, rules on `Net margin`: `< 0` → red diamond, `>= 0` → green circle), so it doesn't rely on colour alone.
3. **ROAS below target** — page 4 bar chart → *Bars → Color → fx → Rules on `Below ROAS target`*: `= 1` → orange `#E8692F`, else blue `#2F6FE8`. Same rule as background color on the `ROAS` column of the channel table.

## 7. Check the numbers

With no slicer selected, compare the report with **`data/data_report.txt` → Reference totals**:

| Report | data_report.txt |
| --- | --- |
| page 1 `Orders` card | `delivered_orders` |
| page 1 `Revenue` | `revenue_brl` |
| page 1 `Net margin` | `net_margin_brl` |
| page 2 `Loss-making products` | `loss_making_products` |
| page 4 `ROAS` per channel | `roas_by_channel` |

They should match to the cent (or to rounding). If one doesn't, check the relationship directions and the report filter in step 4.

## 8. Publish the result

- Save as `olist_profit.pbix` in this folder. Commit it if you want visitors to be able to download the report.
- Take screenshots of the four pages (1600×1000) and replace the mock-ups in `public/projects/ecommerce-profit-roas-dashboard/` with the same file names.
- Then tell me (or edit `content/projects/ecommerce-profit-roas-dashboard/project.json`): set `"status": "built"`, change "How I'd build it" to "What I built" in the three story files, and use the numbers the report shows — labeled **Simulated** wherever they depend on the simulated tables (loss-making products, net margin, ROAS).
