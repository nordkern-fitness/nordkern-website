const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/account.js'),'utf8');
const window={NordkernCatalog:{publicConfig:{url:'https://example.supabase.co',publishableKey:'sb_publishable_fixture'}}};
const document={addEventListener(){}};
vm.runInNewContext(source,{window,document,URL,Date,Intl,AbortController,URLSearchParams});
const api=window.NordkernAccount;
const user='11111111-1111-4111-8111-111111111111';
const row={id:'22222222-2222-4222-8222-222222222222',user_id:user,kind:'creatine',amount:-1,reason:'Synthetic debit',created_at:'2026-01-01T12:00:00.123456+00:00'};
test('wallet ledger only validates own confirmed nonzero unit entries',()=>{
 assert.equal(api.validLedgerEntry(row,user),true);
 for(const bad of [{...row,user_id:row.id},{...row,amount:0},{...row,kind:'__proto__'},{...row,created_at:'invalid'}])assert.equal(api.validLedgerEntry(bad,user),false);
});
test('wallet page preserves microsecond cursor and limits page size',()=>{
 const rows=Array.from({length:31},(_,i)=>({...row,id:'22222222-2222-4222-8222-'+String(i).padStart(12,'0')}));
 const page=api.walletLedgerPage(rows,user);
 assert.equal(page.entries.length,30);
 assert.equal(page.next.id,rows[29].id);
 assert.equal(page.next.created_at,row.created_at);
 assert.match(decodeURIComponent(api.walletLedgerPath(user,page.next)),/created_at\.lt\.2026-01-01T12:00:00\.123456\+00:00/);
 assert.throws(()=>api.walletLedgerPage([row,row],user));
 assert.throws(()=>api.walletLedgerPath(user,{...page.next,created_at:'bad,operator'}));
});
