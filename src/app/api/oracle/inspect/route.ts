import { NextResponse } from "next/server";
import bs58 from "bs58";
import registry from "@/data/registry.json";
import { inspectMint } from "@/lib/token-diligence";

export const runtime = "nodejs";
const cache = new Map<string, { until: number; value: object }>();
export async function GET(request: Request) {
  const mints = [...new Set(new URL(request.url).searchParams.getAll("mint"))];
  if (!mints.length || mints.length > 3 || mints.some(m=> {
    try { return m.length > 44 || bs58.decode(m).length !== 32; } catch { return true; }
  })) return NextResponse.json({error:"Supply one to three valid Solana mint addresses."},{status:400});
  const key=mints.join(","), saved=cache.get(key);
  if(saved && saved.until>Date.now()) return NextResponse.json(saved.value,{headers:{"Cache-Control":"no-store"}});
  try {
    const response = await fetch("https://api.mainnet-beta.solana.com", {
      method:"POST", headers:{"Content-Type":"application/json"}, cache:"no-store", signal:AbortSignal.timeout(12000),
      body:JSON.stringify({jsonrpc:"2.0",id:1,method:"getMultipleAccounts",params:[mints,{encoding:"jsonParsed",commitment:"confirmed"}]}),
    });
    if(!response.ok) throw new Error("RPC unavailable");
    const json=await response.json();
    if(json.error || !Array.isArray(json.result?.value) || json.result.value.length!==mints.length || !Number.isInteger(json.result.context?.slot)) throw new Error("RPC unavailable");
    const value={checkedAt:new Date().toISOString(),slot:json.result.context.slot,cluster:"mainnet-beta",cacheSeconds:30,
      records:mints.map((mint,i)=>({...inspectMint(mint,json.result.value[i]),product:registry.assets.find(a=>a.solanaMint===mint) ?? null})),
      limitations:["Issuer documents are reviewed research; this live check does not re-verify their claims.","Backing, redemption, liquidity, beneficial ownership and hook-program logic are not checked.","This is an unsigned live RPC observation, separate from GEOM's anchored datasets."]};
    if(cache.size>=100) cache.delete(cache.keys().next().value!);
    cache.set(key,{until:Date.now()+30000,value});
    return NextResponse.json(value,{headers:{"Cache-Control":"no-store"}});
  } catch {
    return NextResponse.json({error:"Solana RPC is unavailable or rate-limited. No current result is available; try again shortly."},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
