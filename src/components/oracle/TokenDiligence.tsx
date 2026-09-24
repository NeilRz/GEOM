"use client";
import { useEffect, useRef, useState } from "react";
import registry from "@/data/registry.json";
import type { MintInspection } from "@/lib/token-diligence";
type Product = typeof registry.assets[number];
type Report = { checkedAt:string; slot:number; cacheSeconds:number; cluster:string; records:Array<MintInspection & {product:Product|null}>; limitations:string[] };
const presets=[{label:"Compare gold funds",values:["GLDx","GLDon"]},{label:"Oil fund vs oil company",values:["USOon","XOMx"]},{label:"Mining and rare earths",values:["MPx","MPon"]}];
// The live check reads Solana account state, so only Solana records resolve here.
const solanaAssets=registry.assets.filter(a=>typeof a.solanaMint==="string");
const resolve=(input:string)=>solanaAssets.find(a=>a.symbol.toLowerCase()===input.trim().toLowerCase())?.solanaMint ?? input.trim();
export default function TokenDiligence() {
  const [inputs,setInputs]=useState(["GLDx","GLDon"]);
  const [report,setReport]=useState<Report|null>(null);
  const [changes,setChanges]=useState<string[]>([]);
  const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  const controller=useRef<AbortController|null>(null);
  const previous=useRef(new Map<string,MintInspection>());
  useEffect(()=>()=>controller.current?.abort(),[]);
  function changeInputs(next:string[]) { controller.current?.abort(); setInputs(next);setReport(null);setChanges([]);setError("");setBusy(false); }
  async function inspect() {
    controller.current?.abort(); const abort=new AbortController(); controller.current=abort;
    setBusy(true);setError("");setReport(null);setChanges([]);
    try {
      const mints=inputs.filter(x=>x.trim()).map(resolve);
      const query=new URLSearchParams();mints.forEach(m=>query.append("mint",m));
      const response=await fetch(`/api/oracle/inspect?${query}`,{signal:abort.signal});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error ?? "Inspection unavailable");
      if(abort.signal.aborted) return;
      const result=data as Report, differences:string[]=[];
      result.records.forEach(record=>{
        const old=previous.current.get(record.mint);
        if(old?.status==="ok" && record.status==="ok") record.controls.forEach(c=>{
          const before=old.controls.find(p=>p.label===c.label);
          if(before && (before.value!==c.value || before.address!==c.address)) differences.push(`${record.product?.symbol ?? record.mint}: ${c.label} changed since your previous check.`);
        });
        if(record.status==="ok") previous.current.set(record.mint,record);
      });
      setReport(result);setChanges(differences);
    } catch(e) {if(!abort.signal.aborted) setError(e instanceof Error ? e.message : "Inspection unavailable");}
    finally {if(!abort.signal.aborted)setBusy(false);}
  }
  function download() {
    if(!report)return;
    const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download=`geom-token-check-${report.checkedAt.replace(/[:.]/g,"-")}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const controlLabels=[...new Set(report?.records.flatMap(r=>r.controls.map(c=>c.label)) ?? [])];
  const differingUnderlying=report && new Set(report.records.map(r=>r.product?.underlyingTicker).filter(Boolean)).size>1;
  return <section className="token-diligence" aria-label="Token due diligence">
    <header className="td-intro"><p className="eyebrow">Resource token due diligence</p><h1>Know what the token represents.<br/><span>And what its authorities can do.</span></h1><p>Compare issuer-linked resource exposure with current Solana mint controls. Use the evidence to identify questions for the issuer before relying on a token.</p></header>
    <div className="td-presets">{presets.map(p=><button key={p.label} onClick={()=>changeInputs(p.values)}>{p.label}</button>)}</div>
    <form className="td-form" onSubmit={e=>{e.preventDefault();void inspect();}}>
      {inputs.map((v,i)=><label key={i}>{i===0?"Token to inspect":"Compare with (optional)"}<input list="reviewed-tokens" value={v} onChange={e=>changeInputs(inputs.map((x,j)=>i===j?e.target.value:x))} placeholder="Symbol or Solana mint address" required={i===0}/></label>)}
      <datalist id="reviewed-tokens">{solanaAssets.map(a=><option key={a.solanaMint} value={a.symbol}>{a.provider} · {a.underlying}</option>)}</datalist>
      <button className="btn" type="submit" disabled={busy}>{busy?"Reading Solana…":"Run live check"}</button>
    </form>
    <p className="td-method">Reads public mainnet account state. No wallet needed. Results may be cached for 30 seconds; source research is dated separately.</p>
    {error && <p className="td-error" role="alert">{error}</p>}
    {busy && <p role="status">Checking mint accounts and decoding token controls…</p>}
    {!report && !busy && !error && <div className="td-start"><h2>Three questions, one evidence view</h2><div><p><strong>What is the exposure?</strong> Distinguish a metal fund, a futures fund and a resource-company share.</p><p><strong>Who has control?</strong> Inspect issuance, freezing, delegation, pauses and transfer-hook configuration.</p><p><strong>What remains unverified?</strong> Take a dated evidence report back to the issuer for backing, redemption and liquidity checks.</p></div></div>}
    {report && <>
      <div className="td-observed"><span>Observed {new Date(report.checkedAt).toLocaleString()} · mainnet slot {report.slot.toLocaleString()}</span><button onClick={download}>Download evidence JSON ↓</button></div>
      {changes.length>0 && <div className="td-error" role="status">{changes.map(c=><p key={c}>{c}</p>)}</div>}
      {differingUnderlying && <p className="td-caution">These tokens reference different underlying securities. Sharing a commodity theme does not make their returns or rights equivalent.</p>}
      <div className="td-products" style={{gridTemplateColumns:`repeat(${report.records.length},minmax(0,1fr))`}}>
        {report.records.map(r=><article key={r.mint}>
          <p className="eyebrow">{r.product?.provider ?? "Issuer not matched"}</p><h2>{r.product?.symbol ?? "Unrecognized mint"}</h2>
          <p>{r.product?.underlying ?? "No matching entry in GEOM's reviewed issuer registry. On-chain metadata alone does not establish issuer identity."}</p>
          {r.product && <><p className="td-exposure">{r.product.exposure} · {r.product.structure}</p><p>{r.product.relevance}</p><small>Issuer-source review: {r.product.reviewedAt.slice(0,10)} · publication pending</small><div className="td-links"><a href={r.product.sourceUrl} target="_blank" rel="noreferrer">Issuer documentation ↗</a><a href={r.product.addressSourceUrl} target="_blank" rel="noreferrer">Address source ↗</a></div></>}
          <a className="td-address" href={`https://solscan.io/token/${r.mint}`} target="_blank" rel="noreferrer">{r.mint} ↗</a>
          {r.status==="ok"?<p className="td-supply">{r.program} · {r.baseUnits} base token units<br/><small>Before display scaling; not market cap, circulating supply or underlying share count.</small></p>:<p className="td-error">{r.error}</p>}
        </article>)}
      </div>
      {controlLabels.length>0 && <div className="td-table" role="region" aria-label="Token control comparison" tabIndex={0}><table><thead><tr><th>Control</th>{report.records.map(r=><th key={r.mint}>{r.product?.symbol ?? r.mint.slice(0,8)}</th>)}</tr></thead><tbody>{controlLabels.map(label=><tr key={label}><th scope="row">{label}</th>{report.records.map(r=>{const c=r.controls.find(c=>c.label===label);return <td key={r.mint}><strong>{c?.value ?? (r.status==="ok"?"Extension absent":"Unavailable")}</strong>{c && <><p>{c.meaning}</p>{c.address && <a href={`https://solscan.io/account/${c.address}`} target="_blank" rel="noreferrer">{c.address.slice(0,6)}…{c.address.slice(-6)} ↗</a>}</>}</td>;})}</tr>)}</tbody></table></div>}
      <section className="td-limits"><h2>Open diligence items</h2><ul>{report.limitations.map(l=><li key={l}>{l}</li>)}</ul><p>Authority presence alone is not a risk verdict. Regulated instruments may require these powers. Their operation, governance and safeguards require separate review.</p><details><summary>RPC methodology and interpretation</summary><p>getMultipleAccounts with jsonParsed encoding and confirmed commitment. All compared accounts come from one RPC response at the displayed slot. A hook extension with no program is shown as unconfigured. An authority address may itself be controlled by a program or multisig; this view does not identify its beneficial controller.</p><a href="https://solana.com/docs/tokens/extensions" target="_blank" rel="noreferrer">Solana Token Extensions documentation ↗</a></details></section>
    </>}
    <p className="td-method">Informational only · not investment advice</p>
  </section>;
}
