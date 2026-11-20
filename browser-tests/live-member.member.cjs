const {test,expect}=require('@playwright/test');

/**
 * 8.6 GUARDED, REAL DEV user login and RLS.
 * Explicitly provisioned isolated DEV member credentials are mandatory.
 * This suite never signs up, changes passwords, makes payments or triggers QR.
 * No credentials in URLs/screenshots or reporter output.
 */
const DEV='https://mfaqlfsaatmhvcqlpzoz.supabase.co';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function fixture(){
  if(process.env.NORDKERN_E2E_ENABLED!=='I_CONFIRM_DEV_TEST_USERS')return null;
  const email=process.env.NORDKERN_E2E_EMAIL;
  const password=process.env.NORDKERN_E2E_PASSWORD;
  const memberId=process.env.NORDKERN_E2E_ACCOUNT_ID;
  if(!email||!password||!UUID.test(memberId??''))return null;
  return {email,password,memberId,
    foreignMemberId:process.env.NORDKERN_E2E_FOREIGN_ACCOUNT_ID??null};
}
const testAccount=fixture();
test.skip(!testAccount,
  'NO AUTH E2E: dedicated isolated DEV test email/password/id and explicit opt-in are absent.');

async function signIn(page){
  await page.goto('/konto.html');
  await page.locator('#nk-login-email').fill(testAccount.email);
  await page.locator('#nk-login-password').fill(testAccount.password);
  await page.locator('#nk-login-submit').click();
  await expect(page.locator('#nk-member-panel')).toBeVisible();
  await expect(page.locator('#nk-member-id')).toContainText('Mitgliedsnummer:');
  const user=await page.evaluate(()=>{
    const saved=sessionStorage.getItem('nordkern-website-session-v1');
    if(!saved)return null;
    const session=JSON.parse(saved);
    return {userId:session.userId,expiresAt:session.expiresAt};
  });
  expect(user?.userId).toBe(testAccount.memberId);
  expect(user?.expiresAt).toBeGreaterThan(Date.now());
}

test('actual isolated DEV member can log in and read own contract and wallet surface',async({page})=>{
  await signIn(page);
  await expect(page.locator('#nk-member-contracts')).toBeVisible();
  await expect(page.locator('#nk-web-order-history')).toBeVisible();
  await expect(page.locator('#nk-own-devices')).toBeVisible();
  await expect(page.locator('#nk-member-contracts')).not.toContainText('Vertragsdaten werden geladen');
});

test('actual isolated DEV refresh rotates token without reusing a stale access token',async({page})=>{
  await signIn(page);
  await page.evaluate(()=>{
    const key='nordkern-website-session-v1';
    const data=JSON.parse(sessionStorage.getItem(key));
    // Change only CLIENT-SIDE expiry in this disposable test-browser tab.
    // No DEV DB write, session token unchanged; forces real GoTrue refresh.
    data.expiresAt=Date.now()-1000;
    sessionStorage.setItem(key,JSON.stringify(data));
  });
  await page.reload();
  await expect(page.locator('#nk-member-panel')).toBeVisible();
  const renewed=await page.evaluate(()=>{
    return JSON.parse(sessionStorage.getItem('nordkern-website-session-v1'))?.expiresAt??0;
  });
  expect(renewed).toBeGreaterThan(Date.now()+60000);
});

test('DEV login and local logout clear portal and deny unauthenticated revisit',async({page})=>{
  await signIn(page);
  await page.locator('#nk-logout').click();
  await expect(page.locator('#nk-login-panel')).toBeVisible();
  await expect(page.locator('#nk-member-panel')).toBeHidden();
  await expect(page.locator('#nk-member-contracts')).toBeEmpty();
  await page.reload();
  await expect(page.locator('#nk-login-form')).toBeVisible();
  await expect(page.locator('#nk-member-panel')).toBeHidden();
});

test('real DEV RLS denies reading a DIFFERENT explicitly authorized test account',async({page})=>{
  test.skip(!UUID.test(testAccount?.foreignMemberId??'') ||
    testAccount.foreignMemberId===testAccount.memberId,
    'Second isolated DEV member UUID has not been supplied; cross-account RLS check not asserted.');
  await signIn(page);
  const results=await page.evaluate(async({foreign})=>{
    const cfg=window.NordkernCatalog?.publicConfig;
    const saved=JSON.parse(sessionStorage.getItem('nordkern-website-session-v1'));
    const headers={apikey:cfg.publishableKey,Authorization:'Bearer '+saved.accessToken};
    const out={};
    for(const table of ['profiles','memberships','orders','wallet_balances','member_studios']){
      const key=table==='profiles'?'id':'user_id';
      const resp=await fetch(cfg.url+'/rest/v1/'+table+
        '?select='+key+'&'+key+'=eq.'+foreign+'&limit=1',
        {headers,cache:'no-store'});
      out[table]={status:resp.status,rows:resp.status===200?await resp.json():[]};
    }
    return out;
  },{foreign:testAccount.foreignMemberId});
  for(const [table,result] of Object.entries(results)){
    expect([200,401,403],table+' unexpected RLS response').toContain(result.status);
    expect(result.rows,table+' leaked foreign user data').toEqual([]);
  }
});
