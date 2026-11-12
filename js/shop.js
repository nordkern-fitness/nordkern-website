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
    let selected="all",catalogue=null;
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
          :"Kaufabwicklung noch nicht freigeschaltet.";
        card.appendChild(element("p","shop-card-info-v3",label));
        grid.appendChild(card);
      }
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
          ?"Aktuelle Produkte direkt aus dem Nordkern-Katalog · Bestellungen noch nicht verfügbar."
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
