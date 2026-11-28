/* Shared session-scoped Nordkern web cart: only product UUIDs and quantities.
   Server checkout always reprices and validates all line items. */
(() => {
  'use strict';
  const KEY='nordkern-shop-cart-v1';
  const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function validCart(rows){
    return Array.isArray(rows)&&rows.length<=8&&rows.every(row=>
      row && typeof row==='object' && !Array.isArray(row) &&
      Object.keys(row).sort().join(',')==='product_id,quantity' &&
      typeof row.product_id==='string'&&UUID.test(row.product_id) &&
      Number.isSafeInteger(row.quantity)&&row.quantity>=1&&row.quantity<=10) &&
      new Set(rows.map(row=>row.product_id.toLowerCase())).size===rows.length &&
      rows.reduce((sum,row)=>sum+row.quantity,0)<=20;
  }
  function readCart(){
    try{
      const rows=JSON.parse(sessionStorage.getItem(KEY)||'[]');
      return validCart(rows)?rows:[];
    }catch{return [];}
  }
  function writeCart(rows){
    if(!validCart(rows))throw new Error('Warenkorb übersteigt die zulässige Menge.');
    sessionStorage.setItem(KEY,JSON.stringify(rows));
  }
  function updateCart(rows,productId,change){
    if(!UUID.test(productId)||!Number.isInteger(change)||Math.abs(change)!==1)
      throw new Error('Ungültige Mengenänderung.');
    if(!validCart(rows))throw new Error('Ungültiger Warenkorb.');
    const updated=rows.map(x=>({...x}));
    const index=updated.findIndex(x=>x.product_id.toLowerCase()===productId.toLowerCase());
    if(index>=0){
      updated[index].quantity+=change;
      if(updated[index].quantity===0)updated.splice(index,1);
    }else if(change>0){updated.push({product_id:productId,quantity:1});}
    if(!validCart(updated))throw new Error('Maximal acht verschiedene Artikel und zwanzig Einheiten.');
    return updated;
  }
  function publishedCart(cart,products){
    if(!validCart(cart)||!Array.isArray(products))return [];
    const allowed=new Set(products.filter(p=>
      p&&p.fulfillment==='digital_credit'&&p.stock_quantity===null&&p.published===true)
      .map(p=>p.id));
    return cart.filter(item=>allowed.has(item.product_id));
  }
  window.NordkernShopCart={KEY,validCart,readCart,writeCart,updateCart,publishedCart};
})();
