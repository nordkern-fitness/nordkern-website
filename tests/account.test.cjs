const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/account.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../konto.html'), 'utf8');
const header = fs.readFileSync(path.join(__dirname, '../components/header.html'), 'utf8');

function loadAccount() {
  const document = { addEventListener() {} };
  const window = { NordkernCatalog: { publicConfig: {
    url:'https://example.supabase.co',publishableKey:'sb_publishable_nordkern_test'
  } } };
  vm.runInNewContext(source,{window,document,URL,Date,Intl,AbortController,URLSearchParams});
  return window.NordkernAccount;
}
const user='11111111-1111-4111-8111-111111111111';
const now=Date.parse('2026-11-12T16:00:00Z');

test('only complete short-lived authenticated sessions are accepted',()=>{
  const api=loadAccount();
  assert.equal(api.validSession({accessToken:'a'.repeat(40),refreshToken:'r'.repeat(40),
    userId:user,expiresAt:now+3600000}),true);
  assert.equal(api.validSession({accessToken:'a',refreshToken:'r',userId:user,expiresAt:now}),false);
  assert.equal(api.validSession({accessToken:'a'.repeat(40),refreshToken:'r'.repeat(40),
    userId:'not-uuid',expiresAt:now}),false);
  assert.equal(api.validSession(null),false);
});

test('checkout returns only Stripe HTTPS destinations, never attacker redirects',()=>{
  const { safeCheckoutUrl }=loadAccount();
  assert.equal(safeCheckoutUrl('https://checkout.stripe.com/c/pay/cs_test_123'),true);
  for(const value of [
    'http://checkout.stripe.com/c/pay/123',
    'https://checkout.stripe.com.evil.example/checkout',
    'https://evil@checkout.stripe.com/',
    'https://stripe.com/',
    'javascript:alert(1)',
    null
  ]) assert.equal(safeCheckoutUrl(value),false,String(value));
});

test('website and app agree on active paid membership window',()=>{
  const { paidMembership }=loadAccount();
  const membership={status:'active',starts_at:new Date(now-60000).toISOString(),
    current_period_end:new Date(now+86400000).toISOString(),cancellation_effective_at:null};
  assert.equal(paidMembership(membership,now),true);
  assert.equal(paidMembership({...membership,status:'paused'},now),false);
  assert.equal(paidMembership({...membership,current_period_end:null},now),false);
  assert.equal(paidMembership({...membership,current_period_end:new Date(now-100).toISOString()},now),false);
  assert.equal(paidMembership({...membership,cancellation_effective_at:new Date(now-100).toISOString()},now),false);
});

test('member portal only exposes existing-user login, not unapproved registration',()=>{
  assert.match(html,/id="nk-login-form"/);
  assert.match(html,/id="nk-member-panel"/);
  assert.match(html,/id="nk-studio-select"/);
  assert.match(html,/id="nk-offer-select"/);
  assert.match(html,/data-header/);
  assert.match(header,/href="konto.html"/);
  assert.doesNotMatch(html, /<form[^>]+sign-?up/);
  assert.doesNotMatch(source,/SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|ACCESS_READER_SECRET/);
});

test('server decides checkout entitlement, never browser redirects',()=>{
  assert.match(source,/\/functions\/v1\/create-offer-checkout/);
  assert.match(source,/returnSurface:'web'/);
  assert.match(source,/\/auth\/v1\/token\?grant_type=password/);
  assert.match(source,/\/rest\/v1\/memberships\?select=/);
  assert.match(source,/sessionStorage/);
});

test('test checkout requires positive server capability, never only local browser flag',()=>{
  assert.match(source,/\/functions\/v1\/create-offer-checkout/);
  assert.match(source,/checkoutCapabilities\?\.webCheckoutEnabled === true/);
  assert.match(html,/id="nk-checkout-availability"/);
  assert.match(source,/\.catch\(\(\) => \(\{webCheckoutEnabled:false\}\)\)/);
});
