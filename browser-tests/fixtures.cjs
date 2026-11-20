/**
 * 8.5 real Chromium tests, controlled NETWORK fixtures only.
 * No calls are allowed to nordkern-dev, Stripe, GoTrue, or physical readers.
 * This is a browser/UX check, not a real backend acceptance test.
 */
const SUPABASE_ORIGIN='https://mfaqlfsaatmhvcqlpzoz.supabase.co';
const USER='11111111-1111-4111-8111-111111111111';
const STUDIO='22222222-2222-4222-8222-222222222222';
const CATEGORY='33333333-3333-4333-8333-333333333333';
const PRODUCT='44444444-4444-4444-8444-444444444444';
const MEMBERSHIP='55555555-5555-4555-8555-555555555555';
const ORDER_A='66666666-6666-4666-8666-666666666666';
const ORDER_B='77777777-7777-4777-8777-777777777777';
const ITEM_A='88888888-8888-4888-8888-888888888888';
const DEVICE='99999999-9999-4999-8999-999999999999';

const plan={
 slug:'basic',name:'Basic',subtitle:null,price_cents:2990,
 checkout_price_cents:null,minimum_term_months:12,
 billing_interval:'month',credit_cycle:'monthly',
 monthly_credits:{drinks:3,creatine:1,protein:0},
 features:['24/7 Zutritt','QR-Code'],promotion_badge:null,promotion_note:null,
 sort_order:0,active:true
};
const pass={
 slug:'tagespass',title:'Tagespass',subtitle:null,price_cents:1490,
 checkout_price_cents:null,duration_hours:24,credit_cycle:'none',
 included_credits:{drinks:0,creatine:0,protein:0},
 features:['24 Stunden'],promotion_badge:null,promotion_note:null,
 sort_order:1,active:true
};
const studio={id:STUDIO,name:'Grevesmühlen',slug:'grevesmuehlen',active:true};
const category={id:CATEGORY,slug:'guthaben',title:'Digitales Guthaben',
  published:true,sort_order:0};
const product={id:PRODUCT,category_id:CATEGORY,slug:'testdrink',
  title:'Test-Getränkeguthaben',subtitle:'Digitaler Testartikel',
  description:'Nur Stripe-Testcheckout, keine echten Zahlungen.',
  fulfillment:'digital_credit',price_cents:440,
  compare_at_price_cents:null,stock_quantity:null,published:true,sort_order:0};

function seed(){
 return {
  user:USER,
  studio:{...studio},
  category:{...category},
  product:{...product},
  plans:[{...plan}],
  passes:[{...pass}],
  membership:{
   id:MEMBERSHIP,status:'active',
   starts_at:'2026-09-01T00:00:00Z',
   current_period_end:'2027-01-01T00:00:00Z',
   cancellation_effective_at:null,
   minimum_term_ends_at:'2027-08-31T00:00:00Z',
   contract_price_cents:2990,currency:'eur',
   pricing_snapshot:{plan_name:'Basic Original',billing_interval:'month'},
  },
  orders:[
   {id:ORDER_A,user_id:USER,public_number:'NK-TEST-001',status:'pending_payment',
    currency:'eur',total_cents:440,refunded_cents:0,
    created_at:'2026-11-20T09:00:00Z',paid_at:null},
   {id:ORDER_B,user_id:USER,public_number:'NK-TEST-002',status:'paid',
    currency:'eur',total_cents:440,refunded_cents:0,
    created_at:'2026-11-19T09:00:00Z',paid_at:'2026-11-19T09:03:00Z'},
  ],
  items:[
   {id:ITEM_A,order_id:ORDER_A,title:product.title,quantity:1,unit_price_cents:440},
   {id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',order_id:ORDER_B,
    title:product.title,quantity:1,unit_price_cents:440},
  ],
  devices:[{id:DEVICE,user_id:USER,platform:'ios',
    last_seen_at:'2026-11-20T08:00:00Z',
    trusted_at:'2026-11-19T12:00:00Z',revoked_at:null}],
  signedIn:false,
  emptyCatalogue:false,
  shopFailure:false,
  rejectLogin:false,
  signupResponses:[],
  deviceRevokeCalls:0,
  checkoutCalls:0,
  logs:[],
 };
}

