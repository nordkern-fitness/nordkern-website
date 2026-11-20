const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
const start = source.indexOf('const safeHashTarget = (hash) => {');
const end = source.indexOf('\n\n  const getSamePageHashTarget', start);
assert.ok(start > 0 && end > start, 'safe fragment helper exists');
const found = new Map([['kontaktformular', { id: 'kontaktformular' }], ['a:b', { id: 'a:b' }]]);
const getId = [];
const safeHashTarget = vm.runInNewContext(
  '(' + source.slice(start, end).replace(/^const safeHashTarget = /, '').replace(/;\s*$/, '') + ')',
  { document: { getElementById(id) { getId.push(id); return found.get(id) || null; } }, decodeURIComponent }
);

test('URL fragments resolve as element IDs, not CSS selectors', () => {
  assert.equal(safeHashTarget('#kontaktformular').id, 'kontaktformular');
  assert.equal(safeHashTarget('#a%3Ab').id, 'a:b');
  assert.equal(getId.at(-1), 'a:b');
});
test('invalid fragment never crashes site navigation', () => {
  assert.equal(safeHashTarget('#%'), null);
  assert.equal(safeHashTarget('#%ZZ'), null);
  assert.equal(safeHashTarget('#%00'), null);
  assert.equal(safeHashTarget('#'), null);
  assert.equal(safeHashTarget('#missing'), null);
});
test('oversized/invalid inputs are rejected', () => {
  assert.equal(safeHashTarget('not-a-fragment'), null);
  assert.equal(safeHashTarget('#' + 'A'.repeat(2100)), null);
  assert.equal(safeHashTarget(null), null);
});
