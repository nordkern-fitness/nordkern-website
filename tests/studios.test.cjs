const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/studios.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../standorte.html'), 'utf8');
function element(tag='div') {return {tag,children:[],textContent:'',hidden:false,disabled:false,listeners:{},append(...nodes){this.children.push(...nodes);},replaceChildren(...nodes){this.children=nodes;},addEventListener(name,fn){this.listeners[name]=fn;},querySelector(tag){return this.children.find(x=>x.tag===tag);},focus(){this.focused=true;}};}
function load(fetcher) {
  const status=element(),list=element('ul'),retry=element('button'),button=element('button'),frame=element();
  const window = { setTimeout, clearTimeout };
  const selectors={'[data-nk-studio-data-status]':status,'[data-nk-studio-list]':list,'[data-nk-studio-retry]':retry,'[data-nk-map-load]':button,'[data-nk-map-frame]':frame};
  const document = {addEventListener(){},querySelector(s){return selectors[s];},createElement:element};
  vm.runInNewContext(source, { window, document, fetch: fetcher, AbortController });
  return {api:window.NordkernStudios,status,list,retry,button,frame};
}
const rows = [{ slug: 'grevesmuehlen', name: 'Grevesmühlen', active: true }];
test('public studio response validation rejects untrusted data', () => {
  const { api } = load(async () => { throw new Error('unexpected fetch'); });
  assert.equal(Boolean(api.validStudio(rows[0])), true);
  for(const item of [{...rows[0],active:false},{...rows[0],slug:'<img>'},{...rows[0],slug:42},{...rows[0],name:42},{...rows[0],name:'Name\nline'}])assert.equal(Boolean(api.validStudio(item)),false);
});
test('site reads only active studios through the public Supabase key', async () => {
  const requests = [];
  const { api } = load(async (url, options) => {requests.push({url,options});return {ok:true,json:async()=>rows};});
  assert.equal((await api.loadStudios()).length,1);
  assert.match(requests[0].url,/\/rest\/v1\/studios\?select=slug,name,active&active=eq.true&order=name.asc,slug.asc&limit=51/);
  assert.match(requests[0].options.headers.apikey,/^sb_publishable_/);
  assert.equal(requests[0].options.cache,'no-store');
});
test('site refuses corrupt, duplicate and truncated catalogues', async () => {
  for(const data of [[{...rows[0],active:false}],[rows[0],rows[0]],Array.from({length:51},(_,i)=>({...rows[0],slug:'studio-'+i}))]){
    const {api}=load(async()=>({ok:true,json:async()=>data}));await assert.rejects(api.loadStudios());
  }
});
test('all returned studio names are rendered as text and not claimed open',async()=>{
  const f=load(async()=>({ok:true,json:async()=>[...rows,{slug:'other',name:'<b>Fixture</b>',active:true}]}));await f.api.mount();
  assert.equal(f.list.children.length,2);assert.equal(f.list.children[1].children[0].textContent,'<b>Fixture</b>');assert.match(f.list.children[1].children[1].textContent,/Eröffnung nicht bestätigt/);assert.equal(f.list.hidden,false);assert.equal(f.retry.hidden,true);
});
test('failed load clears stale data, allows retry, and successful retry clears error',async()=>{
  let calls=0;const f=load(async()=>{calls++;if(calls===2)throw Error('offline');return {ok:true,json:async()=>rows};});await f.api.mount();await f.api.mount();assert.equal(f.list.children.length,0);assert.equal(f.retry.hidden,false);assert.equal(f.retry.disabled,false);await f.api.mount();assert.equal(f.list.children.length,1);assert.equal(f.retry.hidden,true);
});
test('map iframe is created only on explicit click',()=>{
  const f=load(async()=>{throw Error('unexpected fetch');});f.api.mountMap();assert.equal(f.frame.children.length,0);f.button.listeners.click();assert.equal(f.frame.children.length,1);assert.match(f.frame.children[0].src,/^https:\/\/www\.google\.com\/maps/);assert.equal(f.frame.children[0].referrerPolicy,'no-referrer');assert.equal(f.frame.children[0].focused,true);f.button.listeners.click();assert.equal(f.frame.children.length,1);
});
test('planned Grevesmühlen studio is not advertised as operational and no map iframe is preloaded',()=>{
  assert.equal(html.includes('Aktiver Standort'),false);assert.match(html,/Standort in Planung/);assert.match(html,/data-nk-studio-data-status/);assert.match(html,/data-nk-studio-list/);assert.match(html,/data-nk-map-load/);assert.doesNotMatch(html,/<iframe\b/i);assert.match(html,/js\/studios\.js/);
});
