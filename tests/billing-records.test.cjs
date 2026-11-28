const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const window={NordkernCatalog:{publicConfig:{url:'https://example.supabase.co',publishableKey:'sb_publishable_fixture'}}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/account.js'),'utf8'),{window,document:{addEventListener(){}},URL,Date,Intl,AbortController,URLSearchParams});
const a=window.NordkernAccount;
const id='11111111-1111-4111-8111-111111111111';
const row={id,user_id:id,source_kind:'invoice',membership_id:id,order_id:null,pass_id:null,parent_id:null,number:'SYN-001',issued_at:'2026-01-01T10:00:00Z',observed_at:'2026-01-01T10:00:00Z',currency:'eur',provider_status:'paid',total_cents:2990,provider_paid_cents:2990,remaining_cents:0,received_cents:null,refunded_cents:null,pre_credit_cents:0,post_credit_cents:0,document_available:true};
test('provider paid without captured cash is not confirmed payment',()=>{
 assert.equal(a.billingRecord(row,id),true);
 assert.match(a.billingLabel(row),/Geldfluss nicht bestätigt/);
 assert.equal(a.billingLabel({...row,received_cents:2990,refunded_cents:2990}),'Vollständig erstattet');
});
test('billing records reject foreign or inconsistent relations and amounts',()=>{
 for(const bad of [{...row,user_id:'foreign'},{...row,order_id:id},{...row,refunded_cents:1},{...row,number:null},{...row,total_cents:-1}])assert.equal(a.billingRecord(bad,id),false);
});
test('only precise Stripe document hosts and paths allowed',()=>{
 assert.equal(a.safeBillingDocument('https://pay.stripe.com/invoice/synthetic/pdf'),true);
 for(const bad of ['http://pay.stripe.com/invoice/x','https://pay.stripe.com.evil.example/invoice/x','https://pay.stripe.com@evil.example/invoice/x','https://pay.stripe.com:444/invoice/x','https://pay.stripe.com/unrelated','javascript:alert(1)'])assert.equal(a.safeBillingDocument(bad),false);
});
