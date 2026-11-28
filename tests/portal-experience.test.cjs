const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/account.js'),'utf8');

class Node {
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.disabled=false;this.value='';
   this.attrs={};this.listeners={};this._text='';}
 set textContent(value){this._text=String(value);this.children=[];}
 get textContent(){return this._text+this.children.map(x=>x.textContent).join(' ');}
 appendChild(node){this.children.push(node);return node;}
 replaceChildren(...nodes){this._text='';this.children=[...nodes];}
 setAttribute(key,value){this.attrs[key]=String(value);}
 addEventListener(key,fn){this.listeners[key]=fn;}
 querySelectorAll(){return [];}
}
function setup(){
 const ids=new Map();
 const document={
   createElement:tag=>new Node(tag),
   createTextNode:content=>{const n=new Node('#text');n.textContent=content;return n;},
   getElementById:id=>{if(!ids.has(id))ids.set(id,new Node('div'));return ids.get(id);},
   addEventListener(){},
 };
 const rowId='11111111-1111-4111-8111-111111111111';
 const product={id:rowId,title:'Nordkern <em>Digital</em>',
   price_cents:399,fulfillment:'digital_credit',published:true,stock_quantity:null};
 const stored=[];
 let failWrites=false;
 const cart={
   readCart:()=>stored.map(x=>({...x})),
   publishedCart:(rows,products)=>rows.filter(x=>products.some(p=>
     p.id===x.product_id&&p.fulfillment==='digital_credit'&&p.stock_quantity===null)),
   validCart:rows=>rows.length<=8&&rows.every(x=>x.quantity>=1&&x.quantity<=10),
   updateCart:(rows,id,delta)=>{
     const next=rows.map(x=>({...x}));
     const index=next.findIndex(x=>x.product_id===id);
     if(index===-1&&delta>0)next.push({product_id:id,quantity:1});
     else if(index>=0){next[index].quantity+=delta;
       if(next[index].quantity===0)next.splice(index,1);}
     return next;
   },
   writeCart:rows=>{if(failWrites)throw Error('session storage disabled');
     stored.splice(0,stored.length,...rows.map(x=>({...x})));},
 };
 const window={NordkernCatalog:{publicConfig:{
   url:'https://example.supabase.co',publishableKey:'sb_publishable_test'}},
   NordkernShopCart:cart,location:{hash:''}};
 const injected=source.replace('  window.NordkernAccount = {',
   '  window.__test = {renderContractOverview,renderPortalCart,renderOrders,'+
   'setOrders:rows=>{orderSnapshot=rows}};\n  window.NordkernAccount = {');
 vm.runInNewContext(injected,{window,document,URL,Date,Intl,AbortController,URLSearchParams});
 const get=id=>document.getElementById(id);
 return {ui:window.__test,get,stored,cart,product,rowId,
   setWriteFailure:next=>{failWrites=next;}};
}
function text(node){return node.textContent;}

test('8.4 real DOM rendering separates paid original contract snapshot, passes and wallet',()=>{
 const h=setup();
 const now=Date.parse('2026-11-20T12:00:00Z');
 const membership={status:'active',starts_at:'2026-11-01T00:00:00Z',
   current_period_end:'2026-12-01T00:00:00Z',
   contract_price_cents:2990,currency:'eur',
   pricing_snapshot:{plan_name:'Basic <script>NO EXECUTION</script>',billing_interval:'month'},
   minimum_term_ends_at:'2027-10-31T00:00:00Z'};
 h.ui.renderContractOverview([membership],[{
   title:'Tagespass',status:'active',starts_at:'2026-11-19T00:00:00Z',
   expires_at:'2026-11-21T00:00:00Z'
 }],{drinks:3,additional_drinks:0,creatine:1,protein:0},now);
 const out=h.get('nk-member-contracts');
 assert.equal(out.children.length,3);
 assert.match(text(out),/Basic <script>NO EXECUTION<\/script>/);
 assert.match(text(out),/29,90/);
 assert.match(text(out),/Kündigung|Mindestlaufzeit/);
 assert.match(text(out),/Tagespass/);
 assert.match(text(out),/Freigetränke: 3/);
 assert.equal(out.children[0].children[1].dataset.active,'true');
 assert.equal(out.children[0].children.some(x=>x.tag==='script'),false);
});

test('8.4 portal cart allows quantity editing and disables checkout when empty',()=>{
 const h=setup();
 h.stored.push({product_id:h.rowId,quantity:1});
 h.ui.renderPortalCart([h.product],true);
 assert.equal(h.get('nk-web-shop-checkout').disabled,false);
 const row=h.get('nk-web-shop-cart').children[0];
 const controls=row.children[1];
 controls.children[2].listeners.click();
 assert.equal(h.stored[0].quantity,2);
 const updated=h.get('nk-web-shop-cart').children[0].children[1];
 updated.children[0].listeners.click();
 assert.equal(h.stored[0].quantity,1);
 h.get('nk-web-shop-cart').children[0].children[1].children[0].listeners.click();
 assert.equal(h.stored.length,0);
 assert.equal(h.get('nk-web-shop-checkout').disabled,true);
 assert.match(text(h.get('nk-web-shop-cart')),/leer/);
});

test('8.4 unpublished cart items cannot be checkout lines and write failure is visible',()=>{
 const h=setup();
 h.stored.push({product_id:h.rowId,quantity:1});
 h.ui.renderPortalCart([],true);
 assert.equal(h.stored.length,0);
 assert.equal(h.get('nk-web-shop-checkout').disabled,true);
 h.stored.push({product_id:h.rowId,quantity:1});
 h.ui.renderPortalCart([h.product],true);
 h.setWriteFailure(true);
 h.get('nk-web-shop-cart').children[0].children[1].children[2].listeners.click();
 assert.equal(h.stored[0].quantity,1);
 assert.match(text(h.get('nk-web-shop-checkout-status')),/nicht gespeichert/);
});

test('8.4 order status filter renders scoped history, not browser-return claims',()=>{
 const h=setup();
 const order={id:'22222222-2222-4222-8222-222222222222',
   public_number:'NK-TEST-13',status:'pending_payment',
   total_cents:399,currency:'eur',created_at:'2026-11-20T08:00:00Z',paid_at:null};
 h.ui.setOrders({orders:[order],items:[{order_id:order.id,
   title:'Digitaler Credit',unit_price_cents:399,quantity:1}]});
 h.get('nk-order-filter').value='all';
 h.ui.renderOrders();
 assert.match(text(h.get('nk-web-order-history')),/Zahlung ausstehend/);
 assert.match(text(h.get('nk-order-count')),/1 von 1/);
 h.get('nk-order-filter').value='paid';
 h.ui.renderOrders();
 assert.match(text(h.get('nk-web-order-history')),/keine Bestellungen gefunden/);
 assert.match(text(h.get('nk-order-count')),/0 von 1/);
});
