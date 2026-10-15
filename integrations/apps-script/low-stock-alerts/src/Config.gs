/**
 * Low-Stock Alerts — shared settings.
 */
var CONFIG = {
  SHEETS: {
    STOCK: 'Stock',
    SALES: 'Sales (last 30 days)',
    LOG: 'Reorder log',
    SETTINGS: 'Settings',
  },

  // Stock tab. Columns A:E are typed by a person; F:L are written by the script.
  STOCK_HEADERS: [
    'SKU', // A input
    'Product', // B input
    'Supplier', // C input
    'Lead time (days)', // D input
    'On hand', // E input
    'Units sold (30 days)', // F calc
    'Avg. sold / day', // G calc
    'Days of cover', // H calc
    'Reorder point', // I calc
    'Suggested order', // J calc
    'Status', // K calc
    'Last checked', // L calc
  ],
  STOCK_INPUT_COLS: 5,
  STOCK_CALC_FROM: 6,

  SALES_HEADERS: ['Date', 'Order', 'SKU', 'Product', 'Quantity', 'Financial status'],
  LOG_HEADERS: ['Checked at', 'SKU', 'Product', 'Status', 'On hand', 'Days of cover', 'Lead time (days)', 'Suggested order', 'Emailed to'],

  // Store export columns (Shopify "Export orders" CSV). Matched by header name.
  CSV_COLUMNS: {
    order: 'Name',
    date: 'Created at',
    quantity: 'Lineitem quantity',
    product: 'Lineitem name',
    sku: 'Lineitem sku',
    financialStatus: 'Financial Status',
  },
  // Line items with these financial statuses are not counted as sales.
  EXCLUDED_STATUSES: ['refunded', 'voided'],

  STATUS: {
    NOW: '● Reorder now',
    SOON: '▲ Reorder soon',
    OK: '✓ OK',
    NO_SALES: '– No sales',
  },

  SETTINGS_DEFAULTS: {
    Recipients: '',
    'Safety buffer (days)': 7,
    '"Reorder soon" window (days)': 7,
    'Order covers (days)': 45,
    'Sales window (days)': 30,
    'Daily check hour (0-23)': 7,
    'Sales CSV (Drive file ID)': '',
  },

  LOCK_TIMEOUT_MS: 30000,
};
