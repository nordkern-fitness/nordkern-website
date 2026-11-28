const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(base,file),'utf8');
test('8.4 account, shop and app landing link to actual Expo custom scheme routes only',()=>{
 const locations=[
  [read('konto.html'),'nordkernapp:///profile'],
  [read('shop.html'),'nordkernapp:///shop'],
  [read('app.html'),'nordkernapp:///profile'],
 ];
 for(const [html,link] of locations){
  assert.ok(html.includes('href="'+link+'"'));
  assert.doesNotMatch(html,/nordkernapp:[^"']*\?[^"']*(?:access_token|refresh_token|secret|session_id)/);
 }
});
test('8.4 web portal anchors map to real protected sections with no fake app-store claims',()=>{
 const account=read('konto.html');
 const landing=read('app.html');
 for(const id of ['vertraege','bestellungen','shop','geraete','konto-sicherheit']){
  assert.match(account,new RegExp('id="'+id+'"'));
 }
 assert.match(landing,/href="konto.html#vertraege"/);
 assert.match(landing,/noch in Entwicklung/);
 assert.match(landing,/installierter Testversion/);
 assert.doesNotMatch(landing,/apps\.apple\.com\/app\/id\d+|play\.google\.com\/store\/apps\/details\?id=/);
});
