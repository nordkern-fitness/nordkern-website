const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/shop.js'),'utf8');
const html=fs.readFileSync(path.join(root,'shop.html'),'utf8');
const header=fs.readFileSync(path.join(root,'components/header.html'),'utf8');
const cat='11111111-1111-4111-8111-111111111111';
const category={id:cat,slug:'zubehoer',title:'Zubehör',published:true,sort_order:0};
const product={id:'22222222-2222-4222-8222-222222222222',
 category_id:cat,slug:'shaker',title:'Nordkern Shaker',subtitle:'',
 description:'Ein Shaker.',fulfillment:'shipping',price_cents:1490,
 compare_at_price_cents:null,stock_quantity:4,published:true,sort_order:0};
function load(mockFetch=()=>{throw Error('unexpected fetch');}){
 const window={NordkernCatalog:{publicConfig:{url:'https://example.supabase.co',
   publishableKey:'sb_publishable_test_key'}},setTimeout,clearTimeout};
 const document={addEventListener(){}};
 vm.runInNewContext(source,{window,document,fetch:mockFetch,AbortController,Intl});
 return window.NordkernShop;
}
test('only explicitly published and well-formed categories and products render',()=>{
 const api=load();
 assert.equal(api.validCategory(category),true);
 assert.equal(api.validProduct(product),true);
 assert.equal(api.validCategory({...category,published:false}),false);
 assert.equal(api.validProduct({...product,price_cents:-10}),false);
 assert.equal(api.validProduct({...product,stock_quantity:-1}),false);
 assert.equal(api.validProduct({...product,title:'<img>'.repeat(50)}),false);
});
test('category permission scope removes products from unpublished categories',()=>{
 const api=load();
 const data=api.parseCatalogue([category],[product,
   {...product,category_id:'33333333-3333-4333-8333-333333333333'}]);
 assert.equal(data.products.length,1);
 assert.equal(data.products[0].price_cents,1490);
});
test('published shop uses only public Supabase GET requests and never checkout',async()=>{
 const calls=[];
 const api=load(async(url,options)=>{
   calls.push({url,options});
   return {ok:true,json:async()=>url.includes('shop_categories')?[category]:[product]};
 });
 const data=await api.loadCatalogue();
 assert.equal(data.products.length,1);
 assert.equal(calls.length,2);
 assert.ok(calls.every(c=>c.url.includes('published=eq.true') &&
   c.options.headers.apikey==='sb_publishable_test_key' && !c.options.method));
 assert.doesNotMatch(source,/stripeSecret|STRIPE_SECRET_KEY|service_role|create-checkout-session/);
});
test('API failures are surfaced; no stale or invented shop inventory',async()=>{
 const api=load(async()=>({ok:false,status:503}));
 await assert.rejects(api.loadCatalogue());
 assert.deepEqual(load().parseCatalogue([],[]).products.length,0);
});
test('shop is navigable and contains no premature purchase buttons',()=>{
 assert.match(html,/js\/shop\.js/);
 assert.match(html,/id="nkshop-grid"/);
 assert.match(header,/href="shop.html"/);
 assert.match(html,/Bestellung ist noch nicht möglich/);
 assert.doesNotMatch(html,/<button[^>]*>.*?(kaufen|bestellen).*?<\/button>/i);
});
