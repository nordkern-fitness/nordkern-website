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
  let pendingCheckout = null;
  let pendingShopCheckout = null;
  let webCheckoutEnabled = false;
  let shopCheckoutReady = false;
  let shopCart = [];
  let orderSnapshot = null;
  let signupStudios = [];

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
  function safeBillingPortalUrl(value) {
    if (typeof value !== 'string' || value.length > 4096) return false;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'billing.stripe.com' &&
        !url.username && !url.password && !url.hash;
    } catch { return false; }
  }
  /** A purchased membership retains its original price and features snapshot.
   * Never display current catalogue prices as an existing member's contract. */
  function contractStatusLabel(m, now) {
    const details = [
      paidMembership(m,now) ? 'Bezahlte Mitgliedschaft' : 'Nicht als bezahlt freigegeben',
      'Status: ' + String(m?.status ?? 'unbekannt'),
      'Bezahlt bis: ' + date(m?.current_period_end)
    ];
    const name = m?.pricing_snapshot?.plan_name;
    if (typeof name === 'string' && name.trim().length > 0 && name.length <= 160) {
      details.push('Tarif: ' + name.trim());
    }
    const amount = m?.contract_price_cents;
    if (Number.isSafeInteger(amount) && amount > 0 && m?.currency === 'eur') {
      const formatted = new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'})
        .format(amount/100);
      details.push('Vertragspreis: ' + formatted +
        (m?.pricing_snapshot?.billing_interval === 'month' ? ' monatlich' : ''));
    }
    const minimumEnd = m?.minimum_term_ends_at;
    if (typeof minimumEnd === 'string' && Number.isFinite(Date.parse(minimumEnd))) {
      details.push('Mindestlaufzeit bis: ' + date(minimumEnd));
    }
    const cancellation = m?.cancellation_effective_at;
    if (typeof cancellation === 'string' && Number.isFinite(Date.parse(cancellation))) {
      details.push('Kündigung vorgemerkt zum: ' + date(cancellation));
    }
    return details.join(' · ');
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
  function detailsForContract(m, now) {
    const snapshot = m?.pricing_snapshot;
    const safeName = typeof snapshot?.plan_name === 'string' &&
      snapshot.plan_name.trim().length > 0 && snapshot.plan_name.length <= 160
      ? snapshot.plan_name.trim() : 'Mitgliedschaft';
    const active = paidMembership(m, now);
    const lines = [
      'Status: ' + String(m?.status ?? 'unbekannt'),
      'Bezahlter Zeitraum bis: ' + date(m?.current_period_end),
    ];
    if (Number.isSafeInteger(m?.contract_price_cents) &&
        m.contract_price_cents >= 0 && m?.currency === 'eur') {
      lines.push('Dein bestätigter Vertragspreis: ' +
        euro(m.contract_price_cents) +
        (snapshot?.billing_interval === 'month' ? ' monatlich' : ''));
    }
    if (m?.minimum_term_ends_at) {
      lines.push('Mindestlaufzeit bis: ' + date(m.minimum_term_ends_at));
    }
    if (m?.cancellation_effective_at) {
      lines.push('Kündigung vorgemerkt zum: ' + date(m.cancellation_effective_at));
    }
    return { name:safeName, active, lines };
  }
  function renderContractOverview(memberships, passes, wallet, now) {
    const area = byId('nk-member-contracts');
    area.replaceChildren();
    if (!memberships.length && !passes.length) {
      area.appendChild(element('p','Noch keine bestätigten Verträge oder Pässe vorhanden.'));
    }
    for (const membership of memberships) {
      const info = detailsForContract(membership, now);
      const card = element('section');
      card.className = 'nk-account-contract';
      card.appendChild(element('h3',info.name));
      const badge = element('span',info.active ? 'Bezahlter Zutrittszeitraum' : 'Kein bestätigter aktiver Zutrittszeitraum');
      badge.className = 'nk-account-status';
      badge.dataset.active = String(info.active);
      card.appendChild(badge);
      for (const line of info.lines) card.appendChild(element('p',line));
      area.appendChild(card);
    }
    for (const pass of passes) {
      const card = element('section');
      card.className = 'nk-account-contract';
      const title = typeof pass?.title === 'string' && pass.title.length <= 180
        ? pass.title : 'Pass';
      card.appendChild(element('h3',title));
      card.appendChild(element('p','Status: '+String(pass?.status ?? 'unbekannt')));
      card.appendChild(element('p','Gültig ab: '+date(pass?.starts_at)));
      card.appendChild(element('p','Gültig bis: '+date(pass?.expires_at)));
      area.appendChild(card);
    }
    const walletCard = element('section');
    walletCard.className = 'nk-account-contract';
    walletCard.appendChild(element('h3','Dein Guthaben'));
    const entries = [['drinks','Freigetränke'],['additional_drinks','Zusätzliche Getränke'],
      ['creatine','Kreatin'],['protein','Protein']];
    if (!wallet) {
      walletCard.appendChild(element('p','Für dieses Konto ist kein Guthabenstand bestätigt.'));
    } else {
      for (const [key,name] of entries) {
        const value = wallet[key];
        walletCard.appendChild(element('p',name+': '+
          (Number.isSafeInteger(value)&&value>=0 ? String(value) : 'nicht bestätigt')));
      }
    }
    area.appendChild(walletCard);
  }
  function orderStatusName(status) {
    return {
      pending_payment:'Zahlung ausstehend',paid:'Bezahlt',
      partially_refunded:'Teilweise erstattet · Prüfung offen',
      refunded:'Erstattet',failed:'Zahlung fehlgeschlagen',cancelled:'Abgebrochen'
    }[status] || 'Nicht bestätigt';
  }
  function renderOrders() {
    const node = byId('nk-web-order-history');
    const filter = byId('nk-order-filter').value;
    const summary = byId('nk-order-count');
    node.replaceChildren();
    if (!orderSnapshot) {
      summary.textContent = 'Bestellungen konnten nicht sicher geladen werden.';
      node.appendChild(element('p','Keine verifizierte Bestellhistorie verfügbar.'));
      return;
    }
    const {orders,items} = orderSnapshot;
    const shown = filter === 'all' ? orders : orders.filter(order=>order.status===filter);
    summary.textContent = shown.length+' von '+orders.length+
      ' zuletzt geladenen Bestellungen angezeigt (max. 30).';
    if (!shown.length) {
      node.appendChild(element('p',orders.length
        ? 'Für diesen Status wurden keine Bestellungen gefunden.' :
          'Du hast noch keine Bestellungen.'));
      return;
    }
    for (const order of shown) {
      const card = element('section');
      card.className = 'nk-account-order';
      const label = typeof order.public_number === 'string' &&
        order.public_number.length <= 100 ? order.public_number : 'Bestellung';
      card.appendChild(element('strong',label+' · '+orderStatusName(order.status)+
        ' · '+euro(order.total_cents)));
      card.appendChild(element('p','Bestellt am '+date(order.created_at)));
      if (order.paid_at) card.appendChild(element('p','Zahlung bestätigt am '+date(order.paid_at)));
      if (Number.isSafeInteger(order.refunded_cents)&&order.refunded_cents>0) {
        card.appendChild(element('p','Als erstattet erfasst: '+euro(order.refunded_cents)));
      }
      for (const item of items.filter(entry=>entry.order_id===order.id)) {
        card.appendChild(element('p',item.quantity+' × '+item.title+
          ' · '+euro(item.quantity*item.unit_price_cents)));
      }
      node.appendChild(card);
    }
  }
  function renderPortalCart(products, canCheckout) {
    const cartApi = window.NordkernShopCart;
    const display = byId('nk-web-shop-cart');
    const status = byId('nk-web-shop-checkout-status');
    const original = cartApi.readCart();
    const eligible = cartApi.publishedCart(original,products);
    if (eligible.length !== original.length) {
      // The server catalogue changed; stale selections must not reach checkout.
      cartApi.writeCart(eligible);
    }
    shopCart = eligible;
    display.replaceChildren();
    let total=0;
    for (const line of eligible) {
      const product = products.find(item=>item.id===line.product_id);
      if (!product) continue;
      const row = element('div');
      row.className = 'nk-account-cart-line';
      const description = element('p',product.title+' · '+euro(product.price_cents*line.quantity));
      const controls = element('div');
      controls.className = 'nk-account-cart-actions';
      const quantity = element('span',line.quantity);
      const change = (delta) => {
        try {
          cartApi.writeCart(cartApi.updateCart(cartApi.readCart(),product.id,delta));
          pendingShopCheckout=null;
          renderPortalCart(products,canCheckout);
        } catch {
          status.textContent = 'Warenkorb konnte nicht gespeichert werden. Bitte prüfe die Browserfreigaben.';
        }
      };
      const minus = element('button','−');
      minus.type = 'button'; minus.disabled = false;
      minus.className = 'nk-account-subtle';
      minus.setAttribute('aria-label',product.title+' entfernen');
      minus.addEventListener('click',()=>change(-1));
      const plus = element('button','+');
      plus.type = 'button';
      plus.disabled = line.quantity>=10 ||
        eligible.reduce((sum,item)=>sum+item.quantity,0)>=20;
      plus.className = 'nk-account-subtle';
      plus.setAttribute('aria-label',product.title+' hinzufügen');
      plus.addEventListener('click',()=>change(1));
      controls.appendChild(minus);
      controls.appendChild(quantity);
      controls.appendChild(plus);
      row.appendChild(description);
      row.appendChild(controls);
      display.appendChild(row);
      total+=product.price_cents*line.quantity;
    }
    if (!eligible.length) display.appendChild(element('p','Dein digitaler Testwarenkorb ist leer.'));
    else display.appendChild(element('strong','Warenkorbvorschau: '+euro(total)+
      '. Der verbindliche Preis wird beim serverseitigen Checkout überprüft.'));
    shopCheckoutReady = canCheckout && eligible.length>0 && cartApi.validCart(eligible);
    byId('nk-web-shop-checkout').disabled = !shopCheckoutReady;
    status.textContent = eligible.length!==original.length
      ? 'Nicht mehr veröffentlichte Artikel wurden aus dem Warenkorb entfernt. Bitte prüfe die Auswahl.'
      : shopCheckoutReady
        ? 'Testcheckout kann angefragt werden. Der Server prüft jede Position und Berechtigung erneut.'
        : 'Checkout noch nicht freigeschaltet oder Warenkorb leer. Es wird keine Zahlung ausgelöst.';
  }
  function memberSectionFromHash(value) {
    return ['#vertraege','#shop','#bestellungen','#geraete','#konto-sicherheit']
      .includes(value) ? value.slice(1) : null;
  }
  function focusRequestedMemberSection() {
    const target = memberSectionFromHash(window.location?.hash);
    if (target) {
      const section = byId(target);
      if (section?.scrollIntoView) section.scrollIntoView({behavior:'auto',block:'start'});
    }
  }

  async function loadAccount() {
    const identity = await authorized('/auth/v1/user');
    if (!UUID.test(identity?.id) || identity.id !== session.userId) {
      throw new Error('Identität konnte nicht sicher bestätigt werden.');
    }
    activeUser = identity.id;
    const user = identity.id;
    const [profiles, selections, memberships, passes, wallets, studioList, offers, checkoutCapabilities] = await Promise.all([
      authorized('/rest/v1/profiles?select=id,member_id,first_name,last_name,account_enabled&id=eq.' + user + '&limit=1'),
      authorized('/rest/v1/member_studios?select=studio_id,change_allowed_at&user_id=eq.' + user + '&limit=1'),
      authorized('/rest/v1/memberships?select=id,status,starts_at,current_period_end,cancellation_effective_at,minimum_term_ends_at,contract_price_cents,currency,pricing_snapshot&user_id=eq.' + user + '&limit=30'),
      authorized('/rest/v1/passes?select=id,title,status,starts_at,expires_at&user_id=eq.' + user + '&limit=50'),
      authorized('/rest/v1/wallet_balances?select=drinks,additional_drinks,creatine,protein&user_id=eq.' + user + '&limit=1'),
      authorized('/rest/v1/studios?select=id,name,slug,active&active=eq.true&order=name.asc&limit=50'),
      window.NordkernCatalog.loadCatalogue(),
      authorized('/functions/v1/create-offer-checkout')
        .catch(() => ({webCheckoutEnabled:false}))
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
    renderContractOverview(memberships,passes,wallets[0]??null,Date.now());
    renderOptions(byId('nk-offer-select'), catalogue.map((row, index) => ({
      id:String(index),name:String(row.item.name ?? row.item.title) + ' · ' +
        new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(
          (row.item.checkout_price_cents ?? row.item.price_cents) / 100)
    })), '');
    const checkoutAvailable = TEST_ONLY && checkoutCapabilities?.testMode === true &&
      checkoutCapabilities?.webCheckoutEnabled === true;
    webCheckoutEnabled = checkoutAvailable;
    byId('nk-checkout-button').disabled = !checkoutAvailable ||
      catalogue.length === 0 || !studioChoice;
    byId('nk-billing-portal').disabled = !checkoutAvailable;
    const availability = byId('nk-checkout-availability');
    if (availability) availability.textContent = checkoutAvailable
      ? 'Stripe-Testbuchungen sind serverseitig freigeschaltet. Es werden keine Live-Zahlungen durchgeführt.'
      : 'Testbuchungen sind noch nicht freigeschaltet. Du kannst Tarife und Kontostand trotzdem ansehen.';
    showAccount(true);
    void loadOwnDevices(user).catch(error=>{
      if(session?.userId===user && activeUser===user){
        byId('nk-own-devices').textContent=error instanceof Error
          ? error.message : 'Geräteliste konnte nicht geprüft werden.';
      }
    });
    await loadShopAccount(checkoutAvailable,user);
    const returnStatus = new URLSearchParams(window.location.search).get('status');
    if (returnStatus === 'success') {
      feedback('Zurück vom Stripe-Testcheckout. Eine Weiterleitung ist kein Zahlungsnachweis. Nutze „Daten aktualisieren“, bis die Zahlung serverseitig bestätigt ist.');
    } else if (returnStatus === 'cancelled') {
      feedback('Stripe-Testcheckout verlassen. Bitte prüfe den serverseitigen Bestell- und Vertragsstatus.');
    }
    focusRequestedMemberSection();
  }

  const euro = value => new Intl.NumberFormat('de-DE',{
    style:'currency',currency:'EUR'
  }).format(value/100);
  const element = (tag, textValue) => {
    const node = document.createElement(tag);
    if (textValue !== undefined) node.textContent = String(textValue);
    return node;
  };
  async function loadOwnDevices(userId){
    if(!session || session.userId!==userId || activeUser!==userId || !UUID.test(userId))
      throw new Error('Bitte erneut anmelden, um Geräte zu verwalten.');
    const area=byId('nk-own-devices');
    area.textContent='Geräteberechtigungen werden vom Server geprüft.';
    const devices=await authorized('/rest/v1/devices?select=id,user_id,platform,last_seen_at,trusted_at,revoked_at&user_id=eq.'+
      userId+'&order=created_at.desc&limit=20');
    if(!session || session.userId!==userId || activeUser!==userId)return;
    if(!Array.isArray(devices)||devices.length>20||devices.some(item=>
       !UUID.test(item?.id)||item.user_id!==userId||
       !['ios','android'].includes(item.platform)||
       typeof item.last_seen_at!=='string'||
       !Number.isFinite(Date.parse(item.last_seen_at))||
       (item.revoked_at!==null && (typeof item.revoked_at!=='string'||
         !Number.isFinite(Date.parse(item.revoked_at))))||
       (item.trusted_at!==null && (typeof item.trusted_at!=='string'||
         !Number.isFinite(Date.parse(item.trusted_at))))))
      throw new Error('Geräteliste wurde nicht sicher bestätigt.');
    area.replaceChildren();
    if(!devices.length){
      area.appendChild(element('p','Noch keine registrierten Geräte vorhanden.'));
      return;
    }
    for(const device of devices){
      const row=element('div');
      row.className='nk-own-device-row';
      const label=element('p',(device.platform==='ios'?'iPhone / iOS':'Android')+
        ' · Zuletzt verbunden: '+date(device.last_seen_at)+
        (device.revoked_at?' · Gesperrt seit '+date(device.revoked_at):
          device.trusted_at?' · QR-Zutritt aktiv':' · Noch nicht bestätigt'));
      row.appendChild(label);
      if(device.revoked_at===null){
        const button=element('button','Diesen QR-Geräteschlüssel sperren');
        button.type='button';button.className='nk-account-subtle';
        button.setAttribute('aria-label','QR-Zutritt für '+device.platform+' Gerät widerrufen');
        button.addEventListener('click',()=>{void run(async()=>{
          if(!window.confirm('QR-Zutritt für dieses Gerät sofort sperren? Eine erneute Registrierung ist danach erforderlich.'))return;
          const result=await authorized('/rest/v1/rpc/revoke_own_device',{
            method:'POST',body:{p_device_id:device.id}
          });
          if(result!==true && result!==false)
            throw new Error('Gerätesperre wurde nicht bestätigt.');
          await loadOwnDevices(userId);
          feedback(result===true
            ?'QR-Zutritt dieses Geräts wurde serverseitig gesperrt.'
            :'Dieses Gerät war bereits gesperrt.');
        });});
        row.appendChild(button);
      }
      area.appendChild(row);
    }
  }
  async function loadShopAccount(canCheckout,userId) {
    const display=byId('nk-web-shop-cart');
    const status=byId('nk-web-shop-checkout-status');
    const history=byId('nk-web-order-history');
    shopCheckoutReady=false;
    orderSnapshot=null;
    byId('nk-web-shop-checkout').disabled=true;
    display.replaceChildren();
    history.textContent='Bestellhistorie wird aktualisiert.';
    status.textContent='Veröffentlichtes Shopsortiment wird geprüft.';
    try {
      if (!window.NordkernShop || !window.NordkernShopCart)
        throw new Error('Warenkorb-Dienst fehlt.');
      const [catalogue,orders]=await Promise.all([
        window.NordkernShop.loadCatalogue(),
        authorized('/rest/v1/orders?select=id,user_id,public_number,status,currency,total_cents,created_at,paid_at,refunded_cents&user_id=eq.'+
          userId+'&order=created_at.desc&limit=30')
      ]);
      if(!Array.isArray(orders)||orders.length>30||orders.some(order=>
        !UUID.test(order?.id)||order.user_id!==userId||order.currency!=='eur'||
        typeof order.total_cents!=='number'||!Number.isSafeInteger(order.total_cents)||
        order.total_cents<0||
        !['pending_payment','paid','partially_refunded','failed','cancelled','refunded'].includes(order.status)))
        throw new Error('Bestellhistorie konnte nicht sicher überprüft werden.');
      const ids=orders.map(order=>order.id);
      const items=ids.length ? await authorized(
        '/rest/v1/order_items?select=id,order_id,title,quantity,unit_price_cents&order_id=in.('+
        ids.join(',')+')&limit=200') : [];
      if(!Array.isArray(items)||items.length>200||
        items.some(item=>!UUID.test(item?.id)||!ids.includes(item.order_id)||
          typeof item.title!=='string'||!Number.isSafeInteger(item.quantity)||
          item.quantity<1||!Number.isSafeInteger(item.unit_price_cents)||
          item.unit_price_cents<0))
        throw new Error('Bestellpositionen konnten nicht sicher überprüft werden.');

      orderSnapshot={orders,items};
      renderOrders();
      renderPortalCart(catalogue.products,canCheckout);
    } catch(error) {
      shopCheckoutReady=false;
      orderSnapshot=null;
      byId('nk-order-count').textContent='Bestellhistorie nicht verfügbar.';
      byId('nk-web-shop-checkout').disabled=true;
      status.textContent='Shop und Testkasse derzeit nicht verfügbar.';
      history.textContent=error instanceof Error?error.message:'Bestellungen konnten nicht geladen werden.';
    }
  }
  async function startShopTestCheckout() {
    await run(async()=>{
      if(!shopCheckoutReady||!webCheckoutEnabled||!session||!activeUser||
        !window.NordkernShopCart?.validCart(shopCart)||!shopCart.length)
        throw new Error('Shop-Testcheckout ist derzeit nicht verfügbar.');
      if(!window.crypto?.randomUUID)
        throw new Error('Sicherer Browser für Testcheckout erforderlich.');
      const signature=activeUser+':'+JSON.stringify(shopCart);
      if(pendingShopCheckout?.signature!==signature){
        pendingShopCheckout={signature,key:'nk-web-shop-'+window.crypto.randomUUID()};
      }
      const result=await authorized('/functions/v1/create-shop-checkout',{
        method:'POST',headers:{'idempotency-key':pendingShopCheckout.key},
        body:{items:shopCart,returnSurface:'web'}
      });
      if(!safeCheckoutUrl(result?.checkoutUrl)||!UUID.test(result?.orderId)||
        result.status!=='pending_payment')
        throw new Error('Bestellung oder Stripe-Testcheckout nicht bestätigt.');
      window.location.assign(result.checkoutUrl);
    });
  }
  async function changeOwnPassword(event) {
    event.preventDefault();
    await run(async()=>{
      if(!session)throw new Error('Bitte erneut anmelden.');
      const form=event.currentTarget;
      const oldPassword=String(form.elements.oldPassword.value??'');
      const newPassword=String(form.elements.newPassword.value??'');
      const confirm=String(form.elements.newPasswordRepeat.value??'');
      if(!oldPassword||newPassword.length<12||newPassword.length>256||
        oldPassword===newPassword||newPassword!==confirm)
        throw new Error('Neues Passwort ungültig oder Bestätigung stimmt nicht überein.');
      await authorized('/auth/v1/user',{method:'PUT',
        body:{current_password:oldPassword,password:newPassword}});
      form.reset();
      feedback('Der Anmeldedienst hat das neue Passwort bestätigt.');
    });
  }

  async function run(fn) {
    if (busy) return;
    busy = true;
    const buttons = [...document.querySelectorAll('#nk-account-shell button, .nk-account-panel button')];
    buttons.forEach(button => { button.disabled = true; });
    feedback('');
    try { await fn(); }
    catch (error) {
      if (!session) showAccount(false);
      feedback(error instanceof Error ? error.message : 'Vorgang konnte nicht bestätigt werden.',true);
    }
    finally { busy = false; buttons.forEach(button => {
      if (button.id === 'nk-signup-submit' ||
          button.id === 'nk-studio-save' || button.id === 'nk-checkout-button' ||
          button.id === 'nk-web-shop-checkout' || button.id === 'nk-billing-portal') return;
      button.disabled = false;
    }); }
  }
  const SIGNUP_STUDIO_SLUG = /^[a-z0-9][a-z0-9-]{0,59}$/;
  function validateSignupInput(value) {
    const email = String(value?.email ?? '').trim();
    const firstName = String(value?.firstName ?? '').trim();
    const lastName = String(value?.lastName ?? '').trim();
    const homeStudioSlug = String(value?.homeStudioSlug ?? '').trim();
    const password = String(value?.password ?? '');
    if (email.length>254 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email))
      throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');
    if (password.length<12 || password.length>256)
      throw new Error('Bitte ein Passwort mit 12 bis 256 Zeichen verwenden.');
    if (!firstName || !lastName || firstName.length>100 || lastName.length>100)
      throw new Error('Vor- und Nachname sind erforderlich (je höchstens 100 Zeichen).');
    if (!SIGNUP_STUDIO_SLUG.test(homeStudioSlug) ||
        !signupStudios.some(studio=>studio.slug===homeStudioSlug))
      throw new Error('Bitte ein gültiges Startstudio auswählen.');
    if (value.acceptedTerms!==true || value.acceptedPrivacy!==true)
      throw new Error('Bitte AGB-Entwurf und Datenschutzinformationen bestätigen.');
    return {email,password,firstName,lastName,homeStudioSlug};
  }
  function showSignupPanel(open) {
    byId('nk-login-form').hidden=open;
    byId('nk-reset-form').hidden=open;
    byId('nk-confirmation-form').hidden=open;
    byId('nk-signup-form').hidden=!open;
    byId('nk-show-signup').hidden=open;
    byId('nk-show-signup').setAttribute('aria-expanded',String(open));
    feedback('');
    if (open) byId('nk-signup-first').focus();
    else byId('nk-login-email').focus();
  }
  async function loadSignupStudios() {
    const select = byId('nk-signup-studio');
    const status = byId('nk-signup-studio-status');
    const submit = byId('nk-signup-submit');
    submit.disabled=true;
    select.disabled=true;
    status.textContent='Verfügbare Startstudios werden geladen …';
    try {
      const data=await request(
        '/rest/v1/studios?select=id,name,slug,active&active=eq.true&order=name.asc&limit=50');
      if (!Array.isArray(data) || data.length>50 ||
        data.some(row=>!UUID.test(row?.id) || typeof row.name!=='string' ||
          row.name.length<1 || row.name.length>160 ||
          !SIGNUP_STUDIO_SLUG.test(row.slug) || row.active!==true)) {
        throw new Error('Studioauswahl ist unvollständig.');
      }
      signupStudios=data;
      select.replaceChildren();
      const placeholder=document.createElement('option');
      placeholder.value='';placeholder.textContent='Bitte Startstudio auswählen';
      select.appendChild(placeholder);
      for(const row of signupStudios){
        const option=document.createElement('option');
        option.value=row.slug;option.textContent=row.name;select.appendChild(option);
      }
      select.disabled=signupStudios.length===0;
      submit.disabled=signupStudios.length===0;
      status.textContent=signupStudios.length
        ? 'Die Studioauswahl stammt aus dem freigegebenen Standortkatalog.'
        : 'Derzeit ist kein registrierbares Startstudio verfügbar.';
    } catch {
      signupStudios=[];
      select.replaceChildren();
      status.textContent='Studioauswahl derzeit nicht erreichbar. Bitte erneut versuchen.';
    }
  }
  async function signup(event) {
    event.preventDefault();
    await run(async()=>{
      const form=event.currentTarget;
      const fields=form.elements;
      const confirmed=validateSignupInput({
        email:fields.email.value,password:fields.password.value,
        firstName:fields.firstName.value,lastName:fields.lastName.value,
        homeStudioSlug:fields.homeStudioSlug.value,
        acceptedTerms:fields.acceptedTerms.checked,
        acceptedPrivacy:fields.acceptedPrivacy.checked,
      });
      const result=await request('/auth/v1/signup',{
        method:'POST',body:{
          email:confirmed.email,password:confirmed.password,
          data:{
            first_name:confirmed.firstName,last_name:confirmed.lastName,
            home_studio_slug:confirmed.homeStudioSlug,
            terms_accepted:true,privacy_accepted:true,marketing_accepted:false,
          },
        },
      });
      // Email confirmation may be required: no access token means no login.
      form.elements.password.value='';
      if (result?.access_token && result?.refresh_token && result?.user) {
        acceptAuthResponse(result);
        await loadAccount();
        feedback('Konto registriert und serverseitig angemeldet. Mitgliedschaften sind weiterhin unbezahlt.');
      } else if (result?.user && UUID.test(result.user.id)) {
        showSignupPanel(false);
        byId('nk-login-email').value=confirmed.email;
        feedback('Registrierungsanfrage angenommen. Bitte bestätige deine E-Mail, falls eine Nachricht eintrifft. Es besteht noch keine aktive Anmeldung.');
      } else {
        throw new Error('Der Anmeldedienst hat die Registrierung nicht bestätigt.');
      }
    });
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
  async function resendSignupConfirmation(event) {
    event.preventDefault();
    await run(async () => {
      const email = String(event.currentTarget.elements.email.value ?? '').trim();
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');
      }
      await request('/auth/v1/resend',{method:'POST',body:{type:'signup',email}});
      feedback('Wenn eine Bestätigung aussteht und die E-Mail-Zustellung eingerichtet ist, erhältst du eine weitere Nachricht.');
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
  async function openTestBillingPortal() {
    await run(async () => {
      if (!TEST_ONLY || !webCheckoutEnabled || !session || !activeUser) {
        throw new Error('Stripe-Testabrechnung ist derzeit nicht freigeschaltet.');
      }
      const result = await authorized('/functions/v1/create-test-billing-portal', {
        method:'POST', body:{returnSurface:'web'}
      });
      if (result?.testMode !== true || !safeBillingPortalUrl(result?.url)) {
        throw new Error('Sicherer Stripe-Testportal-Link wurde nicht bestätigt.');
      }
      window.location.assign(result.url);
    });
  }
  async function startTestCheckout() {
    await run(async () => {
      if (!TEST_ONLY || !session || !studioChoice || !webCheckoutEnabled)
        throw new Error('Testbuchung nicht verfügbar.');
      const row = catalogue[Number(byId('nk-offer-select').value)];
      if (!row) throw new Error('Bitte einen Tarif oder Pass auswählen.');
      if (!window.crypto?.randomUUID) throw new Error('Sicherer Browser für Testcheckout erforderlich.');
      const selectionKey = activeUser + ':' + row.kind + ':' + row.item.slug;
      // Reuse the same request key after a network timeout instead of creating
      // a second Stripe Checkout Session for the same attempted purchase.
      if (pendingCheckout?.selection !== selectionKey) {
        pendingCheckout = {selection: selectionKey, key: 'nk-web-' + window.crypto.randomUUID()};
      }
      const idempotencyKey = pendingCheckout.key;
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
    session = null;activeUser = null;studioChoice = null;
    webCheckoutEnabled = false;shopCheckoutReady = false;shopCart=[];orderSnapshot=null;store();
    for (const id of ['nk-member-contracts','nk-web-order-history','nk-web-shop-cart',
      'nk-order-count','nk-member-id','nk-member-name','nk-own-devices']) {
      const node=byId(id);
      if (node) node.replaceChildren();
    }
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
    byId('nk-signup-form').addEventListener('submit',event=>{void signup(event);});
    byId('nk-show-signup').addEventListener('click',()=>{
      showSignupPanel(true);
      void loadSignupStudios();
    });
    byId('nk-show-login').addEventListener('click',()=>showSignupPanel(false));
    byId('nk-signup-studio-retry').addEventListener('click',()=>{void loadSignupStudios();});
    byId('nk-reset-form').addEventListener('submit',event=>{void reset(event);});
    byId('nk-confirmation-form').addEventListener('submit',event=>{void resendSignupConfirmation(event);});
    byId('nk-studio-save').addEventListener('click',()=>{void saveStudio();});
    byId('nk-checkout-button').addEventListener('click',()=>{void startTestCheckout();});
    byId('nk-billing-portal').addEventListener('click',()=>{void openTestBillingPortal();});
    byId('nk-web-shop-checkout').addEventListener('click',()=>{void startShopTestCheckout();});
    byId('nk-orders-reload').addEventListener('click',()=>{
      void run(async()=>{await loadAccount();feedback('Konto- und Vertragsdaten serverseitig aktualisiert.');});
    });
    byId('nk-order-filter').addEventListener('change',renderOrders);
    byId('nk-own-devices-reload').addEventListener('click',()=>{
      void run(async()=>{
        if(!session||!activeUser)throw new Error('Bitte anmelden.');
        await loadOwnDevices(activeUser);
      });
    });
    byId('nk-password-change-form').addEventListener('submit',event=>{void changeOwnPassword(event);});
    byId('nk-logout').addEventListener('click',()=>{void logout();});
    byId('nk-reload').addEventListener('click',()=>{
      void run(async()=>{await loadAccount();feedback('Konto- und Vertragsdaten serverseitig aktualisiert.');});
    });
    byId('nk-checkout-button').disabled=true;
    byId('nk-billing-portal').disabled=true;
    byId('nk-web-shop-checkout').disabled=true;
    byId('nk-signup-submit').disabled=true;
    try {
      const cached = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
      if (validSession(cached)) session = cached;
    } catch { /* No persisted login. */ }
    const checkoutStatus = new URLSearchParams(window.location.search).get('status');
    if (checkoutStatus === 'success' || checkoutStatus === 'cancelled') {
      pendingCheckout = null;
      pendingShopCheckout = null;
    }
    if (session) {
      await run(loadAccount);
    } else showAccount(false);
  }
  window.NordkernAccount = {validSession,safeCheckoutUrl,safeBillingPortalUrl,
    paidMembership,contractStatusLabel,detailsForContract,orderStatusName,
    memberSectionFromHash,validateSignupInput,mount};
  document.addEventListener('DOMContentLoaded',()=>{void mount();});
})();
