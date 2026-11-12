/* Nordkern Fitness – published shop catalogue, read-only and safe by construction. */
(() => {
  "use strict";
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const SLUG = /^[a-z0-9][a-z0-9-]{0,59}$/;
  const text = (value, max=1000) => typeof value==="string" &&
    value.trim().length>0 && value.length<=max;
  const cents = value => Number.isSafeInteger(value) && value>=0 && value<=10000000;
  const sort = value => Number.isSafeInteger(value) && value>=0 && value<=1000000;
  const obj = value => value!==null && typeof value==="object" && !Array.isArray(value);

  function validCategory(value) {
    return obj(value) && typeof value.id==="string" && UUID.test(value.id) &&
      typeof value.slug==="string" && SLUG.test(value.slug) &&
      text(value.title,180) && sort(value.sort_order) && value.published===true;
  }
  function validProduct(value) {
    return obj(value) && typeof value.id==="string" && UUID.test(value.id) &&
      typeof value.category_id==="string" && UUID.test(value.category_id) &&
      typeof value.slug==="string" && SLUG.test(value.slug) &&
      text(value.title,180) && typeof value.subtitle==="string" && value.subtitle.length<=400 &&
      text(value.description,5000) && typeof value.fulfillment==="string" &&
      value.fulfillment.length<32 && cents(value.price_cents) &&
      (value.compare_at_price_cents===null||cents(value.compare_at_price_cents)) &&
      (value.stock_quantity===null||(Number.isSafeInteger(value.stock_quantity)&&value.stock_quantity>=0)) &&
      sort(value.sort_order) && value.published===true;
  }
  function parseCatalogue(categories,products) {
    if (!Array.isArray(categories)||categories.length>100||!categories.every(validCategory)||
        !Array.isArray(products)||products.length>100||!products.every(validProduct)) {
      throw new Error("Ungültige Shop-Katalogdaten.");
    }
    const published=new Set(categories.map(x=>x.id));
    return {categories,products:products.filter(x=>published.has(x.category_id))};
  }
  async function loadCatalogue() {
    const cfg=window.NordkernCatalog?.publicConfig;
    if (!cfg || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cfg.url)||
        typeof cfg.publishableKey!=="string"||!cfg.publishableKey.startsWith("sb_publishable_")) {
      throw new Error("Shop-Katalog nicht konfiguriert.");
    }
    const ctl=new AbortController(),timer=window.setTimeout(()=>ctl.abort(),9000);
    try {
      const paths=[
        "/rest/v1/shop_categories?select=id,slug,title,sort_order,published&published=eq.true&order=sort_order.asc&limit=100",
        "/rest/v1/shop_products?select=id,category_id,slug,title,subtitle,description,fulfillment,price_cents,compare_at_price_cents,stock_quantity,sort_order,published&published=eq.true&order=sort_order.asc&limit=100"
      ];
      const [categories,products]=await Promise.all(paths.map(async path=>{
        const response=await fetch(cfg.url+path,{
          headers:{apikey:cfg.publishableKey},cache:"no-store",signal:ctl.signal
        });
        if(!response.ok)throw new Error("Shop-Katalog nicht erreichbar.");
        return response.json();
      }));
      return parseCatalogue(categories,products);
    } finally {window.clearTimeout(timer);}
  }
  const element=(tag,cls,value)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(value!==undefined&&value!==null)node.textContent=String(value);
    return node;
  };
  const euros=value=>new Intl.NumberFormat("de-DE",{
    style:"currency",currency:"EUR"
  }).format(value/100);
  function mount() {
    const grid=document.getElementById("nkshop-grid");
    const status=document.getElementById("nkshop-status");
    const filters=document.getElementById("nkshop-filters");
    if(!grid||!status||!filters)return;
    const cartArea=document.getElementById("nkshop-cart");
    const cartLink=document.getElementById("nkshop-account-link");
    const cartApi=window.NordkernShopCart;
    let selected="all",catalogue=null;
    const renderCart=()=>{
      if(!cartArea||!catalogue)return;
      cartArea.replaceChildren();
      const current=cartApi?.readCart()??[];
      const allowed=cartApi?.publishedCart(current,catalogue.products)??[];
      if(cartApi&&allowed.length!==current.length){
        try{cartApi.writeCart(allowed);}catch{/* Session storage may be disabled. */}
      }
      const count=allowed.reduce((sum,line)=>sum+line.quantity,0);
      if(!allowed.length){
        cartArea.appendChild(element("p","","Dein Testwarenkorb ist noch leer."));
      }else{
        let total=0;
        for(const line of allowed){
          const product=catalogue.products.find(p=>p.id===line.product_id);
          if(!product)continue;
          total+=product.price_cents*line.quantity;
          const container=element("div","shop-cart-line-v3");
          container.appendChild(element("span","",line.quantity+" × "+product.title));
          container.appendChild(element("strong","",euros(line.quantity*product.price_cents)));
          cartArea.appendChild(container);
        }
        cartArea.appendChild(element("p","shop-cart-total-v3",count+" Einheiten · "+
          euros(total)+" (Katalogvorschau; verbindlich ist der Serverpreis)"));
      }
      if(cartLink){
        cartLink.setAttribute("aria-disabled",String(!count));
        cartLink.tabIndex=count?0:-1;
      }
    };
    const draw=()=>{
      grid.replaceChildren();
      filters.replaceChildren();
      const products=catalogue.products.filter(product=>
        selected==="all"||product.category_id===selected);
      if(catalogue.categories.length>1){
        const values=[{id:"all",title:"Alle Produkte"},...catalogue.categories];
        for(const item of values){
          const b=element("button","shop-filter-v3",item.title);
          b.type="button";b.setAttribute("aria-pressed",String(item.id===selected));
          b.addEventListener("click",()=>{selected=item.id;draw();});
          filters.appendChild(b);
        }
      }
      if(!products.length){
        const empty=element("article","shop-empty-v3");
        empty.appendChild(element("h3","",selected==="all"
          ?"Noch keine veröffentlichten Produkte.":"Keine Produkte in dieser Kategorie."));
        empty.appendChild(element("p","",
          "Sobald Nordkern Produkte freigibt, erscheinen hier die aktuellen Angaben. Bestellungen sind noch nicht möglich."));
        grid.appendChild(empty);
      }
      for(const item of products){
        const category=catalogue.categories.find(cat=>cat.id===item.category_id);
        const card=element("article","shop-card-v3");
        card.appendChild(element("span","shop-card-category-v3",category?.title??"Nordkern"));
        card.appendChild(element("h3","",item.title));
        if(item.subtitle.trim())card.appendChild(element("p","",item.subtitle));
        card.appendChild(element("strong","",euros(item.price_cents)));
        card.appendChild(element("p","",item.description));
        const label=item.stock_quantity===0?"Momentan ausverkauft."
          :item.fulfillment==="digital_credit"&&item.stock_quantity===null
            ?"Nur Testcheckout im geschützten Mitgliederkonto nach Serverfreigabe."
            :"Versandbestellung noch nicht freigeschaltet.";
        card.appendChild(element("p","shop-card-info-v3",label));
        const eligible=item.fulfillment==="digital_credit"&&item.stock_quantity===null;
        if(eligible&&cartApi){
          const controls=element("div","shop-card-controls-v3");
          const current=cartApi.readCart();
          const quantity=current.find(line=>line.product_id===item.id)?.quantity??0;
          const totalUnits=current.reduce((sum,line)=>sum+line.quantity,0);
          const decrease=element("button","","−");
          decrease.type="button";decrease.disabled=quantity===0;
          decrease.setAttribute("aria-label","Einen "+item.title+" entfernen");
          decrease.addEventListener("click",()=>{
            try{cartApi.writeCart(cartApi.updateCart(cartApi.readCart(),item.id,-1));draw();}
            catch{status.textContent="Warenkorb konnte nicht aktualisiert werden.";}
          });
          const increase=element("button","","＋");
          increase.type="button";increase.disabled=quantity>=10||totalUnits>=20||
            (current.length>=8&&quantity===0);
          increase.setAttribute("aria-label","Einen "+item.title+" hinzufügen");
          increase.addEventListener("click",()=>{
            try{cartApi.writeCart(cartApi.updateCart(cartApi.readCart(),item.id,1));draw();}
            catch{status.textContent="Maximale Warenkorbmenge erreicht oder Speicher nicht verfügbar.";}
          });
          controls.appendChild(decrease);
          controls.appendChild(element("span","",quantity+" im Warenkorb"));
          controls.appendChild(increase);
          card.appendChild(controls);
        }
        grid.appendChild(card);
      }
      renderCart();
    };
    const load=async()=>{
      grid.setAttribute("aria-busy","true");
      status.textContent="Veröffentlichte Produkte werden geladen …";
      filters.replaceChildren();grid.replaceChildren();
      try{
        catalogue=await loadCatalogue();
        selected="all";
        draw();
        status.textContent=catalogue.products.length
          ?"Aktuelle Produkte aus dem Nordkern-Katalog · digitale Guthabenartikel im Stripe-Testmodus nach Anmeldung."
          :"Derzeit sind keine Produkte veröffentlicht.";
      }catch{
        catalogue=null;
        status.textContent="Shop-Daten nicht abrufbar. Es werden keine veralteten Angebote angezeigt.";
        const retry=element("button","shop-retry-v3","Erneut versuchen");
        retry.type="button";
        retry.addEventListener("click",()=>{void load();});
        grid.appendChild(retry);
      }finally{grid.setAttribute("aria-busy","false");}
    };
    void load();
  }
  window.NordkernShop={validCategory,validProduct,parseCatalogue,loadCatalogue,mount};
  document.addEventListener("DOMContentLoaded",mount);
})();
