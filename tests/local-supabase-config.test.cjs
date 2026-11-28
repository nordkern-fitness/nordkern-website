const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../js/catalog.js'),'utf8');
const hosted='https://mfaqlfsaatmhvcqlpzoz.supabase.co';
const local='http://127.0.0.1:54321';
const fixtureKey='eyJ'+('A'.repeat(70))+'.synthetic';

function load(origin,config){
 const window={location:{origin},NordkernIsolatedE2EConfig:config};
 vm.runInNewContext(source,{window,document:{},URL,AbortController,setTimeout,clearTimeout});
 return window.NordkernCatalog;
}

test('8.8 deployed site cannot be redirected by an injected local test configuration',()=>{
 const catalog=load('https://nordkern-fitness.de',{url:local,publishableKey:fixtureKey});
 assert.equal(catalog.publicConfig.url,hosted);
 assert.equal(catalog.isSupportedConfig({url:local,publishableKey:fixtureKey}),false);
});
test('8.8 localhost website accepts exactly the disposable local Supabase port',()=>{
 const catalog=load('http://127.0.0.1:8765',{url:local,publishableKey:fixtureKey});
 assert.equal(catalog.publicConfig.url,local);
 assert.equal(catalog.publicConfig.publishableKey,fixtureKey);
});
test('8.8 no remote host or privileged key is eligible for local test override',()=>{
 for(const config of [
   {url:'http://127.0.0.1:54322',publishableKey:fixtureKey},
   {url:'https://evil.example.org',publishableKey:fixtureKey},
   {url:'http://localhost:54321',publishableKey:fixtureKey},
   {url:local,publishableKey:'sb_secret_not_allowed'},
   {url:local,publishableKey:'short'},
   {url:local,publishableKey:''},
 ]){
   const catalog=load('http://127.0.0.1:8765',config);
   assert.equal(catalog.publicConfig.url,hosted);
 }
});
test('8.8 hosted catalogue still requires a public publishable key',()=>{
 const catalog=load('https://nordkern-fitness.de',{url:hosted,publishableKey:'sb_secret_bad'});
 assert.equal(catalog.publicConfig.url,hosted);
 assert.equal(catalog.isSupportedConfig({url:hosted,publishableKey:'sb_secret_bad'}),false);
});
