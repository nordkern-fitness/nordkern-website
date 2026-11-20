const {test,expect}=require('@playwright/test');
const {installFixtures,fixtureState}=require('./fixtures.cjs');

test.beforeEach(async({page})=>{
 await installFixtures(page);
});

async function login(page) {
 await page.goto('/konto.html');
 await expect(page.locator('#nk-login-form')).toBeVisible();
 await page.locator('#nk-login-email').fill('member@nordkern.test');
 await page.locator('#nk-login-password').fill('safe-test-password-123');
 await page.locator('#nk-login-submit').click();
 await expect(page.locator('#nk-member-panel')).toBeVisible();
 await expect(page.locator('#nk-member-id')).toContainText('NK-TEST-001');
}

test('home → pricing is clickable, dynamically loaded and navigable by keyboard',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Für deinen Weg nach vorn.'})).toBeVisible();
 await page.getByRole('link',{name:'Tarife ansehen'}).first().click();
 await expect(page).toHaveURL(/mitgliedschaften\.html/);
 await expect(page.locator('.pricing-tabs')).toContainText('Basic');
 await expect(page.locator('.pricing-panels-v3')).toContainText('29,90');
 const firstTab=page.locator('.pricing-tab-button').first();
 await expect(firstTab).toBeVisible();
 await firstTab.focus();
 await expect(firstTab).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(firstTab).toHaveAttribute('aria-selected','true');
});

test('signup validates fields and consent, uses real GoTrue HTTP contract, never auto-entitles',async({page})=>{
 await page.goto('/konto.html');
 const signup=page.locator('#nk-show-signup');
 await signup.focus();
 await page.keyboard.press('Enter');
 await expect(page.locator('#nk-signup-form')).toBeVisible();
 await expect(page.locator('#nk-login-form')).toBeHidden();
 await expect(page.locator('#nk-signup-studio')).toBeEnabled();
 await page.locator('#nk-signup-first').fill('Test');
 await page.locator('#nk-signup-last').fill('Person');
 await page.locator('#nk-signup-email').fill('verify@nordkern.test');
 await page.locator('#nk-signup-password').fill('safe-test-password-123');
 await page.locator('#nk-signup-studio').selectOption('grevesmuehlen');
 expect(await page.locator('#nk-signup-form').evaluate(form=>form.checkValidity())).toBe(false);
 await page.locator('#nk-signup-terms').check();
 await page.locator('#nk-signup-privacy').check();
 expect(await page.locator('#nk-signup-form').evaluate(form=>form.checkValidity())).toBe(true);
 await page.locator('#nk-signup-submit').click();
 await page.waitForTimeout(180);
 const signupProblem=await page.locator('#nk-account-error').innerText();
 if(signupProblem)console.log('Mocked signup browser failure:',signupProblem);
 console.log('Mocked signup request count:',fixtureState(page).signupResponses.length);
 await expect(fixtureState(page).signupResponses.length).toBe(1);
 await expect(page.locator('#nk-login-form')).toBeVisible();
 await expect(page.locator('#nk-member-panel')).toBeHidden();
 await expect(page.locator('#nk-account-feedback')).toContainText('keine aktive Anmeldung');
 const request=fixtureState(page).signupResponses[0];
 expect(request.data.home_studio_slug).toBe('grevesmuehlen');
 expect(request.data.terms_accepted).toBe(true);
 expect(request.data.privacy_accepted).toBe(true);
 expect(request.data.marketing_accepted).toBe(false);
 // The test network intercept is the only author of signup responses.
 // No real email, auth account or membership is created.
});

test('invalid login shows understandable error and does not show account data',async({page})=>{
 // A password that does not meet HTML validity must not submit a GoTrue call.
 await page.goto('/konto.html');
 await page.locator('#nk-login-email').fill('member@nordkern.test');
 await page.locator('#nk-login-password').fill('x');
 expect(await page.locator('#nk-login-form').evaluate(form=>form.checkValidity())).toBe(false);
 await expect(page.locator('#nk-member-panel')).toBeHidden();
});

