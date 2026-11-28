/* Presentation only. Authorization, account scope and contract validation stay in account.js. */
(function(root){
  'use strict';
  const kinds = Object.freeze([['drinks','Freigetränke'],['additional_drinks','Zusätzliche Getränke'],['creatine','Kreatin'],['protein','Protein']]);
  function render(area, contracts, passes, wallet){
    const doc = area.ownerDocument;
    const el = (tag, text, cls) => {
      const node = doc.createElement(tag);
      if (text !== undefined) node.textContent = text;
      if (cls) node.className = cls;
      return node;
    };
    const section = el('div',undefined,'nk-overview');
    const intro = el('div',undefined,'nk-overview-intro');
    intro.append(el('p','MITGLIEDSCHAFT','nk-overview-kicker'),el('h3','Dein Vertrag. Dein Training.'),el('p','Vertragskonditionen und bestätigte Guthaben – auf einen Blick.'));
    section.append(intro);
    if (!contracts.length && !passes.length) section.append(el('p','Noch keine bestätigten Verträge oder Pässe vorhanden.','nk-overview-empty'));
    const contractGrid = el('div',undefined,'nk-overview-contracts');
    for (const contract of contracts) {
      const card = el('article',undefined,'nk-overview-plan');
      const status = el('span',contract.active === true ? 'Bezahlter Zutrittszeitraum' : 'Kein bestätigter aktiver Zutrittszeitraum','nk-overview-state');
      status.dataset.active = String(contract.active === true);
      card.append(el('p','MITGLIEDSCHAFT','nk-overview-kicker'),el('h4',contract.name),status);
      const primary = contract.lines.filter(line => line.startsWith('Bestätigter Vertragspreis: ') || line === 'Vertragspreis nicht bestätigt.' || line.startsWith('Bezahlter Zeitraum bis: '));
      const remaining = contract.lines.filter(line => !primary.includes(line));
      const facts = el('div',undefined,'nk-overview-facts');
      for (const line of primary) {
        const i = line.indexOf(': ');
        const fact = el('div',undefined,'nk-overview-fact');
        if (i >= 0) fact.append(el('span',line.slice(0,i)),el('strong',line.slice(i+2)));
        else fact.append(el('span',line));
        facts.append(fact);
      }
      card.append(facts);
      const details = el('details',undefined,'nk-overview-details');
      details.append(el('summary','Vertragsdetails'));
      for (const line of remaining) details.append(el('p',line));
      card.append(details);contractGrid.append(card);
    }
    for (const pass of passes) {
      const card = el('article',undefined,'nk-overview-pass');
      card.append(el('p','PASS','nk-overview-kicker'),el('h4',pass.title));
      for(const line of pass.lines) card.append(el('p',line));
      contractGrid.append(card);
    }
    section.append(contractGrid);
    const balance = el('section',undefined,'nk-overview-wallet');
    balance.append(el('p','DEINE EINHEITEN','nk-overview-kicker'),el('h3','Guthaben'));
    if (!wallet) balance.append(el('p','Für dieses Konto ist kein Guthabenstand bestätigt.','nk-overview-empty'));
    else {
      const grid = el('div',undefined,'nk-overview-wallet-grid');
      for (const [key,label] of kinds) {
        const value = wallet[key];
        const valid = Number.isSafeInteger(value) && value >= 0;
        const tile = el('div',undefined,'nk-overview-unit');
        tile.append(el('span',label,'nk-overview-unit-label'),el('strong',valid?String(value):'–'),el('span',valid?'Einheiten':'nicht bestätigt','nk-overview-unit-caption'));
        grid.append(tile);
      }
      balance.append(grid);
    }
    balance.append(el('p','Einheiten sind kein Geldbetrag. Zutrittsfreigaben werden separat geprüft.','nk-overview-note'));
    section.append(balance);
    area.replaceChildren(section);
  }
  root.NordkernAccountOverview = Object.freeze({render});
})(typeof window !== 'undefined' ? window : globalThis);
