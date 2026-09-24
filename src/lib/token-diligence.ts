export type Control = { label: string; value: string; meaning: string; address?: string };
export type MintInspection = {
  mint: string; status: "ok" | "unavailable"; error?: string; program?: string;
  baseUnits?: string; decimals?: number; controls: Control[]; extensions: string[];
};
const TOKEN = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const object = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const address = (v: unknown): string | undefined => typeof v === "string" && v.length > 0 && v !== "11111111111111111111111111111111" ? v : undefined;

export function inspectMint(mint: string, raw: unknown): MintInspection {
  const a = object(raw), parsed = object(object(a.data).parsed), info = object(parsed.info);
  const unavailable = (error: string): MintInspection => ({ mint, status: "unavailable", error, controls: [], extensions: [] });
  if (!raw) return unavailable("No account returned for this address.");
  if (![TOKEN, TOKEN_2022].includes(String(a.owner)) || parsed.type !== "mint" || info.isInitialized !== true) return unavailable("This account is not a supported initialized token mint.");
  if (typeof info.supply !== "string" || !/^\d+$/.test(info.supply) || !Number.isInteger(info.decimals) || Number(info.decimals) < 0 || Number(info.decimals) > 255) return unavailable("The RPC response did not include valid mint supply fields.");
  const extensions = Array.isArray(info.extensions) ? info.extensions.map(object) : [];
  const state = (key: string) => object(extensions.find(e=>e.extension === key)?.state);
  const present = (key: string) => extensions.some(e=>e.extension === key);
  const controls: Control[] = [];
  for (const [key,label,meaning] of [
    ["mintAuthority","Supply issuance","An authority can issue additional tokens. For asset-backed securities, assess the issuer's creation and backing process."],
    ["freezeAuthority","Account freezing","An authority can freeze individual token accounts. This does not establish whether your account is frozen."],
  ]) {
    const authority = address(info[key]);
    controls.push({label,value:authority ? "Authority enabled" : info[key] === null ? "Authority revoked" : "Unknown",meaning,address:authority});
  }
  const delegate = address(state("permanentDelegate").delegate);
  controls.push({label:"Permanent delegate",value:delegate ? "Delegate enabled" : present("permanentDelegate") ? "No delegate set" : "Extension absent",address:delegate,meaning:"A configured permanent delegate can transfer or burn tokens from accounts for this mint, subject to program rules."});
  const pause = state("pausableConfig");
  controls.push({label:"Global pause",value:present("pausableConfig") ? pause.paused === true ? "Currently paused" : pause.paused === false ? "Not paused" : "State unknown" : "Extension absent",address:address(pause.authority),meaning:"The pausable extension can suspend minting, burning and transfers. Other restrictions may still apply when this is not paused."});
  const hook = state("transferHook"), hookProgram = address(hook.programId);
  controls.push({label:"Transfer hook",value:hookProgram ? "Program configured" : present("transferHook") ? "No program configured" : "Extension absent",address:hookProgram,meaning:hookProgram ? "Transfers invoke the linked program. Its rules and upgrade authority are not evaluated by this inspector." : address(hook.authority) ? "An update authority remains and can configure a hook later. Extension presence alone does not mean a hook runs today." : "No configured hook program was returned in this snapshot."});
  const defaultState = state("defaultAccountState");
  controls.push({label:"New account state",value:present("defaultAccountState") ? String(defaultState.accountState ?? "Unknown") : "Standard initialized state",meaning:"Default state for newly created token accounts, not the state of existing accounts."});
  const scale = state("scaledUiAmountConfig");
  controls.push({label:"Display scaling",value:present("scaledUiAmountConfig") ? "Scaled UI amount enabled" : present("interestBearingConfig") ? "Interest-bearing amount enabled" : "No scaling extension returned",meaning:"Supply below is the raw integer divided by token decimals. It is not adjusted for display multipliers, and is not circulating value or underlying shares."});
  if (present("scaledUiAmountConfig") && address(scale.authority)) controls[controls.length-1].address = address(scale.authority);
  if (present("transferFeeConfig")) controls.push({label:"Transfer fee",value:"Fee extension present",meaning:"Transfers may incur token-program fees; fee schedules are not quoted here."});
  if (present("nonTransferable")) controls.push({label:"Transferability",value:"Non-transferable extension",meaning:"The token program restricts transfers for this mint."});
  const d=Number(info.decimals), s=info.supply.padStart(d+1,"0");
  return {mint,status:"ok",program:a.owner === TOKEN_2022 ? "Token-2022" : "SPL Token",decimals:d,baseUnits:d ? `${s.slice(0,-d)}.${s.slice(-d)}` : s,controls,extensions:extensions.map(e=>String(e.extension))};
}