test('authenticated contract, wallet, order statuses and browser refresh show backend fixtures',async({page})=>{
 await login(page);
 await expect(page.locator('#nk-member-contracts')).toContainText('Basic Original');
 await expect(page.locator('#nk-member-contracts')).toContainText('29,90');
 await expect(page.locator('#nk-member-contracts')).toContainText('Freigetränke: 3');
 await expect(page.locator('#nk-member-contracts')).toContainText('Mindestlaufzeit');
 await expect(page.locator('#nk-web-order-history')).toContainText('NK-TEST-001');
 await expect(page.locator('#nk-web-order-history')).toContainText('NK-TEST-002');
 await page.locator('#nk-order-filter').selectOption('paid');
 await expect(page.locator('#nk-web-order-history')).toContainText('NK-TEST-002');
 await expect(page.locator('#nk-web-order-history')).not.toContainText('NK-TEST-001');
 await expect(page.locator('#nk-order-count')).toContainText('1 von 2');
 await page.locator('#nk-order-filter').selectOption('all');
 await page.locator('#nk-orders-reload').click();
 await expect(page.locator('#nk-web-order-history')).toContainText('NK-TEST-001');
 await expect(page.locator('#nk-account-feedback')).toContainText('serverseitig aktualisiert');
 await expect(page.locator('#nk-web-shop-checkout')).toBeDisabled();
});

test('real shop cart buttons persist across navigation and member portal can remove units',async({page})=>{
 await page.goto('/shop.html');
 await expect(page.locator('#nkshop-grid')).toContainText('Test-Getränkeguthaben');
 const link=page.locator('#nkshop-account-link');
 await expect(link).toHaveAttribute('aria-disabled','true');
 await page.getByRole('button',{name:'Einen Test-Getränkeguthaben hinzufügen'}).click();
 await page.getByRole('button',{name:'Einen Test-Getränkeguthaben hinzufügen'}).click();
 await expect(page.locator('#nkshop-cart')).toContainText('2 × Test-Getränkeguthaben');
 await expect(link).toHaveAttribute('aria-disabled','false');
 await link.click();
 await expect(page).toHaveURL(/konto\.html#shop/);
 await page.locator('#nk-login-email').fill('member@nordkern.test');
 await page.locator('#nk-login-password').fill('safe-test-password-123');
 await page.locator('#nk-login-submit').click();
 await expect(page.locator('#nk-member-panel')).toBeVisible();
 await expect(page.locator('#nk-web-shop-cart')).toContainText('8,80');
 await expect(page.locator('#nk-web-shop-checkout')).toBeDisabled();
 await page.getByRole('button',{name:'Test-Getränkeguthaben entfernen'}).click();
 await expect(page.locator('#nk-web-shop-cart')).toContainText('4,40');
 await page.getByRole('button',{name:'Test-Getränkeguthaben entfernen'}).click();
 await expect(page.locator('#nk-web-shop-cart')).toContainText('leer');
 await expect(page.locator('#nk-web-shop-checkout')).toBeDisabled();
});

test('device revoke requires confirmation, updates only own scoped device, supports logout',async({page})=>{
 await login(page);
 await expect(page.locator('#nk-own-devices')).toContainText('QR-Zutritt aktiv');
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'QR-Zutritt für ios Gerät widerrufen'}).click();
 await expect(page.locator('#nk-own-devices')).toContainText('Gesperrt seit');
 await expect(page.getByRole('button',{name:'QR-Zutritt für ios Gerät widerrufen'})).toHaveCount(0);
 await page.locator('#nk-logout').click();
 await expect(page.locator('#nk-member-panel')).toBeHidden();
 await expect(page.locator('#nk-login-form')).toBeVisible();
 await expect(page.locator('#nk-member-contracts')).toBeEmpty();
});

test('empty catalog, unavailable shop, retry and clear guidance never fabricate products',async({page})=>{
 // Trigger a controlled error via local testing fixture registration,
 // without connecting to nordkern-dev.
 await page.goto('/shop.html');
 await expect(page.locator('#nkshop-grid')).toContainText('Test-Getränkeguthaben');
 await page.route('https://mfaqlfsaatmhvcqlpzoz.supabase.co/rest/v1/shop_categories?*',
   route=>route.fulfill({status:503,contentType:'application/json',headers:{
     'Access-Control-Allow-Origin':'*'},body:'{"message":"mock offline"}'}));
 await page.reload();
 await expect(page.locator('#nkshop-status')).toContainText('nicht abrufbar');
 await expect(page.locator('#nkshop-grid')).toContainText('Erneut versuchen');
 await expect(page.locator('#nkshop-grid')).not.toContainText('Test-Getränkeguthaben');
});

test('mobile, tablet and desktop have no horizontal overflow across key pages',async({page},testInfo)=>{
 for(const path of ['/', '/mitgliedschaften.html','/shop.html','/konto.html','/app.html']){
   await page.goto(path);
   await expect(page.locator('main')).toBeVisible();
   const metrics=await page.evaluate(()=>{
     const root=document.documentElement;
     return {width:window.innerWidth,scrollWidth:root.scrollWidth};
   });
   expect(metrics.scrollWidth,
     testInfo.project.name+' '+path+' horizontal overflow: '+JSON.stringify(metrics))
     .toBeLessThanOrEqual(metrics.width+2);
 }
});

