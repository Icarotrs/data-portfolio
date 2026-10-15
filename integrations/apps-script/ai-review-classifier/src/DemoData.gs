/**
 * Fictitious reviews for the demo, built from short templates per topic and
 * sentiment, with a few deliberately ambiguous or off-topic ones.
 * Deterministic: same seed → same reviews. Pure (tested in Node).
 */

var DEMO_REVIEW_TEMPLATES_ = {
  'Delivery time': {
    positive: ['Arrived two days early, really fast shipping.', 'Ordered Monday, here on Wednesday. Great.', 'Next-day delivery as promised.'],
    negative: ['Took almost three weeks to arrive and no tracking updates.', 'Delivery was a week late and nobody answered my emails.', 'Still waiting, the estimate passed five days ago.'],
    mixed: ['Slow to arrive but the product is lovely.', 'Late delivery, though the seller kept me posted.'],
  },
  Packaging: {
    positive: ['Beautifully packed, no plastic, arrived perfect.', 'Gift wrap was a nice touch.'],
    negative: ['Box was crushed and one glass was broken.', 'Way too much plastic in the packaging.', 'Arrived with the lid cracked, poorly packed.'],
    mixed: ['Box was damaged but the item itself was fine.'],
  },
  'Product quality': {
    positive: ['Excellent quality, feels like it will last years.', 'Exactly as described, sturdy and well made.', 'Third order, always perfect quality.'],
    negative: ['Broke after two uses.', 'Cheap material, the handle came loose in a week.', 'Paint started peeling straight away.'],
    neutral: ['It does the job.', 'Works as expected, nothing special.'],
  },
  'Size & fit': {
    negative: ['Runs very small, had to send it back.', 'Much bigger than the photos suggest.'],
    mixed: ['Runs a bit small, order one size up. Fabric is lovely.'],
    positive: ['True to size, fits perfectly.'],
  },
  'Price / value': {
    positive: ['Great value for the price.', 'Cheaper than in stores and better quality.'],
    negative: ['Overpriced for what you get.', 'Not worth the money.'],
    neutral: ['Fair price, average product.'],
  },
  'Customer service': {
    positive: ['Support sorted my exchange in one day, super friendly.', 'Quick and helpful reply from customer service.'],
    negative: ['Customer service never replied to three emails.', 'Rude answer from support when I asked about my order.'],
  },
  'Returns & refunds': {
    negative: ['Refund took 15 days after they received the return.', 'Return label did not work and no one helped.'],
    positive: ['Easy return, refund in two days.'],
    mixed: ['Return was easy but the refund took a while.'],
  },
};

var DEMO_AMBIGUOUS_ = [
  'Well, that was an experience.',
  'Bought it for my sister, she has not opened it yet.',
  'Oh great, another mug. Just what I needed.',
  '5 stars because the courier was nice I guess',
  'muy bueno',
  'ok',
];

function makeDemoReviews(count, seed) {
  var state = seed >>> 0;
  function rand() {
    state = (state + 0x6d2b79f5) >>> 0;
    var t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function pick(list) { return list[Math.floor(rand() * list.length)]; }
  var topics = Object.keys(DEMO_REVIEW_TEMPLATES_);
  var ratingFor = { positive: [4, 5, 5], negative: [1, 1, 2], neutral: [3, 3, 4], mixed: [3, 3, 4] };
  var start = new Date(2026, 0, 1).getTime();
  var out = [];
  for (var i = 0; i < count; i++) {
    var text, rating;
    if (rand() < 0.06) {
      text = pick(DEMO_AMBIGUOUS_);
      rating = 1 + Math.floor(rand() * 5);
    } else {
      var byS = DEMO_REVIEW_TEMPLATES_[pick(topics)];
      var sentiment = pick(Object.keys(byS));
      text = pick(byS[sentiment]);
      rating = pick(ratingFor[sentiment]);
      if (rand() < 0.15) text = text.toLowerCase();
      if (rand() < 0.1) text += ' ' + pick(['Thanks!', 'Would buy again?', 'Hmm.', '!!']);
    }
    out.push([
      'R-' + String(10001 + i),
      new Date(start + Math.floor(rand() * 280) * 86400000),
      rand() < 0.55 ? 'Shopify' : 'Amazon',
      rating,
      text,
    ]);
  }
  return out;
}
