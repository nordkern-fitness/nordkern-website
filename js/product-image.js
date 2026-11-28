/* Only server-managed images belonging to the displayed product are eligible. */
(function(root){
  'use strict';
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  function keyFor(key,id){
    return typeof id==='string'&&uuid.test(id)&&typeof key==='string'&&key.startsWith(id+'/')&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](png|jpg)$/.test(key.slice(id.length+1));
  }
  function endpoint(base,product){
    if(typeof base!=='string'||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base)||!product||!keyFor(product.image_key,product.id))return null;
    return base+'/functions/v1/product-image?product='+product.id;
  }
  function createImage(document,base,product){
    const src=endpoint(base,product);if(!src)return null;
    const img=document.createElement('img');img.className='shop-product-image-v3';
    img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
    img.width=480;img.height=320;
    img.addEventListener('error',()=>{img.hidden=true;},{once:true});
    img.src=src;return img;
  }
  const api=Object.freeze({keyFor,endpoint,createImage});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.NordkernProductImage=api;
})(typeof window==='object'?window:globalThis);
