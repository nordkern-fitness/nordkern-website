/* Nordkern FDS: public read-only studio catalogue, not an opening-hours API. */
(() => {
  "use strict";
  const CONFIG = Object.freeze({
    url: "https://mfaqlfsaatmhvcqlpzoz.supabase.co",
    publishableKey: "sb_publishable_uU3OtB51Zzy8-YRKptpSzA_no2gfyVC"
  });

  const validStudio = value => value && typeof value === "object" &&
    !Array.isArray(value) && /^[a-z0-9-]{1,60}$/.test(value.slug || "") &&
    typeof value.name === "string" && value.name.trim().length > 0 &&
    value.name.length <= 140 && value.active === true;

  async function loadStudios(signal) {
    const response = await fetch(
      CONFIG.url + "/rest/v1/studios?select=slug,name,active&active=eq.true&order=name.asc&limit=50",
      { headers: { apikey: CONFIG.publishableKey }, cache: "no-store", signal }
    );
    if (!response.ok) throw new Error("Standortkatalog nicht erreichbar.");
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length > 50 || !rows.every(validStudio)) {
      throw new Error("Standortkatalog enthält ungültige Daten.");
    }
    return rows;
  }

  async function mount() {
    const status = document.querySelector("[data-nk-studio-data-status]");
    if (!status) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 9000);
    try {
      const studios = await loadStudios(controller.signal);
      const grevesmuehlen = studios.some(studio => studio.slug === "grevesmuehlen");
      status.textContent = grevesmuehlen
        ? "Grevesmühlen ist im digitalen Nordkern-Katalog geführt. Ein Eröffnungstermin ist noch nicht bestätigt."
        : "Der geplante Standort ist derzeit nicht im öffentlichen Katalog freigegeben. Ein Eröffnungstermin ist nicht bestätigt.";
    } catch {
      status.textContent =
        "Standortdaten sind momentan nicht abrufbar. Eine Studioeröffnung ist nicht bestätigt.";
    } finally {
      window.clearTimeout(timeout);
    }
  }

  window.NordkernStudios = { validStudio, loadStudios, mount };
  document.addEventListener("DOMContentLoaded", () => { void mount(); });
})();
