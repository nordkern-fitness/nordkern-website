const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/shop.js'),'utf8');
const cartSource=fs.readFileSync(path.join(__dirname,'../js/shop-cart.js'),'utf8');
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const category=(n=1)=>({id:id(n),slug:'cat-'+n,title:'Kategorie '+n,sort_order:0,published:true});
const product=(n=101,cat=1)=>({id:id(n),category_id:id(cat),slug:'product-'+n,title:'Artikel '+n,subtitle:'',description:'Fixture',fulfillment:'digital_credit',price_cents:440,compare_at_price_cents:null,stock_quantity:null,sort_order:0,published:true});
function fixture(fetcher){
 const nodes={},store=new Map();let focused=null;
 function make(tag){return {tag,children:[],textContent:'',disabled:false,attrs:{},listeners:{},appendChild(n){this.children.push(n);},replaceChildren(...v){this.children=v;},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k]??null;},addEventListener(k,v){this.listeners[k]=v;},focus(){focused=this;},click(){this.listeners.click?.({preventDefault(){}});}};}
 for(const name of ['nkshop-grid','nkshop-status','nkshop-filters','nkshop-cart','nkshop-account-link','nkshop-cart-transition-hint'])nodes[name]=make('div');
 const document={getElementById:name=>nodes[name],createElement:make,addEventListener(){}};
 const window={NordkernCatalog:{publicConfig:{url:'https://fixture.supabase.co',publishableKey:'sb_publishable_fixture'}},setTimeout,clearTimeout};
 const sessionStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 const ctx=vm.createContext({window,document,sessionStorage,fetch:fetcher,AbortController,Intl});vm.runInContext(cartSource,ctx);vm.runInContext(source,ctx);
 return {api:window.NordkernShop,cart:window.NordkernShopCart,nodes,focused:()=>focused};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const reply=(cats,products)=>async url=>({ok:true,json:async()=>url.includes('shop_categories')?cats:products});
test('catalogue fails closed on duplicate IDs/slugs, unknown type and sentinel overflow',()=>{const {api}=fixture(reply([],[]));for(const [cats,items] of [[[category(),category()],[product()]],[[category(),{...category(2),slug:category().slug}],[product()]],[[category()],[product(),product()]],[[category()],[product(),{...product(102),slug:product().slug}]],[[category()],[{...product(),fulfillment:'unknown'}]],[Array.from({length:101},(_,i)=>category(i+1)),[]],[[category()],Array.from({length:101},(_,i)=>product(i+101))]])assert.throws(()=>api.parseCatalogue(cats,items));});
test('deterministic order and hidden category filter',()=>{const {api}=fixture(reply([],[]));const d=api.parseCatalogue([category(2),category(1)],[product(102,2),product(101,1),product(103,3)]);assert.deepEqual(Array.from(d.categories,c=>c.id),[id(1),id(2)]);assert.deepEqual(Array.from(d.products,p=>p.id),[id(101),id(102)]);});
test('fetches a sentinel with stable order and no member token',async()=>{const calls=[];const f=fixture(async(url,options)=>{calls.push({url,options});return reply([category()],[product()])(url);});await f.api.loadCatalogue();assert.equal(calls.length,2);assert.ok(calls.every(c=>c.url.includes('order=sort_order.asc,id.asc&limit=101')&&c.options.headers.Authorization===undefined));});
test('initial load and network failure suspend handoff without destroying cart, retry restores confirmed data',async()=>{let reject=true;const f=fixture(async url=>reject?{ok:false}:reply([category()],[product()])(url));f.cart.writeCart([{product_id:id(101),quantity:2}]);f.api.mount();assert.equal(f.nodes['nkshop-account-link'].attrs['aria-disabled'],'true');await tick();assert.equal(f.nodes['nkshop-account-link'].attrs['aria-disabled'],'true');assert.equal(f.cart.readCart()[0].quantity,2);assert.match(f.nodes['nkshop-cart-transition-hint'].textContent,/gespeicherte Auswahl bleibt erhalten/);reject=false;f.nodes['nkshop-grid'].children[0].click();await tick();assert.equal(f.nodes['nkshop-account-link'].attrs['aria-disabled'],'false');assert.equal(f.cart.readCart()[0].quantity,2);});
test('keyboard focus returns to selected filter and enabled quantity control after redraw',async()=>{const f=fixture(reply([category(1),category(2)],[product()]));f.api.mount();await tick();const filters=f.nodes['nkshop-filters'];filters.children[1].click();assert.equal(f.focused(),filters.children[1]);const controls=()=>f.nodes['nkshop-grid'].children[0].children.find(n=>n.className==='shop-card-controls-v3');controls().children[2].click();assert.equal(f.focused(),controls().children[2]);controls().children[0].click();assert.equal(controls().children[0].disabled,true);assert.equal(f.focused(),controls().children[2]);assert.equal(f.nodes['nkshop-account-link'].attrs['aria-disabled'],'true');});
