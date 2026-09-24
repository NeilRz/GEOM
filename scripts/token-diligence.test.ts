import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectMint } from "../src/lib/token-diligence";
const mint=(extensions:unknown[]=[])=>({owner:"TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",data:{parsed:{type:"mint",info:{isInitialized:true,decimals:9,supply:"18446744073709551615",mintAuthority:null,freezeAuthority:"authority",extensions}}}});
test("absent accounts and unparsed data are unknown, not safe",()=>{
  assert.equal(inspectMint("x",null).status,"unavailable");
  assert.equal(inspectMint("x",{owner:"other",data:["AAAA","base64"]}).status,"unavailable");
});
test("null hook program does not become an active hook",()=>{
  const report=inspectMint("x",mint([{extension:"transferHook",state:{programId:null,authority:"updater"}}]));
  const c=report.controls.find(c=>c.label==="Transfer hook")!;
  assert.equal(c.value,"No program configured"); assert.match(c.meaning,/configure a hook later/);
});
test("supply preserves integer precision and does not apply a display multiplier",()=>{
  const r=inspectMint("x",mint([{extension:"scaledUiAmountConfig",state:{multiplier:"100"}}]));
  assert.equal(r.baseUnits,"18446744073.709551615");
  assert.equal(r.controls.find(c=>c.label==="Supply issuance")?.value,"Authority revoked");
  assert.equal(r.controls.find(c=>c.label==="Display scaling")?.value,"Scaled UI amount enabled");
});
test("pause and permanent delegation remain explicit controls",()=>{
  const r=inspectMint("x",mint([{extension:"pausableConfig",state:{paused:true,authority:"pause"}},{extension:"permanentDelegate",state:{delegate:"delegate"}}]));
  assert.equal(r.controls.find(c=>c.label==="Global pause")?.value,"Currently paused");
  assert.equal(r.controls.find(c=>c.label==="Permanent delegate")?.address,"delegate");
});
