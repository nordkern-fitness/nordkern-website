/* Nordkern FDS: public read-only studio catalogue, not an opening-hours API. */
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
      note.textContent = 'Im digitalen Katalog · Eröffnung nicht bestätigt';
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
    status.textContent = 'Standortkatalog wird geprüft. Eine Eröffnung ist noch nicht bestätigt.';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 9000);
    try {
      const studios = await loadStudios(controller.signal);
      const grevesmuehlen = studios.some(studio => studio.slug === "grevesmuehlen");
      renderStudios(list, studios);
      status.textContent = grevesmuehlen
        ? "Grevesmühlen ist im digitalen Nordkern-Katalog geführt. Ein Eröffnungstermin ist noch nicht bestätigt."
        : "Der geplante Standort ist derzeit nicht im öffentlichen Katalog freigegeben. Ein Eröffnungstermin ist nicht bestätigt.";
    } catch {
      renderStudios(list, []);
      status.textContent = "Standortdaten sind momentan nicht abrufbar. Eine Studioeröffnung ist nicht bestätigt.";
      if (retry) retry.hidden = false;
    } finally {
      window.clearTimeout(timeout);
      if (retry) retry.disabled = false;
      pending = false;
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
  window.NordkernStudios = { validStudio, loadStudios, mount, mountMap };
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector('[data-nk-studio-retry]')?.addEventListener('click', () => { void mount(); });
    void mount();
    mountMap();
  });
})();
