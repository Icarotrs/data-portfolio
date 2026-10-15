/**
 * AI Review Classifier — shared settings.
 */
var CONFIG = {
  SHEETS: {
    REVIEWS: 'Reviews',
    RUNS: 'Runs',
    HAND_CHECK: 'Hand check',
    SETTINGS: 'Settings',
  },

  // Reviews tab. A:E come from the store export; F:L are written by the script.
  REVIEW_HEADERS: [
    'Review ID', // A
    'Date', // B
    'Source', // C
    'Rating', // D
    'Review', // E
    'Topic (AI)', // F
    'Sentiment (AI)', // G
    'Summary (AI)', // H
    'Confidence (AI)', // I
    'Needs a person', // J
    'Tagged at', // K
    'Model', // L
  ],
  COL: { ID: 1, REVIEW: 5, TOPIC: 6, NEEDS_CHECK: 10 },
  OUTPUT_FROM: 6,
  OUTPUT_WIDTH: 7,

  TOPICS: [
    'Delivery time',
    'Packaging',
    'Product quality',
    'Size & fit',
    'Price / value',
    'Customer service',
    'Returns & refunds',
    'Other',
  ],
  SENTIMENTS: ['positive', 'negative', 'neutral', 'mixed'],
  ERROR_TOPIC: 'ERROR',

  RUN_HEADERS: ['Run started', 'Run finished', 'Provider', 'Model', 'Reviews tagged', 'Errors', 'API calls', 'Wall-clock seconds', 'Script seconds', 'Executions'],

  SETTINGS_DEFAULTS: {
    Provider: 'Claude', // Claude | OpenAI
    'Claude model': 'claude-opus-5-5',
    'OpenAI model': '', // required when Provider = OpenAI
    'Claude effort (low/medium/high)': 'low',
    'Batch size': 25,
    'Confidence threshold (0-1)': 0.8,
    'Nightly run hour (0-23)': 2,
  },

  // Apps Script stops a run after 6 minutes; stop starting new batches after this.
  MAX_RUN_MS: 4.5 * 60 * 1000,
  RESUME_AFTER_MS: 60 * 1000,
  HAND_CHECK_SIZE: 300,
  LOCK_TIMEOUT_MS: 10000,
};
