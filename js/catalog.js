/* Nordkern Fitness – public, read-only tariff catalogue.
   The key below is a Supabase PUBLISHABLE key; never put service/secret keys here.
   RLS protects the tables. No login, checkout, or write operations on this page. */
(() => {
  "use strict";

  const CONFIG = Object.freeze({
    url: "https://mfaqlfsaatmhvcqlpzoz.supabase.co",
    publishableKey: "sb_publishable_uU3OtB51Zzy8-YRKptpSzA_no2gfyVC"
  });

  const fields = {
    membership_plans: "slug,name,subtitle,price_cents,checkout_price_cents,minimum_term_months,billing_interval,credit_cycle,monthly_credits,features,promotion_badge,promotion_note,sort_order,active",
    pass_products: "slug,title,subtitle,price_cents,checkout_price_cents,duration_hours,credit_cycle,included_credits,features,promotion_badge,promotion_note,sort_order,active"
  };
  const legacySlugs = { "day-pass": "tagespass", "holiday-pass": "urlaubspass" };
  const validText = value => typeof value === "string" && value.trim().length > 0 && value.length <= 1000;
  const optionalText = value => value === null || (typeof value === "string" && value.length <= 1500);
  const validCents = value => Number.isSafeInteger(value) && value >= 0 && value <= 10000000;
  const validCredits = value => value && typeof value === "object" && !Array.isArray(value) &&
    ["drinks", "creatine", "protein"].every(key =>
      value[key] === undefined || (Number.isInteger(value[key]) && value[key] >= 0 && value[key] <= 100000));

  function validProduct(product, kind) {
    if (!product || typeof product !== "object" || Array.isArray(product)) return false;
    if (!/^[a-z0-9-]{1,60}$/.test(product.slug || "")) return false;
    if (product.active !== true || !validCents(product.price_cents) ||
        (product.checkout_price_cents !== null && !validCents(product.checkout_price_cents)) ||
        !optionalText(product.subtitle) || !optionalText(product.promotion_badge) ||
        !optionalText(product.promotion_note) || !Number.isSafeInteger(product.sort_order) ||
        !Array.isArray(product.features) || product.features.length > 40 ||
        !product.features.every(validText)) return false;
    if (kind === "membership") return validText(product.name) &&
      Number.isInteger(product.minimum_term_months) &&
      product.minimum_term_months >= 0 && product.minimum_term_months <= 120 &&
      validText(product.billing_interval) && validText(product.credit_cycle) &&
      validCredits(product.monthly_credits);
    return validText(product.title) && Number.isInteger(product.duration_hours) &&
      product.duration_hours >= 1 && product.duration_hours <= 8760 &&
      validText(product.credit_cycle) && validCredits(product.included_credits);
  }

  async function readTable(table, kind, signal) {
    const query = "?select=" + fields[table] + "&active=eq.true&order=sort_order.asc&limit=100";
    const response = await fetch(CONFIG.url + "/rest/v1/" + table + query, {
      headers: { apikey: CONFIG.publishableKey },
      cache: "no-store",
      signal
    });
    if (!response.ok) throw new Error("Der Nordkern-Tarifkatalog ist nicht erreichbar.");
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length > 100 || !rows.every(row => validProduct(row, kind))) {
      throw new Error("Die Tarifdaten sind unvollständig oder fehlerhaft.");
    }
    return rows.sort((a, b) => a.sort_order - b.sort_order);
  }

  async function loadCatalogue() {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 9000);
    try {
      const [plans, passes] = await Promise.all([
        readTable("membership_plans", "membership", controller.signal),
        readTable("pass_products", "pass", controller.signal)
      ]);
      return [...plans.map(item => ({ item, kind: "membership" })),
        ...passes.map(item => ({ item, kind: "pass" }))];
    } finally {
      window.clearTimeout(timer);
    }
  }

  function element(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function append(parent, ...children) {
    children.forEach(child => parent.appendChild(child));
    return parent;
  }
  function price(amount) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount / 100);
  }
  function creditText(credits, kind, cycle) {
    const labels = {
      drinks: ["Freigetränk", "Freigetränke"],
      creatine: ["Kreatin-Portion", "Kreatin-Portionen"],
      protein: ["Protein-Portion", "Protein-Portionen"]
    };
    const period = kind === "membership" && cycle === "monthly" ? " / Monat" : "";
    return Object.entries(labels)
      .filter(([key]) => Number.isInteger(credits?.[key]) && credits[key] > 0)
      .map(([key, forms]) => credits[key] + " " + forms[credits[key] === 1 ? 0 : 1] + period);
  }
  function duration(item, kind) {
    if (kind === "membership") return "Mindestlaufzeit: " + item.minimum_term_months + " Monate";
    if (item.duration_hours % 24 === 0) {
      const days = item.duration_hours / 24;
      return "Zugang: " + days + (days === 1 ? " Tag" : " Tage");
    }
    return "Zugang: " + item.duration_hours + " Stunden";
  }
  function period(item, kind) {
    if (kind === "pass") return "einmalig";
    if (item.billing_interval === "month") return "pro Monat";
    if (item.billing_interval === "year") return "pro Jahr";
    return item.billing_interval;
  }
  function displayName(item, kind) {
    return kind === "membership" ? item.name : item.title;
  }
  function legacyId(slug) {
    return legacySlugs[slug] || slug;
  }
  function displayShortName(item, kind) {
    const name = displayName(item, kind).replace(/^Nordkern\s+/i, "");
    return name.length > 24 ? name.slice(0, 24) + "…" : name;
  }
  function makeTab(row, index) {
    const item = row.item;
    const id = legacyId(item.slug);
    const button = element("button", "pricing-tab-button" + (index === 0 ? " is-active" : ""),
      displayShortName(item, row.kind));
    button.type = "button";
    button.setAttribute("role", "tab");
    button.id = "tab-" + id;
    button.dataset.plan = id;
    button.setAttribute("aria-controls", "plan-" + id);
    button.setAttribute("aria-selected", index === 0 ? "true" : "false");
    button.tabIndex = index === 0 ? 0 : -1;
    return button;
  }
  function makeSection(title, lines, className) {
    const section = element("div", "pricing-side-card-v3");
    const heading = element("h3", "", title);
    const list = element("ul", className);
    for (const line of lines) append(list, element("li", "", line));
    append(section, heading, list);
    return section;
  }
  function makePanel(row, index) {
    const { item, kind } = row;
    const id = legacyId(item.slug);
    const article = element("article", "pricing-plan" + (index === 0 ? " is-active" : ""));
    article.id = "plan-" + id;
    article.dataset.planPanel = id;
    article.setAttribute("role", "tabpanel");
    article.setAttribute("aria-labelledby", "tab-" + id);
    article.hidden = index !== 0;
    const layout = element("div", "pricing-plan-layout-v3");
    const main = element("div", "pricing-plan-main-v3");
    const heading = element("h2", "pricing-plan-name-v3");
    const name = displayName(item, kind).replace(/^Nordkern\s+/i, "");
    append(heading, document.createTextNode("Nordkern "), element("span", "", name + "."));
    append(main,
      element("p", "pricing-plan-kicker-v3",
        kind === "membership" ? "Nordkern Mitgliedschaft" : "Einmaliger Zugang"),
      heading);

    if (item.subtitle) append(main, element("p", "pricing-catalog-subtitle", item.subtitle));
    const priceArea = element("div", "pricing-price-area-v3");
    const priceRow = element("div", "pricing-price-row-v3");
    const effective = item.checkout_price_cents ?? item.price_cents;
    append(priceRow, element("p", "pricing-price-v3", price(effective)),
      element("p", "pricing-price-unit-v3", period(item, kind)));
    if (effective < item.price_cents) {
      append(priceRow, element("del", "pricing-catalog-old-price", price(item.price_cents)));
    }
    append(priceArea, priceRow, element("p", "pricing-runtime-pill", duration(item, kind)));
    if (item.promotion_badge) {
      append(priceArea, element("p", "pricing-catalog-promotion", item.promotion_badge));
    }
    if (item.promotion_note) append(priceArea, element("p", "pricing-catalog-note", item.promotion_note));

    const actions = element("div", "pricing-actions-v3");
    const link = element("a", "btn btn-primary", "Zur App-Info");
    link.href = "app.html";
    append(actions, link);
    append(priceArea, actions,
      element("p", "pricing-catalog-note", "Buchungen sind derzeit noch nicht möglich."));
    append(main, priceArea);

    const side = element("aside", "pricing-side-v3");
    side.setAttribute("aria-label", "Leistungen von " + displayName(item, kind));
    const features = makeSection("Enthalten", item.features, "pricing-feature-list-v3");
    const credits = creditText(
      kind === "membership" ? item.monthly_credits : item.included_credits,
      kind, item.credit_cycle);
    append(side, features);
    if (credits.length) append(side,
      makeSection("Getränkeautomat & Kontingente", credits, "pricing-extra-list-v3"));

    append(layout, main, side);
    append(article, layout);
    return article;
  }

  async function mount() {
    const tabs = document.querySelector(".pricing-tabs");
    const panels = document.querySelector("[data-catalog-panels]");
    const status = document.querySelector("[data-catalog-status]");
    if (!tabs || !panels || !status) return false;
    tabs.replaceChildren();
    panels.replaceChildren();
    status.textContent = "Veröffentlichte Tarife werden geladen …";
    status.dataset.state = "loading";

    try {
      const rows = await loadCatalogue();
      if (!rows.length) {
        status.textContent = "Aktuell sind keine Tarife veröffentlicht.";
        status.dataset.state = "empty";
        return false;
      }
      tabs.style.gridTemplateColumns = "repeat(" + rows.length + ", minmax(92px, 1fr))";
      rows.forEach((row, index) => {
        append(tabs, makeTab(row, index));
        append(panels, makePanel(row, index));
      });
      tabs.setAttribute("aria-busy", "false");
      panels.setAttribute("aria-busy", "false");
      status.textContent = "Aktuelle Angebote aus dem Nordkern-Katalog · Buchungen noch nicht verfügbar.";
      status.dataset.state = "ready";
      return true;
    } catch (error) {
      status.dataset.state = "error";
      status.textContent = "Tarife können gerade nicht geladen werden. Es werden keine veralteten Preise angezeigt.";
      const retry = element("button", "btn btn-primary pricing-catalog-retry", "Erneut versuchen");
      retry.type = "button";
      retry.addEventListener("click", () => window.location.reload());
      panels.replaceChildren(retry);
      return false;
    }
  }

  window.NordkernCatalog = { mount, loadCatalogue, validProduct, publicConfig: CONFIG };
})();
