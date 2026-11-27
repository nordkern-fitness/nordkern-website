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

test('8.5 member portal exposes GoTrue signup, consent and verified member login',()=>{
  assert.match(html,/id="nk-login-form"/);
  assert.match(html,/id="nk-member-panel"/);
  assert.match(html,/id="nk-studio-select"/);
  assert.match(html,/id="nk-offer-select"/);
  assert.match(html,/data-header/);
  assert.match(header,/href="konto.html"/);
  assert.match(html,/id="nk-signup-form"[^>]+hidden/);
 assert.match(html,/id="nk-signup-studio"/);
 assert.match(html,/id="nk-signup-terms"/);
 assert.match(html,/id="nk-signup-privacy"/);
 assert.match(html,/href="impressum.html#agb"/);
 assert.match(html,/href="impressum.html#datenschutz"/);
 assert.match(source,/\/auth\/v1\/signup/);
 assert.match(source,/home_studio_slug:confirmed.homeStudioSlug/);
 assert.match(source,/marketing_accepted:false/);
  assert.doesNotMatch(source,/SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|ACCESS_READER_SECRET/);
});

test('server decides checkout entitlement, never browser redirects',()=>{
  assert.match(source,/\/functions\/v1\/create-offer-checkout/);
  assert.match(source,/returnSurface:'web'/);
  assert.match(source,/\/auth\/v1\/token\?grant_type=password/);
  assert.match(source,/records\.loadOwnedRecords\(scopedRead,'memberships',user\)/);
  assert.match(source,/sessionStorage/);
});

test('test checkout requires positive server capability, never only local browser flag',()=>{
  assert.match(source,/\/functions\/v1\/create-offer-checkout/);
  assert.match(source,/checkoutCapabilities\?\.webCheckoutEnabled === true/);
  assert.match(html,/id="nk-checkout-availability"/);
  assert.match(source,/\.catch\(\(\) => \(\{webCheckoutEnabled:false\}\)\)/);
});

test('email confirmation resend is a separate non-registration GoTrue operation',()=>{
  assert.match(html,/id="nk-confirmation-form"/);
  assert.match(html,/id="nk-confirmation-email"/);
  assert.match(source,/\/auth\/v1\/resend/);
  assert.match(source,/type:'signup',email/);
  assert.match(source,/nk-confirmation-form/);
  assert.match(source,/wenn eine Bestätigung aussteht/i);
  assert.match(html,/<form[^>]*id="nk-signup-form"/);
});

test('test billing portal cannot redirect members to arbitrary destinations',()=>{
  const {safeBillingPortalUrl}=loadAccount();
  assert.equal(safeBillingPortalUrl('https://billing.stripe.com/p/session/test_verified'),true);
  for(const url of [
    'http://billing.stripe.com/session',
    'https://billing.stripe.com.evil.invalid/',
    'https://checkout.stripe.com/',
    'https://person@billing.stripe.com/',
    null
  ])assert.equal(safeBillingPortalUrl(url),false);
});
test('billing portal remains disabled until authenticated server confirms test mode',()=>{
  assert.match(html,/id="nk-billing-portal" disabled/);
  assert.match(source,/\/functions\/v1\/create-test-billing-portal/);
  assert.match(source,/returnSurface:'web'/);
  assert.match(source,/!webCheckoutEnabled \|\| !session \|\| !activeUser/);
  assert.doesNotMatch(source,/sk_live_|STRIPE_SECRET_KEY|SERVICE_ROLE_KEY/);
});

test('existing web contracts show purchased snapshot price, not mutable catalogue prices',()=>{
  const {contractStatusLabel}=loadAccount();
  const contract={status:'active',starts_at:new Date(now-86400000).toISOString(),
    current_period_end:new Date(now+86400000).toISOString(),
    cancellation_effective_at:null,minimum_term_ends_at:'2027-11-12T10:00:00Z',
    contract_price_cents:2990,currency:'eur',
    pricing_snapshot:{plan_name:'Basic Altvertrag',billing_interval:'month',
      monthly_credits:{drinks:3,creatine:1}}};
  const before=contractStatusLabel(contract,now);
  assert.match(before,/Basic Altvertrag/);
  assert.match(before,/29,90/);
  assert.match(before,/Mindestlaufzeit/);
  assert.match(before,/Bezahlte Mitgliedschaft/);
  const unrelatedNewCataloguePrice=9990;
  assert.notEqual(contract.contract_price_cents,unrelatedNewCataloguePrice);
  assert.equal(contractStatusLabel(contract,now),before);
  const malformed=contractStatusLabel({...contract,contract_price_cents:-100,
    pricing_snapshot:{plan_name:'TEST',billing_interval:'month'}},now);
  assert.doesNotMatch(malformed,/Vertragspreis:/);
});

