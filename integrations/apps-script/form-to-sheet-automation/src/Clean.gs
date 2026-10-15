/**
 * Pure cleanup functions: no Google services here, so they run (and are
 * tested) in Node as well. See tests/clean.test.mjs.
 */

/** Trims and collapses inner whitespace. Non-strings become ''. */
function cleanText(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

/** "  maria   DE souza " → "Maria de Souza". Short particles stay lowercase. */
function titleCaseName(value) {
  var small = ['de', 'da', 'do', 'dos', 'das', 'van', 'von', 'der', 'del', 'la', 'le'];
  return cleanText(value)
    .toLowerCase()
    .split(' ')
    .map(function (word, i) {
      if (!word) return word;
      if (i > 0 && small.indexOf(word) !== -1) return word;
      // Capitalize each part of hyphenated or apostrophe names: o'neil → O'Neil
      return word.replace(/(^|[-'])([a-zà-ÿ])/g, function (m, sep, ch) {
        return sep + ch.toUpperCase();
      });
    })
    .join(' ');
}

/** Lowercased, trimmed email, or '' when it is not a plausible address. */
function normalizeEmail(value) {
  var email = cleanText(value).toLowerCase().replace(/\s/g, '');
  return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email) ? email : '';
}

/**
 * US numbers become "(555) 123-4567". Other numbers keep their digits with a
 * leading "+". Returns '' when there are fewer than 7 digits.
 */
function normalizePhone(value) {
  var raw = cleanText(value);
  var digits = raw.replace(/\D/g, '');
  var hasUsCode = digits.length === 11 && digits.charAt(0) === '1';
  if (hasUsCode) digits = digits.slice(1);
  if (digits.length === 10 && (hasUsCode || raw.charAt(0) !== '+')) {
    return '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6);
  }
  if (digits.length >= 7) return '+' + digits;
  return '';
}

var MONTHS_ = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Accepts a Date, "2026-10-21", "10/21/2026", "10/21/26" (US order),
 * "Oct 21 2026" or "21 Oct 2026". Returns a Date at local midnight, or null.
 */
function normalizeDate(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return isNaN(value.getTime()) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  var s = cleanText(value).toLowerCase().replace(/,/g, '');
  if (!s) return null;
  var y, m, d, match;

  if ((match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    y = +match[1]; m = +match[2] - 1; d = +match[3];
  } else if ((match = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2}|\d{4})$/))) {
    m = +match[1] - 1; d = +match[2]; y = +match[3];
    if (y < 100) y += 2000;
  } else if ((match = s.match(/^([a-z]{3})[a-z]*\.? (\d{1,2})(?:st|nd|rd|th)? (\d{4})$/))) {
    m = MONTHS_[match[1]]; d = +match[2]; y = +match[3];
  } else if ((match = s.match(/^(\d{1,2}) ([a-z]{3})[a-z]*\.? (\d{4})$/))) {
    d = +match[1]; m = MONTHS_[match[2]]; y = +match[3];
  } else {
    return null;
  }
  if (m === undefined) return null;
  var date = new Date(y, m, d);
  // Reject overflow such as 02/31 → March 3
  if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) return null;
  return date;
}

/** A whole number from 1 to 10,000, or null. Accepts "3", " 3 units", 3. */
function parseQuantity(value) {
  var match = cleanText(value).match(/^(\d{1,5})\b/);
  if (!match) return null;
  var n = +match[1];
  return n >= 1 && n <= 10000 ? n : null;
}

/**
 * Turns raw form answers into a clean order record.
 * `answers` uses the field names in CONFIG.QUESTIONS.
 * `products` is the list of valid product names (the dropdown values).
 * Returns { record, problems } — problems are short, human-readable notes;
 * the row is still written so nothing is lost, and the notes go on the row.
 */
function cleanSubmission(answers, products) {
  var problems = [];
  var name = titleCaseName(answers.name);
  if (!name) problems.push('Missing customer name');

  var rawEmail = cleanText(answers.email);
  var email = normalizeEmail(rawEmail);
  if (rawEmail && !email) problems.push('Email looks invalid: "' + rawEmail + '"');

  var rawPhone = cleanText(answers.phone);
  var phone = normalizePhone(rawPhone);
  if (rawPhone && !phone) problems.push('Phone looks invalid: "' + rawPhone + '"');

  var product = cleanText(answers.product);
  var known = (products || []).filter(function (p) {
    return p.toLowerCase() === product.toLowerCase();
  })[0];
  if (known) product = known;
  else problems.push('Unknown product: "' + product + '"');

  var quantity = parseQuantity(answers.quantity);
  if (quantity === null) problems.push('Quantity is not a whole number: "' + cleanText(answers.quantity) + '"');

  var rawDate = answers.deliveryDate;
  var deliveryDate = normalizeDate(rawDate);
  if (cleanText(rawDate) && !deliveryDate) problems.push('Delivery date not understood: "' + cleanText(rawDate) + '"');

  return {
    record: {
      name: name,
      email: email || rawEmail,
      phone: phone || rawPhone,
      product: product,
      quantity: quantity === null ? cleanText(answers.quantity) : quantity,
      deliveryDate: deliveryDate || cleanText(rawDate),
      notes: cleanText(answers.notes),
    },
    problems: problems,
  };
}