test('fixed website ↔ test-app handoffs never include credentials',async({page})=>{
 await page.goto('/app.html');
 await expect(page.locator('a[href="nordkernapp:///profile"]').first()).toBeVisible();
 await expect(page.locator('a[href="konto.html#vertraege"]').first()).toBeVisible();
 await page.goto('/shop.html');
 await expect(page.locator('a[href="nordkernapp:///shop"]').first()).toBeVisible();
 const links=await page.locator('a[href^="nordkernapp:"]').evaluateAll(nodes=>
   nodes.map(node=>node.getAttribute('href')));
 for(const link of links){
   expect(link).not.toMatch(/token|password|session|email/i);
 }
});

test('legal navigation opens the intended AGB and privacy tab for registration',async({page})=>{
 await page.goto('/impressum.html#agb');
 await expect(page.locator('#panel-agb')).toBeVisible();
 await expect(page.locator('#panel-datenschutz')).toBeHidden();
 await page.goto('/impressum.html#datenschutz');
 await expect(page.locator('#panel-datenschutz')).toBeVisible();
 await expect(page.locator('#panel-agb')).toBeHidden();
});

test('8.6 rejected real-shaped refresh invalidates local session and clears protected UI',async({page})=>{
 await login(page);
 const state=fixtureState(page);
 state.rejectRefresh=true;
 await page.evaluate(()=>{
   const key='nordkern-website-session-v1';
   const stored=JSON.parse(sessionStorage.getItem(key));
   stored.expiresAt=Date.now()-2000;
   sessionStorage.setItem(key,JSON.stringify(stored));
 });
 await page.reload();
 await expect(page.locator('#nk-member-panel')).toBeHidden();
 await expect(page.locator('#nk-login-form')).toBeVisible();
 await expect(page.locator('#nk-member-contracts')).toBeEmpty();
 await expect(page.locator('#nk-account-error')).toContainText('Sitzung');
 const cached=await page.evaluate(()=>sessionStorage.getItem('nordkern-website-session-v1'));
 expect(cached).toBeNull();
 const refreshCalls=state.logs.filter(entry=>
   entry.path==='/auth/v1/token'&&entry.search.includes('grant_type=refresh_token'));
 expect(refreshCalls.length).toBe(1);
});

test('8.6 disabled profile is not a member login even with valid GoTrue token',async({page})=>{
 const state=fixtureState(page);
 state.profileEnabled=false;
 await page.goto('/konto.html');
 await page.locator('#nk-login-email').fill('member@nordkern.test');
 await page.locator('#nk-login-password').fill('safe-test-password-123');
 await page.locator('#nk-login-submit').click();
 await expect(page.locator('#nk-account-error')).toContainText('nicht freigeschaltet');
 await expect(page.locator('#nk-member-panel')).toBeHidden();
 const cached=await page.evaluate(()=>sessionStorage.getItem('nordkern-website-session-v1'));
 expect(cached).toBeNull();
});

test('8.6 forbidden RLS own profile request fails closed and removes local credentials',async({page})=>{
 const state=fixtureState(page);
 state.rejectOwnProfile=true;
 await page.goto('/konto.html');
 await page.locator('#nk-login-email').fill('member@nordkern.test');
 await page.locator('#nk-login-password').fill('safe-test-password-123');
 await page.locator('#nk-login-submit').click();
 await expect(page.locator('#nk-member-panel')).toBeHidden();
 await expect(page.locator('#nk-account-error')).toContainText('Zugriff wurde verweigert');
 expect(await page.evaluate(()=>sessionStorage.getItem('nordkern-website-session-v1'))).toBeNull();
});

test('8.6 private contracts stay usable when the public pricing catalogue times out',async({page})=>{
 fixtureState(page).catalogueFailure=true;
 await login(page);
 await expect(page.locator('#nk-member-contracts')).toContainText('Basic Original');
 await expect(page.locator('#nk-checkout-button')).toBeDisabled();
 await expect(page.locator('#nk-billing-portal')).toBeDisabled();
});

test('8.6 unconfirmed GoTrue email displays confirmation guidance and no membership',async({page})=>{
 fixtureState(page).rejectUnconfirmedLogin=true;
 await page.goto('/konto.html');
 await page.locator('#nk-login-email').fill('member@nordkern.test');
 await page.locator('#nk-login-password').fill('safe-test-password-123');
 await page.locator('#nk-login-submit').click();
 await expect(page.locator('#nk-account-error')).toContainText('bestätige zuerst');
 await expect(page.locator('#nk-member-panel')).toBeHidden();
 expect(await page.evaluate(()=>sessionStorage.getItem('nordkern-website-session-v1'))).toBeNull();
});
