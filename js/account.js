/* Nordkern Fitness – existing-member portal, always backed by Supabase Auth and RLS.
   Public publishable key only; all privileged actions remain server-side. */
(() => {
  'use strict';
  const configuration = window.NordkernCatalog?.publicConfig;
  const KEY = 'nordkern-website-session-v1';
  const TEST_ONLY = true; // This branch is development-only; server independently requires sk_test_.
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let session = null;
  let activeUser = null;
  let studioChoice = null;
  let studios = [];
  let catalogue = [];
  let busy = false;

  function validSession(value) {
    return !!value && typeof value === 'object' &&
      typeof value.accessToken === 'string' && value.accessToken.length > 10 &&
      typeof value.refreshToken === 'string' && value.refreshToken.length > 10 &&
      Number.isFinite(value.expiresAt) && value.expiresAt > 0 &&
      typeof value.userId === 'string' && UUID.test(value.userId);
  }
  function safeCheckoutUrl(value) {
    if (typeof value !== 'string' || value.length > 4096) return false;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com' &&
        !url.username && !url.password;
    } catch { return false; }
  }
  function paidMembership(m, now) {
    const end = Date.parse(m?.current_period_end ?? '');
    const start = Date.parse(m?.starts_at ?? '');
    const cancel = m?.cancellation_effective_at ? Date.parse(m.cancellation_effective_at) : Infinity;
    return m?.status === 'active' && Number.isFinite(end) && Number.isFinite(start) &&
      start <= now && end > now && cancel > now;
  }
  function base() {
    if (!configuration || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(configuration.url) ||
        typeof configuration.publishableKey !== 'string' ||
        !configuration.publishableKey.startsWith('sb_publishable_')) {
      throw new Error('Nordkern ist nicht korrekt konfiguriert.');
    }
    return configuration;
  }
  function byId(id) { return document.getElementById(id); }
  function feedback(message, error = false) {
    const node = byId(error ? 'nk-account-error' : 'nk-account-feedback');
    const other = byId(error ? 'nk-account-feedback' : 'nk-account-error');
    if (other) { other.textContent = ''; other.hidden = true; }
    if (node) { node.textContent = message; node.hidden = !message; }
  }
  function store() {
    try {
      if (session) sessionStorage.setItem(KEY, JSON.stringify(session));
      else sessionStorage.removeItem(KEY);
    } catch { /* Store in memory when sessionStorage is disabled. */ }
  }
  async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
    const { url, publishableKey } = base();
    if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Ungültiger Dienstpfad.');
    const ctl = new AbortController();
    const timer = window.setTimeout(() => ctl.abort(), 15000);
    try {
      const response = await fetch(url + path, {
        method, signal: ctl.signal, cache: 'no-store',
        headers: {
          apikey: publishableKey, 'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      if (!response.ok) {
        if ([400,401,403].includes(response.status)) throw new Error('Anmeldung oder Berechtigung nicht bestätigt.');
        if (response.status === 409) throw new Error('Studio- oder Vertragsänderung ist momentan gesperrt.');
        if (response.status === 503) throw new Error('Der Stripe-Testdienst ist noch nicht freigeschaltet.');
        throw new Error('Nordkern-Dienst momentan nicht erreichbar (' + response.status + ').');
      }
      return response.status === 204 ? null : await response.json();
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('Zeitüberschreitung. Vorgang nicht bestätigt.');
      if (error instanceof TypeError) throw new Error('Verbindungsfehler. Vorgang nicht bestätigt.');
      throw error;
    } finally { window.clearTimeout(timer); }
  }
  function acceptAuthResponse(result, previousUserId = null) {
    const next = {
      accessToken: result?.access_token,
      refreshToken: result?.refresh_token,
      expiresAt: Date.now() + Number(result?.expires_in ?? 0) * 1000,
      userId: result?.user?.id,
    };
    if (!validSession(next) || (previousUserId && next.userId !== previousUserId)) {
      throw new Error('Die Antwort des Anmeldedienstes ist unvollständig.');
    }
    session = next;
    store();
  }
  async function refreshSession() {
    if (!validSession(session)) throw new Error('Bitte erneut anmelden.');
    if (session.expiresAt > Date.now() + 45000) return session.accessToken;
    const result = await request('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', body: { refresh_token: session.refreshToken }
    });
    acceptAuthResponse(result, session.userId);
    return session.accessToken;
  }
  async function token() {
    try { return await refreshSession(); }
    catch (error) { session = null; store(); throw error; }
  }
  async function authorized(path, options = {}) {
    const credential = await token();
    return request(path, { ...options, token: credential });
  }
  function list(node, rows) {
    node.replaceChildren();
    const ul = document.createElement('ul');
    ul.className = 'nk-account-list';
    if (!rows.length) rows = ['Noch keine Einträge vorhanden.'];
    for (const item of rows) {
      const li = document.createElement('li');
      li.textContent = String(item);
      ul.appendChild(li);
    }
    node.appendChild(ul);
  }
  function date(value) {
    const ts = Date.parse(value ?? '');
    return Number.isFinite(ts) ? new Date(ts).toLocaleDateString('de-DE') : 'nicht bestätigt';
  }
  function renderOptions(select, options, selectedValue) {
    select.replaceChildren();
    for (const row of options) {
      const option = document.createElement('option');
      option.value = row.id;
      option.textContent = row.name;
      option.selected = row.id === selectedValue;
      select.appendChild(option);
    }
  }
  function showAccount(visible) {
    byId('nk-member-panel').hidden = !visible;
    byId('nk-login-panel').hidden = visible;
  }
  async function loadAccount() {
    const identity = await authorized('/auth/v1/user');
    if (!UUID.test(identity?.id) || identity.id !== session.userId) {
      throw new Error('Identität konnte nicht sicher bestätigt werden.');
    }
    activeUser = identity.id;
    const user = identity.id;
    const [profiles, selections, memberships, passes, wallets, studioList, offers] = await Promise.all([
      authorized('/rest/v1/profiles?select=id,member_id,first_name,last_name,account_enabled&id=eq.' + user + '&limit=1'),
      authorized('/rest/v1/member_studios?select=studio_id,change_allowed_at&user_id=eq.' + user + '&limit=1'),
      authorized('/rest/v1/memberships?select=id,status,starts_at,current_period_end,cancellation_effective_at&user_id=eq.' + user + '&limit=30'),
      authorized('/rest/v1/passes?select=id,title,status,starts_at,expires_at&user_id=eq.' + user + '&limit=50'),
      authorized('/rest/v1/wallet_balances?select=drinks,creatine,protein&user_id=eq.' + user + '&limit=1'),
      authorized('/rest/v1/studios?select=id,name,slug,active&active=eq.true&order=name.asc&limit=50'),
      window.NordkernCatalog.loadCatalogue()
    ]);
    if (!Array.isArray(profiles) || profiles.length !== 1 || profiles[0].id !== user ||
        profiles[0].account_enabled !== true || !Array.isArray(selections) ||
        !Array.isArray(memberships) || !Array.isArray(passes) || !Array.isArray(wallets) ||
        !Array.isArray(studioList) || !Array.isArray(offers)) {
      throw new Error('Mitgliedsdaten konnten nicht zuverlässig geladen werden.');
    }
    studios = studioList.filter(row => UUID.test(row?.id) && row.active === true &&
      typeof row.name === 'string' && /^[a-z0-9-]+$/.test(row.slug));
    studioChoice = selections[0] ?? null;
    catalogue = offers.filter(row => row && ['membership','pass'].includes(row.kind) &&
      row.item && /^[a-z0-9-]{1,60}$/.test(row.item.slug));
    const person = profiles[0];
    byId('nk-member-name').textContent =
      [person.first_name,person.last_name].filter(v => typeof v === 'string' && v.trim()).join(' ') || 'Dein Nordkern-Konto';
    byId('nk-member-id').textContent = 'Mitgliedsnummer: ' + (person.member_id ?? 'nicht verfügbar');
    const selected = studios.find(studio => studio.id === studioChoice?.studio_id);
    byId('nk-studio-status').textContent = selected
      ? selected.name + ' · aktuell ausgewählt' : 'Noch kein aktives Studio ausgewählt.';
    renderOptions(byId('nk-studio-select'), studios, studioChoice?.studio_id);
    const locked = studioChoice && Date.parse(studioChoice.change_allowed_at) > Date.now();
    byId('nk-studio-select').disabled = !!locked;
    byId('nk-studio-save').disabled = !!locked || studios.length === 0;
    if (locked) byId('nk-studio-status').textContent +=
      ' · Nächster Wechsel frühestens ' + date(studioChoice.change_allowed_at);
    const messages = [];
    for (const m of memberships) messages.push(
      (paidMembership(m, Date.now()) ? 'Bezahlte Mitgliedschaft' : 'Nicht als bezahlt freigegeben') +
      ' · Status: ' + String(m.status) + ' · Bezahlt bis: ' + date(m.current_period_end)
    );
    for (const p of passes) messages.push(String(p.title) + ' · ' + String(p.status) +
      ' · Endet: ' + date(p.expires_at));
    const wallet = wallets[0];
    if (wallet) messages.push('Guthaben: ' + Number(wallet.drinks ?? 0) + ' Getränke · ' +
      Number(wallet.creatine ?? 0) + ' Kreatin · ' + Number(wallet.protein ?? 0) + ' Protein');
    list(byId('nk-member-contracts'), messages);
    renderOptions(byId('nk-offer-select'), catalogue.map((row, index) => ({
      id:String(index),name:String(row.item.name ?? row.item.title) + ' · ' +
        new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(
          (row.item.checkout_price_cents ?? row.item.price_cents) / 100)
    })), '');
    byId('nk-checkout-button').disabled = !TEST_ONLY || catalogue.length === 0 || !studioChoice;
    showAccount(true);
    if (new URLSearchParams(window.location.search).get('status') === 'success') {
      feedback('Zurück vom Stripe-Testcheckout. Eine Weiterleitung ist kein Zahlungsnachweis. Der Kontostatus wird ausschließlich serverseitig geführt.');
    }
  }
  async function run(fn) {
    if (busy) return;
    busy = true;
    const buttons = [...document.querySelectorAll('#nk-account-shell button, .nk-account-panel button')];
    buttons.forEach(button => { button.disabled = true; });
    feedback('');
    try { await fn(); }
    catch (error) { feedback(error instanceof Error ? error.message : 'Vorgang konnte nicht bestätigt werden.',true); }
    finally { busy = false; buttons.forEach(button => {
      if (button.id === 'nk-studio-save' || button.id === 'nk-checkout-button') return;
      button.disabled = false;
    }); }
  }
  async function login(event) {
    event.preventDefault();
    await run(async () => {
      const form = event.currentTarget;
      const email = String(form.elements.email.value ?? '').trim();
      const password = String(form.elements.password.value ?? '');
      if (!email || password.length < 8) throw new Error('Bitte E-Mail und Passwort eingeben.');
      const result = await request('/auth/v1/token?grant_type=password', {
        method:'POST', body:{ email, password }
      });
      acceptAuthResponse(result);
      form.elements.password.value = '';
      await loadAccount();
      feedback('Mitgliedskonto serverseitig geladen.');
    });
  }
  async function reset(event) {
    event.preventDefault();
    await run(async () => {
      const email = String(event.currentTarget.elements.email.value ?? '').trim();
      if (!email || email.length > 254) throw new Error('E-Mail-Adresse ungültig.');
      await request('/auth/v1/recover', {method:'POST',body:{email}});
      feedback('Wenn das Konto existiert und der Mailversand eingerichtet ist, erhältst du eine E-Mail.');
    });
  }
  async function saveStudio() {
    await run(async () => {
      if (!activeUser || !session) throw new Error('Bitte erneut anmelden.');
      const chosenId = byId('nk-studio-select').value;
      const row = studios.find(studio => studio.id === chosenId);
      if (!row) throw new Error('Bitte gültigen Standort auswählen.');
      const result = await authorized('/rest/v1/rpc/change_own_studio', {
        method:'POST', body:{p_studio_slug:row.slug}
      });
      if (!Array.isArray(result) || result.length !== 1 || result[0].studio_slug !== row.slug) {
        throw new Error('Die Studioänderung wurde nicht bestätigt.');
      }
      await loadAccount();
      feedback('Studioänderung serverseitig bestätigt.');
    });
  }
  async function startTestCheckout() {
    await run(async () => {
      if (!TEST_ONLY || !session || !studioChoice) throw new Error('Testbuchung nicht verfügbar.');
      const row = catalogue[Number(byId('nk-offer-select').value)];
      if (!row) throw new Error('Bitte einen Tarif oder Pass auswählen.');
      if (!crypto?.randomUUID) throw new Error('Sicherer Browser für Testcheckout erforderlich.');
      const idempotencyKey = 'nk-web-' + crypto.randomUUID();
      const result = await authorized('/functions/v1/create-offer-checkout', {
        method:'POST', headers:{'idempotency-key':idempotencyKey},
        body:{offerId:row.item.slug,offerType:row.kind,returnSurface:'web'}
      });
      if (!safeCheckoutUrl(result?.checkoutUrl)) {
        throw new Error('Die Stripe-Testseite wurde nicht bestätigt.');
      }
      window.location.assign(result.checkoutUrl);
    });
  }
  async function logout() {
    const old = session;
    session = null;activeUser = null;studioChoice = null;store();
    showAccount(false);
    feedback('Lokal abgemeldet.');
    if (old?.accessToken) {
      try { await request('/auth/v1/logout',{method:'POST',token:old.accessToken}); }
      catch { feedback('Lokal abgemeldet. Die serverseitige Sitzung konnte nicht widerrufen werden.',true); }
    }
  }
  async function mount() {
    if (!byId('nk-login-panel')) return;
    byId('nk-login-form').addEventListener('submit',event=>{void login(event);});
    byId('nk-reset-form').addEventListener('submit',event=>{void reset(event);});
    byId('nk-studio-save').addEventListener('click',()=>{void saveStudio();});
    byId('nk-checkout-button').addEventListener('click',()=>{void startTestCheckout();});
    byId('nk-logout').addEventListener('click',()=>{void logout();});
    byId('nk-reload').addEventListener('click',()=>{void run(loadAccount);});
    byId('nk-checkout-button').disabled=true;
    try {
      const cached = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
      if (validSession(cached)) session = cached;
    } catch { /* No persisted login. */ }
    if (session) {
      await run(loadAccount);
    } else showAccount(false);
  }
  window.NordkernAccount = {validSession,safeCheckoutUrl,paidMembership,mount};
  document.addEventListener('DOMContentLoaded',()=>{void mount();});
})();
