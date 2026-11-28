const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const context=vm.createContext({window:{},document:{addEventListener(){}}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/account.js'),'utf8'),context);
const {loadOrderHistory}=context.window.NordkernAccount;
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const user=id(999),orders=Array.from({length:30},(_,i)=>({id:id(i+1),user_id:user,public_number:'NK-TEST-'+i,status:'paid',currency:'eur',subtotal_cents:800,total_cents:800,refunded_cents:0,created_at:'2026-11-20T09:00:00Z',paid_at:'2026-11-20T09:01:00Z'}));
const items=orders.flatMap((o,i)=>Array.from({length:8},(_,j)=>({id:id(1000+i*8+j),order_id:o.id,title:'Fixture',quantity:1,unit_price_cents:100})));
function reader(transform=x=>x){let groups=0;return {get groups(){return groups;},read:async path=>{
 const q=new URL(path,'https://fixture.invalid');
 if(q.pathname.endsWith('/orders')){assert.equal(q.searchParams.get('order'),'created_at.desc,id.desc');return orders;}
 groups++;const ids=q.searchParams.get('order_id').slice(4,-1).split(',');assert.equal(ids.length,10);assert.equal(q.searchParams.get('limit'),'81');
 return transform(items.filter(item=>ids.includes(item.order_id)));
}};}
test('loads all 240 order lines, including the final ten orders',async()=>{
 const r=reader();const result=await loadOrderHistory(r.read,user);assert.equal(r.groups,3);assert.equal(result.items.length,240);
});
test('rejects missing, duplicate and foreign line items',async()=>{
 for(const transform of [rows=>rows.slice(0,-1),rows=>[...rows.slice(0,-1),rows[0]],rows=>[...rows.slice(0,-1),{...rows.at(-1),order_id:id(666)}]]){
  await assert.rejects(loadOrderHistory(reader(transform).read,user),/Bestellpositionen/);
 }
});
test('rejects duplicate or foreign orders',async()=>{
 for(const rows of [[orders[0],orders[0]],[{...orders[0],user_id:id(666)}]]) await assert.rejects(loadOrderHistory(async()=>rows,user),/Bestellhistorie/);
});
test('stops reading subsequent groups after account scope changes',async()=>{
 const r=reader();let checks=0;
 await assert.rejects(loadOrderHistory(r.read,user,()=>{if(++checks===2)throw new Error('session changed');}),/session changed/);
 assert.equal(r.groups,1);
});
