(() => {
 const pageName=window.NK_PAGE, initial=window.NK_STORE||{};
 for(const method of ['pushState','replaceState'])history[method]=(_s,_t,url)=>{if(typeof url==='string'&&url.includes('#'))window.NK_HASH=url.slice(url.indexOf('#'));};
 const storage=kind=>({getItem:k=>initial[kind]?.[k]??null,setItem:(k,v)=>{(initial[kind]??={})[k]=String(v);parent.postMessage({nk:'storage',kind,key:k,value:String(v)},'*')},removeItem:k=>{delete(initial[kind]??={})[k];parent.postMessage({nk:'storage',kind,key:k,value:null},'*')},clear:()=>{initial[kind]={};parent.postMessage({nk:'clear',kind},'*')}});
 for(const kind of ['sessionStorage','localStorage'])Object.defineProperty(window,kind,{value:storage(kind)});
 const state=window.nkFixture.seed();
 state.signedIn=Boolean(initial.sessionStorage?.['nordkern-website-session-v1']);
 state.membership.current_period_end=new Date(Date.now()+30*86400000).toISOString();
 state.membership.starts_at=new Date(Date.now()-30*86400000).toISOString();
 state.plans.push({...state.plans[0],slug:'plus',name:'Plus · Beispiel',price_cents:3490,minimum_term_months:8,sort_order:1},{...state.plans[0],slug:'pro',name:'Pro · Beispiel',price_cents:4490,minimum_term_months:1,sort_order:2});
 state.passes.push({...state.passes[0],slug:'urlaubspass',title:'Urlaubspass · Beispiel',price_cents:2990,duration_hours:168,sort_order:2});
 const handlers=[],ready=window.nkFixture.installFixtures({route:async(_pattern,handler)=>handlers.push(handler)},state);
 const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
 const blocked=()=>response({message:'Offline-Vorschau: keine echte Registrierung, Zahlung oder Änderung.'},503);
 window.fetch=async(input,opts={})=>{
   await ready;let u;try{u=new URL(typeof input==='string'?input:input.url)}catch{return blocked()}
   if(u.origin!=='https://mfaqlfsaatmhvcqlpzoz.supabase.co')return blocked();
   const method=(opts.method||'GET').toUpperCase();
   if(method!=='GET'&&!['/auth/v1/token','/auth/v1/logout'].includes(u.pathname))return blocked();
   if(u.pathname==='/auth/v1/token'&&method==='POST'&&u.searchParams.get('grant_type')!=='refresh_token'){
     let body;try{body=JSON.parse(opts.body||'{}')}catch{return blocked()}
     if(body.email!=='member@nordkern.test'||body.password!=='safe-test-password-123')return blocked();
   }
   const own=u.pathname.startsWith('/rest/v1/')&&!['membership_plans','pass_products','shop_categories','shop_products','studios'].includes(u.pathname.split('/').pop());
   if(own&&!state.signedIn)return blocked();
   if(u.pathname==='/rest/v1/wallet_ledger')return response([{id:'a1234567-1234-4234-8234-123456789012',user_id:state.user,kind:'drinks',amount:3,reason:'Synthetische Monatsgutschrift',reference_type:'membership',reference_id:null,created_at:'2026-11-20T09:00:00Z'}]);
   return new Promise(resolve=>{const route={request:()=>({url:()=>u.href,method:()=>method,postData:()=>typeof opts.body==='string'?opts.body:null}),fulfill:async r=>resolve(new Response(r.body||null,{status:r.status,headers:{'Content-Type':'application/json'}}))};Promise.resolve(handlers[0](route)).catch(()=>resolve(blocked()));});
 };
 window.open=()=>null;
 window.XMLHttpRequest=function(){throw Error('Offline-Vorschau')};
 const notice=message=>parent.postMessage({nk:'notice',message},'*');
 document.addEventListener('click',event=>{
   const a=event.target.closest?.('a[href]');if(!a)return;const href=a.getAttribute('href');
   if(!href||href.startsWith('#'))return;
   const match=href.match(/^(?:\.\/)?([a-z-]+\.html)(#[^?]*)?$/i);
   event.preventDefault();event.stopImmediatePropagation();
   if(match)parent.postMessage({nk:'navigate',page:match[1],hash:match[2]||''},'*');else notice('Externer Link in der Offline-Vorschau gesperrt.');
 },true);
 document.addEventListener('submit',event=>{
   if(event.target.id!=='nk-login-form'){event.preventDefault();event.stopImmediatePropagation();notice('Keine echte Registrierung, E-Mail oder Änderung in dieser Vorschau.');}
 },true);
 document.addEventListener('DOMContentLoaded',()=>{
   if(pageName==='konto.html'){
     const form=document.getElementById('nk-login-form');
     if(form){const btn=document.createElement('button');btn.type='button';btn.textContent='Synthetisches Beispielkonto öffnen';btn.className='nk-account-subtle';btn.addEventListener('click',()=>{document.getElementById('nk-login-email').value='member@nordkern.test';document.getElementById('nk-login-password').value='safe-test-password-123';form.requestSubmit();});form.prepend(btn);}
     for(const input of document.querySelectorAll('input[type=password],input[type=email]')){input.autocomplete='off';}
   }
   for(const a of document.querySelectorAll('.site-nav .nav-link')){const active=a.getAttribute('href')===pageName;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}
   if(window.NK_HASH){try{const id=decodeURIComponent(window.NK_HASH.slice(1));setTimeout(()=>document.getElementById(id)?.scrollIntoView(),300)}catch{}}
 });
})();