test('web contract clearly reflects Stripe portal cancellation and withdrawal',()=>{
 const {contractStatusLabel}=loadAccount();
 const contract={status:'active',starts_at:new Date(now-1000).toISOString(),
  current_period_end:new Date(now+86400000).toISOString(),
  cancellation_effective_at:new Date(now+43200000).toISOString(),
  minimum_term_ends_at:null,contract_price_cents:2990,currency:'eur',
  pricing_snapshot:{plan_name:'Basic Altvertrag',billing_interval:'month'}};
 assert.match(contractStatusLabel(contract,now),/Kündigung vorgemerkt zum:/);
 assert.doesNotMatch(contractStatusLabel({...contract,cancellation_effective_at:null},now),
  /Kündigung vorgemerkt/);
});

test('member device management uses scoped RLS reads and authenticated revoke RPC',()=>{
 assert.match(html,/id="nk-own-devices"/);
 assert.match(html,/id="nk-own-devices-reload"/);
 assert.match(source,/\/rest\/v1\/devices\?select=id,user_id,platform,last_seen_at,trusted_at,revoked_at/);
 assert.match(source,/&user_id=eq.'\+/);
 assert.match(source,/\/rest\/v1\/rpc\/revoke_own_device/);
 assert.match(source,/p_device_id:device\.id/);
 assert.match(source,/window\.confirm\('QR-Zutritt/);
 assert.match(source,/item\.user_id!==userId/);
 assert.doesNotMatch(source,/devices\?select=\*/);
 assert.doesNotMatch(source,/credential_hash|device_credential|service_role/);
});

test('8.4 account sections support contracts, orders and the installed test app without credentials in URLs',()=>{
  for (const id of ['vertraege','bestellungen','shop','geraete','konto-sicherheit']) {
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  for (const id of ['nk-order-filter','nk-order-count','nk-web-shop-cart']) {
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(html,/href="nordkernapp:\/\/\/profile"/);
  assert.match(html,/href="app.html"/);
  assert.doesNotMatch(html,/nordkernapp:[^"']*\?(?:[^"']*token|[^"']*email)/);
  const api=loadAccount();
  assert.equal(api.memberSectionFromHash('#vertraege'),'vertraege');
  assert.equal(api.memberSectionFromHash('#bestellungen'),'bestellungen');
  assert.equal(api.memberSectionFromHash('#shop'),'shop');
  assert.equal(api.memberSectionFromHash('#../admin'),null);
  assert.equal(api.memberSectionFromHash('#shop?access_token=secret'),null);
});

test('8.4 active membership uses original contract snapshot, cancellation and confirmed paid period',()=>{
  const api=loadAccount();
  const member={
    status:'active',starts_at:'2026-11-01T00:00:00Z',
    current_period_end:'2026-12-01T00:00:00Z',
    contract_price_cents:2990,currency:'eur',
    pricing_snapshot:{plan_name:'Basic Original',billing_interval:'month'},
    minimum_term_ends_at:'2027-10-31T00:00:00Z',
    cancellation_effective_at:null
  };
  const current=api.detailsForContract(member,now);
  assert.equal(current.name,'Basic Original');
  assert.equal(current.active,true);
  assert.match(current.lines.join(' '),/29,90/);
  assert.match(current.lines.join(' '),/Mindestlaufzeit/);
  const cancelled=api.detailsForContract({...member,cancellation_effective_at:'2026-11-12T15:00:00Z'},now);
  assert.equal(cancelled.active,false);
  assert.match(cancelled.lines.join(' '),/Kündigung vorgemerkt/);
  assert.equal(api.detailsForContract({...member,pricing_snapshot:{plan_name:'<script>\u003c/script>'}},now).name,
    '<script></script>');
  assert.equal(api.detailsForContract({...member,pricing_snapshot:{plan_name:'x'.repeat(161)}},now).name,
    'Mitgliedschaft');
});

test('8.4 order state labels are explicit and do not imply payments from browser redirect',()=>{
  const api=loadAccount();
  assert.equal(api.orderStatusName('pending_payment'),'Zahlung ausstehend');
  assert.match(api.orderStatusName('partially_refunded'),/Prüfung offen/);
  assert.equal(api.orderStatusName('unknown'),'Nicht bestätigt');
  assert.match(source,/orderSnapshot=\{orders,items\}/);
  assert.match(source,/renderPortalCart\(catalogue.products,canCheckout\)/);
  assert.match(source,/cartApi\.writeCart\(cartApi\.updateCart\(/);
  assert.match(source,/Die Weiterleitung ist kein Zahlungsnachweis|Eine Weiterleitung ist kein Zahlungsnachweis/);
  assert.doesNotMatch(source,/localStorage\.setItem\([^\n]*accessToken/);
});

test('8.5 regression: signup accepts realistic emails before checking studio availability',()=>{
  const api=loadAccount();
  const base={password:'safe-test-password-123',firstName:'Test',lastName:'Person',
    homeStudioSlug:'grevesmuehlen',acceptedTerms:true,acceptedPrivacy:true};
  assert.throws(()=>api.validateSignupInput({...base,email:'verify@nordkern.test'}),/Startstudio/);
  assert.throws(()=>api.validateSignupInput({...base,email:'person.smith+new@example.org'}),/Startstudio/);
  assert.throws(()=>api.validateSignupInput({...base,email:'broken-address'}),/gültige E-Mail/);
  assert.throws(()=>api.validateSignupInput({...base,email:'foo@invalid'}),/gültige E-Mail/);
});
