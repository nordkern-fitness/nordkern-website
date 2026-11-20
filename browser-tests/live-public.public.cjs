const {test,expect}=require('@playwright/test');

/**
 * 8.6 READ ONLY: actual nordkern-dev REST and GoTrue endpoints.
 * All traffic is real, with public publishable key only.
 * NEVER create/authenticate users, change accounts, charge, or unlock doors.
 * This suite must not be confused with 8.5's intercepted browser fixtures.
 */
const DEV_ORIGIN='https://mfaqlfsaatmhvcqlpzoz.supabase.co';
async function config(page){
  await page.goto('/konto.html');
  return page.evaluate(()=>window.NordkernCatalog?.publicConfig??null);
}

test('real DEV browser fetches active signup studios without login',async({page})=>{
  const cfg=await config(page);
  expect(cfg?.url).toBe(DEV_ORIGIN);
  expect(cfg?.publishableKey).toMatch(/^sb_publishable_/);
  const studioResponse=page.waitForResponse(r=>
    r.url().startsWith(DEV_ORIGIN+'/rest/v1/studios?')&&
    r.request().method()==='GET',{timeout:15000});
  await page.locator('#nk-show-signup').click();
  const result=await studioResponse;
  expect(result.status()).toBe(200);
  const rows=await result.json();
  expect(Array.isArray(rows)).toBe(true);
  expect(rows.length).toBeGreaterThan(0);
  expect(rows.length).toBeLessThanOrEqual(50);
  expect(rows.every(row=>row.active===true &&
    /^[a-z0-9][a-z0-9-]{0,59}$/.test(row.slug))).toBe(true);
  await expect(page.locator('#nk-signup-studio')).toBeEnabled();
  await expect(page.locator('#nk-signup-studio option')).toHaveCount(rows.length+1);
  await expect(page.locator('#nk-member-panel')).toBeHidden();
});

test('actual GoTrue public settings endpoint is reachable, not an email validation test',async({page,request})=>{
  const cfg=await config(page);
  const response=await request.get(DEV_ORIGIN+'/auth/v1/settings',{
    headers:{apikey:cfg.publishableKey},timeout:15000});
  expect(response.status()).toBe(200);
  const result=await response.json();
  expect(result).toBeTruthy();
  expect(typeof result).toBe('object');
  await expect(page.locator('#nk-login-form')).toBeVisible();
  await expect(page.locator('#nk-member-panel')).toBeHidden();
});

test('real DEV anonymous REST cannot return member profile, contract or order rows',async({page,request})=>{
  const cfg=await config(page);
  const tables=[
    ['profiles','id'],['member_studios','studio_id'],
    ['memberships','id'],['passes','id'],
    ['wallet_balances','drinks'],['orders','id'],
    ['order_items','id'],['devices','id'],
  ];
  for(const [table,column] of tables){
    const response=await request.get(DEV_ORIGIN+'/rest/v1/'+table+
      '?select='+column+'&limit=2',{
      headers:{apikey:cfg.publishableKey},timeout:15000});
    if(response.status()===200){
      const data=await response.json();
      expect(Array.isArray(data),table+' is not an array').toBe(true);
      expect(data,table+' leaked anonymous member rows').toEqual([]);
    }else{
      // Missing Data API grants (401/403) also fail closed.
      expect([401,403]).toContain(response.status());
    }
  }
});
