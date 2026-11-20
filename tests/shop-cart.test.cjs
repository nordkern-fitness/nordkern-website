const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../js/shop-cart.js'),'utf8');
const a='11111111-1111-4111-8111-111111111111';
const b='22222222-2222-4222-8222-222222222222';
function api(){
  const storage=new Map();
  const sessionStorage={getItem:key=>storage.get(key)??null,
    setItem:(key,value)=>storage.set(key,value)};
  const window={};
  vm.runInNewContext(src,{window,sessionStorage,JSON,Set,Number,Object});
  return {cart:window.NordkernShopCart,storage};
}
test('web cart only stores bounded product ids and quantities',()=>{
  const {cart}=api();
  assert.equal(cart.validCart([{product_id:a,quantity:2}]),true);
  assert.equal(cart.validCart([{product_id:a,quantity:10},{product_id:b,quantity:10}]),true);
  assert.equal(cart.validCart([{product_id:a,quantity:11}]),false);
  assert.equal(cart.validCart([{product_id:a,quantity:1},{product_id:a,quantity:2}]),false);
  assert.equal(cart.validCart([{product_id:'invalid',quantity:1}]),false);
});
test('web cart updates quantities with no prices or tokens stored',()=>{
  const {cart,storage}=api();
  const one=cart.updateCart([],a,1);
  cart.writeCart(one);
  assert.equal(cart.readCart().length,1);
  const value=storage.get(cart.KEY);
  assert.match(value,/product_id/);
  assert.doesNotMatch(value,/secret|token|price_cents/);
  assert.equal(cart.updateCart(one,a,-1).length,0);
});
test('only published unlimited digital credits may be transferred to checkout',()=>{
  const {cart}=api();
  const basket=[{product_id:a,quantity:2},{product_id:b,quantity:1}];
  const items=[
    {id:a,published:true,fulfillment:'digital_credit',stock_quantity:null},
    {id:b,published:true,fulfillment:'shipping',stock_quantity:10},
  ];
  const result=cart.publishedCart(basket,items);
  assert.equal(result.length,1);
  assert.equal(result[0].product_id,a);
});
test('invalid stored cart fails closed and never restores manipulated item',()=>{
  const {cart,storage}=api();
  storage.set(cart.KEY,JSON.stringify([{product_id:a,quantity:2,price_cents:1}]));
  assert.equal(cart.readCart().length,0);
});
