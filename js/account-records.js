/* Account data is authoritative only after complete, account-bound validation. */
(function(root){
  'use strict';
  const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  const statuses=new Set(['pending_activation','active','paused','cancelled','expired']);
  const pageSize=50, maxPages=20;
  const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
  const timestamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&/^\d{4}-\d{2}-\d{2}T/.test(v);
  const nullableDate=v=>v===null||timestamp(v);
  const money=v=>v===null||(Number.isSafeInteger(v)&&v>=0);
  const validMembership=r=>statuses.has(r.status)&&timestamp(r.starts_at)&&nullableDate(r.current_period_end)&&nullableDate(r.cancellation_effective_at)&&nullableDate(r.minimum_term_ends_at)&&money(r.contract_price_cents)&&r.currency==='eur'&&object(r.pricing_snapshot);
  const validPass=r=>statuses.has(r.status)&&typeof r.title==='string'&&r.title.trim().length>0&&r.title.length<=180&&nullableDate(r.starts_at)&&nullableDate(r.expires_at);
  const fail=()=>{throw new Error('Mitgliedsdaten konnten nicht vollständig und sicher bestätigt werden. Bitte aktualisieren.');};
  const owned=(r,user)=>object(r)&&r.user_id===user;
  const tables=Object.freeze({
    memberships:{select:'id,user_id,status,starts_at,current_period_end,cancellation_effective_at,minimum_term_ends_at,contract_price_cents,currency,pricing_snapshot',valid:validMembership},
    passes:{select:'id,user_id,title,status,starts_at,expires_at',valid:validPass}
  });
  async function loadOwnedRecords(read,kind,user){
    if(typeof user!=='string'||!UUID.test(user)||!Object.hasOwn(tables,kind))return fail();
    const table=tables[kind],all=[];
    let cursor=null;
    for(let page=0;page<maxPages;page++){
      const path='/rest/v1/'+kind+'?select='+table.select+'&user_id=eq.'+user+'&order=id.asc&limit='+(pageSize+1)+(cursor?'&id=gt.'+cursor:'');
      const rows=await read(path);
      if(!Array.isArray(rows)||rows.length>pageSize+1)return fail();
      let previous=cursor;
      for(const row of rows){
        if(!owned(row,user)||typeof row.id!=='string'||!UUID.test(row.id)||(previous!==null&&row.id<=previous)||!table.valid(row))return fail();
        previous=row.id;
      }
      all.push(...rows.slice(0,pageSize));
      if(rows.length<=pageSize){
        return all.sort((a,b)=>(Date.parse(b.starts_at||'')||0)-(Date.parse(a.starts_at||'')||0)||(a.id<b.id?1:a.id>b.id?-1:0));
      }
      cursor=all.at(-1).id;
    }
    return fail(); // No silently truncated lifetime history.
  }
  function validateAccountRecords(user,selections,wallets){
    if(typeof user!=='string'||!UUID.test(user)||!Array.isArray(selections)||selections.length>1||!Array.isArray(wallets)||wallets.length>1)return fail();
    if(selections.some(r=>!owned(r,user)||typeof r.studio_id!=='string'||!UUID.test(r.studio_id)||!timestamp(r.change_allowed_at)))return fail();
    if(wallets.some(r=>!owned(r,user)||!['drinks','additional_drinks','creatine','protein'].every(k=>Number.isSafeInteger(r[k])&&r[k]>=0)))return fail();
    return {selection:selections[0]??null,wallet:wallets[0]??null};
  }
  const api=Object.freeze({loadOwnedRecords,validateAccountRecords});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.NordkernAccountRecords=api;
})(typeof window==='object'?window:globalThis);
