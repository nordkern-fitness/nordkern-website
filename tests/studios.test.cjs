const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../js/studios.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../standorte.html'), 'utf8');
function load(fetcher, status = { textContent: '' }) {
  const window = { setTimeout, clearTimeout };
  const document = {
    addEventListener() {},
    querySelector() { return status; }
  };
  vm.runInNewContext(source, { window, document, fetch: fetcher, AbortController });
  return { api: window.NordkernStudios, status };
}
const rows = [{ slug: 'grevesmuehlen', name: 'Grevesmühlen', active: true }];

test('public studio response validation rejects untrusted data', () => {
  const { api } = load(async () => { throw new Error('unexpected fetch'); });
  assert.equal(Boolean(api.validStudio(rows[0])), true);
  assert.equal(Boolean(api.validStudio({ ...rows[0], active: false })), false);
  assert.equal(Boolean(api.validStudio({ ...rows[0], slug: '<img>' })), false);
  assert.equal(Boolean(api.validStudio({ ...rows[0], name: 42 })), false);
});

test('site reads only active studios through the public Supabase key', async () => {
  const requests = [];
  const { api } = load(async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => rows };
  });
  const result = await api.loadStudios();
  assert.equal(result.length, 1);
  assert.match(requests[0].url, /\/rest\/v1\/studios\?select=slug,name,active&active=eq.true/);
  assert.match(requests[0].options.headers.apikey, /^sb_publishable_/);
  assert.equal(requests[0].options.cache, 'no-store');
});

test('site refuses corrupt data instead of inventing an opening date', async () => {
  const { api } = load(async () => ({ ok: true, json: async () => [{ ...rows[0], active: false }] }));
  await assert.rejects(api.loadStudios());
  const { api: invalid, status } = load(async () => { throw new Error('offline'); });
  await invalid.mount();
  assert.match(status.textContent, /nicht bestätigt/);
});

test('planned Grevesmühlen studio is not advertised as operational', () => {
  assert.equal(html.includes('Aktiver Standort'), false);
  assert.match(html, /Standort in Planung/);
  assert.match(html, /data-nk-studio-data-status/);
  assert.match(html, /js\/studios\.js/);
});