async function installFixtures(page, state=seed()){
 await page.route(SUPABASE_ORIGIN+'/**',async route=>{
  const request=route.request();
  const u=new URL(request.url());
  const pathname=u.pathname;
  const method=request.method();
  const record={method,path:pathname,search:u.search,body:request.postData()};
  state.logs.push(record);
  const headers={
   'Access-Control-Allow-Origin':'*',
   'Access-Control-Allow-Headers':'*',
   'Access-Control-Allow-Methods':'GET,POST,PATCH,PUT,OPTIONS',
  };
  const respond=async(data,status=200)=>{
   await route.fulfill({status,contentType:'application/json',headers,
     body:JSON.stringify(data)});
  };
  if(method==='OPTIONS'){await route.fulfill({status:204,headers,body:''});return;}
  let value;
  if(pathname==='/auth/v1/token'&&method==='POST'){
   if(state.rejectLogin){await respond({message:'Invalid login credentials'},400);return;}
   state.signedIn=true;
   value={access_token:'a'.repeat(48),refresh_token:'r'.repeat(48),
     expires_in:3600,user:{id:USER,email:'member@nordkern.test'}};
  }else if(pathname==='/auth/v1/signup'&&method==='POST'){
   const body=JSON.parse(request.postData()||'{}');
   state.signupResponses.push(body);
   // Email-confirmation-required mode: no signed in session by design.
   value={user:{id:USER,email:body.email}};
  }else if(pathname==='/auth/v1/user'){
   if(!state.signedIn){await respond({message:'Not authenticated'},401);return;}
   value={id:USER,email:'member@nordkern.test'};
  }else if(pathname==='/auth/v1/logout'){
   state.signedIn=false;value={};
  }else if(pathname==='/auth/v1/recover'||pathname==='/auth/v1/resend'){
   value={};
  }else if(pathname==='/rest/v1/membership_plans'){
   value=state.emptyCatalogue?[]:state.plans;
  }else if(pathname==='/rest/v1/pass_products'){
   value=state.emptyCatalogue?[]:state.passes;
  }else if(pathname==='/rest/v1/shop_categories'){
   if(state.shopFailure){await respond({message:'shop offline'},503);return;}
   value=state.emptyCatalogue?[]:[state.category];
  }else if(pathname==='/rest/v1/shop_products'){
   if(state.shopFailure){await respond({message:'shop offline'},503);return;}
   value=state.emptyCatalogue?[]:[state.product];
  }else if(pathname==='/rest/v1/studios'){
   value=[state.studio];
  }else if(pathname==='/rest/v1/profiles'){
   value=[{id:USER,member_id:'NK-TEST-001',first_name:'Test',last_name:'Member',
     account_enabled:true}];
  }else if(pathname==='/rest/v1/member_studios'){
   value=[{studio_id:STUDIO,change_allowed_at:'2025-10-01T00:00:00Z'}];
  }else if(pathname==='/rest/v1/memberships'){
   value=[state.membership];
  }else if(pathname==='/rest/v1/passes'){
   value=[];
  }else if(pathname==='/rest/v1/wallet_balances'){
   value=[{drinks:3,additional_drinks:0,creatine:1,protein:0}];
  }else if(pathname==='/rest/v1/orders'){
   value=state.orders;
  }else if(pathname==='/rest/v1/order_items'){
   value=state.items;
  }else if(pathname==='/rest/v1/devices'){
   value=state.devices;
  }else if(pathname==='/rest/v1/rpc/revoke_own_device'&&method==='POST'){
   const p=JSON.parse(request.postData()||'{}');
   if(p.p_device_id!==DEVICE){await respond({message:'unauthorized'},403);return;}
   state.deviceRevokeCalls++;
   state.devices=state.devices.map(d=>({...d,revoked_at:'2026-11-20T12:00:00Z'}));
   value=true;
  }else if(pathname==='/rest/v1/rpc/change_own_studio'&&method==='POST'){
   value=[{studio_slug:state.studio.slug}];
  }else if(pathname==='/functions/v1/create-offer-checkout'&&method==='GET'){
   value={testMode:true,webCheckoutEnabled:false};
  }else if(pathname.startsWith('/functions/v1/')){
   state.checkoutCalls++;
   await respond({message:'test payments disabled'},503);
   return;
  }else{
   await respond({message:'unmocked endpoint',path:pathname},404);
   return;
  }
  await respond(value);
 });
 // This is a hard policy: all external requests except the mocked Supabase
 // origin are blocked (no Stripe, analytics, mail, or production endpoints).
 await page.route(/^https?:\/\//,async route=>{
   const url=new URL(route.request().url());
   if(url.origin===SUPABASE_ORIGIN){
     await route.fallback();
   }else if(url.origin==='http://127.0.0.1:8765'){
     await route.continue();
   }else {
     throw new Error('Unexpected external browser network request: '+url.origin);
   }
 });
 return state;
}
module.exports={seed,installFixtures,USER,STUDIO,CATEGORY,PRODUCT,DEVICE};
