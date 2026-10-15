# E-commerce Profit & ROAS Dashboard (Power BI kit)

Data preparation, simulated inputs, DAX measures and a step-by-step guide to build a four-page Power BI report on the public **Olist** dataset (a Brazilian marketplace, values in BRL):

1. Monthly P&L
2. Product ranking by net margin (loss-making products in red)
3. Order drill-down
4. Marketing: ad spend, attributed revenue, ROAS and cost per new customer per channel

The `.pbix` itself is built by hand in Power BI Desktop: follow **[REPORT-GUIDE.md](REPORT-GUIDE.md)**.

- `prepare_data.py`: cleans the 8 Olist tables and writes the simulated product cost, fee, attribution and ad spend tables (each row marked `is_simulated = TRUE`), plus reference totals to check the finished report against.
- `measures.dax`: every measure, commented. Net margin per order line = price - freight - marketplace fee - payment fee - product cost.
- Tests: `python -m pytest -q` (12 tests on a small dataset with Olist's file layout).

Product cost, fees, channel attribution and ad spend are simulated: Olist does not publish them. No number from this report describes a real store's costs or marketing.
