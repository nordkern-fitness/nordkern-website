const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/account.js'),'utf8');
function scope(){
 const window={NordkernCatalog:{publicConfig:{url:'https://example.supabase.co',publishableKey:'sb_publishable_test'}}};
 const document={addEventListener(){}};
 vm.runInNewContext(source,{window,document,URL,Date,Intl,AbortController,URLSearchParams});
 return window.NordkernAccount.createSessionScope();
}
test('9.3 web login lifetime refuses old results after logout and even same-account re-login',async()=>{
 const s=scope();const initial=s.capture();s.advance();
 assert.equal(s.isCurrent(initial),false);
 const account=s.capture();
 let finish;const network=new Promise(resolve=>{finish=resolve;});
 const result=network.then(()=>s.assertCurrent(account));
 s.advance();s.advance();finish();
 await assert.rejects(result,/Sitzung wurde während der Anfrage geändert/);
 assert.equal(s.isCurrent(s.capture()),true);
});
test('9.3 web account loaders and device handlers check the captured session scope',()=>{
 assert.match(source,/await request\(path, \{ \.\.\.options, token: credential, scope \}\);\s*sessionScope\.assertCurrent\(scope\)/);
 assert.match(source,/await loadShopAccount\(checkoutAvailable,user,scope\);\s*sessionScope\.assertCurrent\(scope\)/);
 assert.match(source,/await loadOwnDevices\(userId,scope\);\s*sessionScope\.assertCurrent\(scope\)/);
 assert.match(source,/if\(!sessionScope\.isCurrent\(scope\)\)return;\s*shopCheckoutReady=false/);
 assert.match(source,/shopCart = \[\];\s*session = null/);
 assert.doesNotMatch(source,/Dieses Gerät war bereits gesperrt/);
});
