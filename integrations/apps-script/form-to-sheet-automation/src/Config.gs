/**
 * Form-to-Sheet Automation — shared settings.
 *
 * The Orders tab mixes two kinds of columns:
 *   - input columns, written by the script from each form response;
 *   - formula columns (one ARRAYFORMULA in the header row each), which the
 *     script never writes to, so they can't be overwritten.
 */
var CONFIG = {
  SHEETS: {
    ORDERS: 'Orders',
    SUMMARY: 'Summary',
    PRODUCTS: 'Products',
    SETTINGS: 'Settings',
  },

  // Orders tab layout (1-based column numbers).
  HEADERS: [
    'Received', // A  input
    'Order ID', // B  input (generated)
    'Customer', // C  input
    'Email', // D  input
    'Phone', // E  input
    'Product', // F  input (dropdown)
    'Quantity', // G  input
    'Unit price', // H  formula
    'Total', // I  formula
    'Status', // J  input (dropdown)
    'Delivery date', // K  input
    'Notes', // L  input
    'Week', // M  formula
  ],
  INPUT_BLOCKS: [
    { from: 1, to: 7 }, // A:G
    { from: 10, to: 12 }, // J:L
  ],
  COL: { ORDER_ID: 2, STATUS: 10 },

  STATUSES: ['New', 'Confirmed', 'Shipped', 'Cancelled'],

  // Form question titles → field names used by the script.
  QUESTIONS: {
    'Your name': 'name',
    Email: 'email',
    Phone: 'phone',
    Product: 'product',
    Quantity: 'quantity',
    'Delivery date': 'deliveryDate',
    Notes: 'notes',
  },

  // Settings tab keys (column A) and their defaults.
  SETTINGS_DEFAULTS: {
    Recipients: '', // filled with the installer's email by setupDemo()
    'Report day': 'MONDAY',
    'Report hour (0-23)': 8,
    'Email subject': 'Weekly orders summary',
  },

  ORDER_ID_PREFIX: 'ORD-',
  LOCK_TIMEOUT_MS: 30000,
};
