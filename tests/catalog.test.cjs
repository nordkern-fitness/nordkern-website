const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '../js/catalog.js'), 'utf8');

function loadBrowserModule(fetcher) {
  const window = {
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  };
  vm.runInNewContext(source, {
    window,
    document: {},
    AbortController,
    Intl,
    fetch: fetcher || (async () => { throw new Error('Should not fetch'); }),
  });
  return window.NordkernCatalog;
}

const plan = {
  slug: 'basic', name: 'Nordkern Basic', subtitle: '12 Monate',
  price_cents: 2990, checkout_price_cents: null,
  minimum_term_months: 12, billing_interval: 'month', credit_cycle: 'monthly',
  monthly_credits: { drinks: 3, creatine: 1, protein: 0 },
  features: ['24/7-Zugang'], promotion_badge: null, promotion_note: null,
  sort_order: 10, active: true,
};
const pass = {
  slug: 'day-pass', title: 'Nordkern Tagespass', subtitle: '24 Stunden',
  price_cents: 990, checkout_price_cents: null,
  duration_hours: 24, credit_cycle: 'one_time',
  included_credits: { drinks: 1, creatine: 1 },
  features: ['24 Stunden Zugang'],
  promotion_badge: null, promotion_note: null,
  sort_order: 10, active: true,
};

test('Validates active catalogue entries only', () => {
  const { validProduct } = loadBrowserModule();
  assert.equal(validProduct(plan, 'membership'), true);
  assert.equal(validProduct(pass, 'pass'), true);
  assert.equal(validProduct({ ...plan, active: false }, 'membership'), false);
  assert.equal(validProduct({ ...plan, price_cents: -100 }, 'membership'), false);
  assert.equal(validProduct({ ...plan, features: ['Valid', 4] }, 'membership'), false);
  assert.equal(validProduct({ ...pass, duration_hours: 0 }, 'pass'), false);
});

test('Uses only the public API key and filters out unpublished tariffs', async () => {
  const requests = [];
  const { loadCatalogue } = loadBrowserModule(async (url, options) => {
    requests.push({ url, options });
    return {
      ok: true,
      json: async () => url.includes('/membership_plans?') ? [plan] : [pass],
    };
  });
  const values = await loadCatalogue();
  assert.equal(values.length, 2);
  assert.equal(Array.from(values, x => x.kind).join(','), 'membership,pass');
  assert.equal(requests.length, 2);
  for (const r of requests) {
    assert.ok(r.url.includes('active=eq.true'));
    assert.ok(r.options.headers.apikey.startsWith('sb_publishable_'));
    assert.equal(r.options.headers.Authorization, undefined);
    assert.equal(r.options.cache, 'no-store');
  }
});

test('Rejects missing or invalid pricing data instead of showing stale prices', async () => {
  const { loadCatalogue } = loadBrowserModule(async url => ({
    ok: true,
    json: async () => url.includes('/membership_plans?')
      ? [{ ...plan, price_cents: null }] : [pass],
  }));
  await assert.rejects(loadCatalogue(), /unvollständig|fehlerhaft/i);
});

test('Rejects failed public catalogue API responses', async () => {
  const { loadCatalogue } = loadBrowserModule(async () => ({ ok: false, status: 503 }));
  await assert.rejects(loadCatalogue(), /nicht erreichbar/i);
});
