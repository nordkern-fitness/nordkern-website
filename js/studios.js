/* Nordkern FDS: public catalogue and explicitly approved studio information. */
(() => {
  "use strict";
  const CONFIG = Object.freeze({
    url: "https://mfaqlfsaatmhvcqlpzoz.supabase.co",
    publishableKey: "sb_publishable_uU3OtB51Zzy8-YRKptpSzA_no2gfyVC"
  });
  const validStudio = value => value && typeof value === "object" &&
    !Array.isArray(value) && typeof value.slug === "string" && /^[a-z0-9][a-z0-9-]{0,59}$/.test(value.slug) &&
    typeof value.name === "string" && value.name.trim().length > 0 &&
    value.name.length <= 160 && !/[\u0000-\u001f\u007f]/.test(value.name) && value.active === true;

  async function loadStudios(signal) {
    const response = await fetch(
      CONFIG.url + "/rest/v1/studios?select=slug,name,active&active=eq.true&order=name.asc,slug.asc&limit=51",
      { headers: { apikey: CONFIG.publishableKey }, cache: "no-store", signal }
    );
    if (!response.ok) throw new Error("Standortkatalog nicht erreichbar.");
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length > 50 || !rows.every(validStudio) ||
        new Set(rows.map(studio => studio.slug)).size !== rows.length) {
      throw new Error("Standortkatalog enthält ungültige oder unvollständige Daten.");
    }
    return rows;
  }
  function renderStudios(list, studios) {
    if (!list) return;
    list.replaceChildren();
    for (const studio of studios) {
      const item = document.createElement('li');
      const name = document.createElement('strong');
      const note = document.createElement('span');
      name.textContent = studio.name;
      note.textContent = 'Im digitalen Katalog · kein Betriebsnachweis';
      item.className = 'location-catalog-item-v3';
      item.append(name, note);
      list.append(item);
    }
    list.hidden = studios.length === 0;
  }
  let pending = false;
  async function mount() {
    const status = document.querySelector("[data-nk-studio-data-status]");
    if (!status || pending) return;
    const list = document.querySelector('[data-nk-studio-list]');
    const retry = document.querySelector('[data-nk-studio-retry]');
    pending = true;
    if (retry) { retry.hidden = true; retry.disabled = true; }
    renderStudios(list, []);
    status.textContent = 'Standortkatalog wird geprüft. Der Katalogstatus allein bestätigt keine Eröffnung.';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 9000);
    try {
      const studios = await loadStudios(controller.signal);
      const grevesmuehlen = studios.some(studio => studio.slug === "grevesmuehlen");
      renderStudios(list, studios);
      status.textContent = grevesmuehlen
        ? "Grevesmühlen ist im digitalen Nordkern-Katalog geführt. Der Katalogstatus allein bestätigt keine Eröffnung."
        : "Grevesmühlen ist derzeit nicht im öffentlichen Katalog freigegeben. Der Katalogstatus ist kein Betriebsnachweis.";
    } catch {
      renderStudios(list, []);
      status.textContent = "Katalogdaten sind momentan nicht abrufbar. Der Katalogstatus ist nicht bestätigt.";
      if (retry) retry.hidden = false;
    } finally {
      window.clearTimeout(timeout);
      if (retry) retry.disabled = false;
      pending = false;
    }
  }
  const addressKeys = ['street','house_number','postal_code','city','country'];
  const days = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
  const exact = (v, keys) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v,k));
  const safeText = (v, max=160) => typeof v === 'string' && v.trim().length > 0 && v.length <= max && !/[\u0000-\u001f\u007f]/.test(v);
  const integer = (v,min,max) => Number.isInteger(v) && v >= min && v <= max;
  const interval = (a,b) => integer(a,0,1439) && integer(b,1,1440) && a < b;
  const day = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
  const timezone = v => {
    if (!safeText(v,100)) return false;
    try { new Intl.DateTimeFormat('de-DE',{timeZone:v}); return true; } catch { return false; }
  };
  function validPublication(v) {
    return exact(v,['slug','name','timezone','address','hours','exceptions','mode','published_at']) &&
      typeof v.slug === 'string' && /^[a-z0-9][a-z0-9-]{0,59}$/.test(v.slug) && safeText(v.name) && timezone(v.timezone) &&
      exact(v.address,addressKeys) && addressKeys.every(k=>safeText(v.address[k])) &&
      (v.mode === 'planned' || v.mode === 'operating') && typeof v.published_at === 'string' && Number.isFinite(Date.parse(v.published_at)) &&
      Array.isArray(v.hours) && v.hours.length >= 1 && v.hours.length <= 28 &&
      v.hours.every(h=>exact(h,['weekday','opens_minute','closes_minute']) && integer(h.weekday,1,7) && interval(h.opens_minute,h.closes_minute)) &&
      v.hours.every((h,i)=>i===0 || v.hours[i-1].weekday<h.weekday || (v.hours[i-1].weekday===h.weekday && v.hours[i-1].closes_minute<=h.opens_minute)) &&
      Array.isArray(v.exceptions) && v.exceptions.length <= 366 &&
      v.exceptions.every(e=>exact(e,['day','closed','opens_minute','closes_minute']) && day(e.day) && typeof e.closed==='boolean' && (e.closed ? e.opens_minute===null && e.closes_minute===null : interval(e.opens_minute,e.closes_minute))) &&
      v.exceptions.every((e,i)=>i===0 || v.exceptions[i-1].day<e.day);
  }
  async function loadPublicDirectory(signal) {
    const response = await fetch(CONFIG.url + '/rest/v1/rpc/studio_public_directory', {headers:{apikey:CONFIG.publishableKey},cache:'no-store',signal});
    if (!response.ok) throw new Error('Veröffentlichte Standortdaten nicht erreichbar.');
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length>50 || !rows.every(validPublication) || new Set(rows.map(x=>x.slug)).size!==rows.length) throw new Error('Veröffentlichte Standortdaten nicht bestätigt.');
    return rows;
  }
  const time = n => String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
  const make = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent=text;
    if (className) node.className=className;
    return node;
  };
  function renderPublicDirectory(list, studios) {
    if (!list) return;
    list.replaceChildren();
    for (const studio of studios) {
      const card=make('article',undefined,'location-public-card-v3');
      card.append(make('p',studio.mode==='operating'?'Betrieb bestätigt':'Veröffentlichte Planung','location-public-state-v3'),make('h3',studio.name));
      const a=studio.address;
      card.append(make('address',`${a.street} ${a.house_number}, ${a.postal_code} ${a.city}, ${a.country}`),make('p',studio.mode==='planned'?'Eröffnung nicht bestätigt. Die folgenden Zeiten sind als Planung freigegeben.':'Die Betriebsinformation ist freigegeben. Sie bestätigt keinen aktuellen Zutritt oder Buchungsstatus.','location-public-note-v3'));
      card.append(make('h4',studio.mode==='planned'?'Geplante regelmäßige Öffnungszeiten':'Regelmäßige Öffnungszeiten'));
      const schedule=make('dl',undefined,'location-public-hours-v3');
      days.forEach((label,i)=>{
        const windows=studio.hours.filter(h=>h.weekday===i+1).map(h=>`${time(h.opens_minute)}–${time(h.closes_minute)}`);
        schedule.append(make('dt',label),make('dd',windows.length?windows.join(' · '):'Keine Zeit veröffentlicht'));
      });
      card.append(schedule,make('p','Ortszeit: '+studio.timezone,'location-public-note-v3'));
      if (studio.exceptions.length) {
        const details=make('details');
        details.append(make('summary',`Sonderöffnungen und Schließungen (${studio.exceptions.length})`));
        const exceptions=make('ul',undefined,'location-public-exceptions-v3');
        for (const e of studio.exceptions) exceptions.append(make('li',`${e.day.split('-').reverse().join('.')} · ${e.closed?'Geschlossen':time(e.opens_minute)+'–'+time(e.closes_minute)}`));
        details.append(exceptions);card.append(details);
      } else card.append(make('p','Keine zukünftigen Ausnahmen veröffentlicht.','location-public-note-v3'));
      const published=new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeZone:studio.timezone}).format(new Date(studio.published_at));
      card.append(make('p','Stand der Freigabe: '+published,'location-public-note-v3'));
      list.append(card);
    }
    list.hidden=studios.length===0;
  }
  function setGrevesmuehlenState(label) {
    document.querySelectorAll('[data-nk-gvm-state]').forEach(node=>{node.textContent=label;});
  }
  let publicPending=false;
  async function mountPublic() {
    const status=document.querySelector('[data-nk-published-status]');
    if (!status || publicPending) return;
    const list=document.querySelector('[data-nk-published-list]');
    const retry=document.querySelector('[data-nk-published-retry]');
    publicPending=true;
    if (retry) { retry.hidden=true; retry.disabled=true; }
    renderPublicDirectory(list,[]);
    setGrevesmuehlenState('Betriebsstatus wird geprüft');
    status.textContent='Veröffentlichte Standortinformationen werden geprüft …';
    const controller=new AbortController();
    const timeout=window.setTimeout(()=>controller.abort(),9000);
    try {
      const rows=await loadPublicDirectory(controller.signal);
      renderPublicDirectory(list,rows);
      const gvm=rows.find(x=>x.slug==='grevesmuehlen');
      setGrevesmuehlenState(gvm?.mode==='operating'?'Betrieb bestätigt':'Standort in Planung');
      status.textContent=rows.length?'Freigegebene Standortinformationen. Kein Live-Zutrittsstatus.':'Derzeit sind keine Standortdetails freigegeben. Eine Eröffnung wird hier nicht bestätigt.';
    } catch {
      renderPublicDirectory(list,[]);
      setGrevesmuehlenState('Betriebsstatus nicht bestätigt');
      status.textContent='Veröffentlichte Standortinformationen sind derzeit nicht abrufbar. Es werden keine Öffnungszeiten angezeigt.';
      if (retry) retry.hidden=false;
    } finally {
      window.clearTimeout(timeout);
      if (retry) retry.disabled=false;
      publicPending=false;
    }
  }
  function mountMap() {
    const button = document.querySelector('[data-nk-map-load]');
    const frame = document.querySelector('[data-nk-map-frame]');
    if (!button || !frame) return;
    button.addEventListener('click', () => {
      if (frame.querySelector('iframe')) return;
      const iframe = document.createElement('iframe');
      iframe.title = 'Karte: Grevesmühlen';
      iframe.referrerPolicy = 'no-referrer';
      iframe.src = 'https://www.google.com/maps?q=Grevesm%C3%BChlen&output=embed';
      frame.replaceChildren(iframe);
      iframe.focus();
    });
  }
  window.NordkernStudios = { validStudio, loadStudios, mount, mountMap, validPublication, loadPublicDirectory, mountPublic };
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector('[data-nk-studio-retry]')?.addEventListener('click', () => { void mount(); });
    document.querySelector('[data-nk-published-retry]')?.addEventListener('click', () => { void mountPublic(); });
    void mount();
    void mountPublic();
    mountMap();
  });
})();
