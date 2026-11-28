const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const context=vm.createContext({window:{},document:{addEventListener(){}}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/account.js'),'utf8'),context);
const {checkoutErrorMessage}=context.window.NordkernAccount;
test('reservation messages distinguish pending, review, expired and existing contracts',()=>{
 for(const [code,match] of [['checkout_in_progress',/läuft bereits/],['checkout_payment_review_required',/Zahlung wird geprüft/],['checkout_expired_retry',/unbezahlte Buchung/],['checkout_state_conflict',/Buchungsstatus/],['checkout_reservation_pending',/noch nicht bestätigt/],['active_membership_exists',/Vertrag/]])assert.match(checkoutErrorMessage(code),match);
});
test('unknown and prototype keys do not expose backend internals',()=>{
 for(const code of [null,'toString','__proto__','private backend detail'])assert.equal(checkoutErrorMessage(code),null);
});
