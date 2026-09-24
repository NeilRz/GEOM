"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/* The tokenization engine console: whitepaper v4.0 Section 6 made
   concrete as a working surface. One live element (the attestation
   reference, read from /api/health); everything else is a sample
   instrument on devnet that does not exist yet. Copy must keep saying so.

   Vocabulary is the whitepaper's: Table 4 (Token-2022 extensions),
   Table 5 (compliance module classes), Table 6 (instrument archetypes),
   Section 6.8 (pre-flight simulation), Section 6.9 (what the unlicensed
   protocol layer does not do). No em-dashes in copy. */

/* ── sample instrument ─────────────────────────────────────────────── */

const INSTRUMENT = {
  symbol: "SMPL-ROY",
  name: "Sample Royalty Stream 01",
  archetype: "Royalty / NPI stream",
  represents: "A right to a share of revenue, without cost exposure",
  issuer: "Sample Operator SPV Ltd (illustrative)",
  basis: "Issuer's own registration or exemption",
  licence: "Sample licence ref. 2026/00 (illustrative)",
  supply: 1_000_000,
  decimals: 6,
  holderCap: 99,
  cluster: "devnet",
  feeModel: "Flat licence fee to the protocol layer. No percentage of amounts raised.",
};

type Ext = {
  id: string;
  name: string;
  fn: string;
  required: boolean;
  defaultOn: boolean;
};

const EXTENSIONS: Ext[] = [
  { id: "hook", name: "Transfer hook", fn: "Routes every transfer through the compliance program: allowlist, jurisdiction, holding period, holder count.", required: true, defaultOn: true },
  { id: "delegate", name: "Permanent delegate", fn: "Authority able to move or burn from any account. Court-ordered transfers, sanctions, lost-key recovery.", required: true, defaultOn: true },
  { id: "frozen", name: "Default account state: frozen", fn: "New token accounts initialise frozen. No holder receives the instrument before eligibility is established.", required: true, defaultOn: true },
  { id: "meta", name: "Metadata pointer", fn: "On-chain instrument metadata: asset identifier, licence reference, attestation digest.", required: true, defaultOn: true },
  { id: "conf", name: "Confidential transfers", fn: "Zero-knowledge concealment of balances where the issuer requires holder privacy, auditability preserved.", required: false, defaultOn: false },
  { id: "fee", name: "Transfer fee", fn: "Protocol-level fee collection where the instrument's terms require it.", required: false, defaultOn: false },
];

/* ── compliance modules (Table 5) ──────────────────────────────────── */

type ModId = "eligibility" | "jurisdiction" | "class" | "holders" | "lockup" | "sanctions" | "attestation";

const MODULES: Array<{ id: ModId; name: string; q: string; src: string }> = [
  { id: "eligibility", name: "Eligibility", q: "Does the recipient hold a valid, unexpired claim from a trusted issuer?", src: "Offering terms · KYC provider" },
  { id: "jurisdiction", name: "Jurisdiction", q: "Is the recipient's jurisdiction permitted for this instrument?", src: "Securities regime of the offering" },
  { id: "class", name: "Investor class", q: "Is the recipient accredited, professional or qualified as required?", src: "Exemption relied upon" },
  { id: "holders", name: "Holder limits", q: "Would this transfer breach the maximum holder count or a concentration cap?", src: "Registration thresholds" },
  { id: "lockup", name: "Lockup and vesting", q: "Has the applicable holding period elapsed?", src: "Distribution compliance periods" },
  { id: "sanctions", name: "Sanctions", q: "Is either party subject to a sanctions designation?", src: "OFAC · UN · UK · EU lists" },
  { id: "attestation", name: "Attestation", q: "Is the referenced asset attestation current and unrevoked?", src: "GEOM oracle (Section 5)" },
];

/* ── sample wallets ────────────────────────────────────────────────── */

type Wallet = {
  id: string;
  addr: string;
  label: string;
  claim: "valid" | "expired" | "none";
  jurisdiction: string;
  permitted: boolean;
  investorClass: "professional" | "retail";
  sanctioned: boolean;
  balance: number;
  state: "active" | "frozen";
  newHolder: boolean;
};

const WALLETS: Wallet[] = [
  { id: "w1", addr: "7xKq…Ma1P", label: "Verified professional, Cayman", claim: "valid", jurisdiction: "KY", permitted: true, investorClass: "professional", sanctioned: false, balance: 120_000, state: "active", newHolder: false },
  { id: "w2", addr: "Dz4e…Qr8N", label: "Verified professional, UAE", claim: "valid", jurisdiction: "AE", permitted: true, investorClass: "professional", sanctioned: false, balance: 85_000, state: "active", newHolder: false },
  { id: "w3", addr: "3mQv…Ff9C", label: "Claim expired", claim: "expired", jurisdiction: "CH", permitted: true, investorClass: "professional", sanctioned: false, balance: 40_000, state: "frozen", newHolder: false },
  { id: "w4", addr: "9pTr…Xc4L", label: "Retail, restricted jurisdiction", claim: "valid", jurisdiction: "US", permitted: false, investorClass: "retail", sanctioned: false, balance: 0, state: "frozen", newHolder: true },
  { id: "w5", addr: "Bv2h…Ke7E", label: "New holder, cap reached", claim: "valid", jurisdiction: "SG", permitted: true, investorClass: "professional", sanctioned: false, balance: 0, state: "frozen", newHolder: true },
  { id: "w6", addr: "Hs8n…Yd0T", label: "Sanctions list match", claim: "valid", jurisdiction: "GB", permitted: true, investorClass: "professional", sanctioned: true, balance: 0, state: "frozen", newHolder: true },
];

const CURRENT_HOLDERS = 99; // sample: cap already reached, so any new holder trips the module

/* ── sample production statement ───────────────────────────────────── */

const STATEMENT = {
  id: "STMT-2026-08",
  period: "August 2026",
  operator: "Sample Operator SPV Ltd (illustrative)",
  digest: "b3c1…(sample digest, not attested)",
  royaltyDue: 31_000, // USDC, sample
  adminHoldback: 0.01,
  recordDate: "2026-09-01",
};

/* ── live attestation reference ────────────────────────────────────── */

interface Health {
  ok: boolean;
  signer: string;
  manifestHash: string;
  anchor: { matches: boolean; cluster: string; anchoredAt: string; ageDays: number } | null;
}

function useHealth() {
  const [health, setHealth] = useState<Health | null | "error">(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/health")
      .then((r) => r.json())
      .then((j: Health) => alive && setHealth(j))
      .catch(() => alive && setHealth("error"));
    return () => {
      alive = false;
    };
  }, []);
  return health;
}

function short(h: string, n = 10) {
  return h.length > n * 2 + 1 ? `${h.slice(0, n)}…${h.slice(-n)}` : h;
}

const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

/* ── the console ───────────────────────────────────────────────────── */

export default function EngineConsole() {
  const health = useHealth();
  const anchorOk = health !== null && health !== "error" && !!health.anchor?.matches;

  const [ext, setExt] = useState<Record<string, boolean>>(
    Object.fromEntries(EXTENSIONS.map((e) => [e.id, e.defaultOn]))
  );
  const [mods, setMods] = useState<Record<ModId, boolean>>(
    Object.fromEntries(MODULES.map((m) => [m.id, true])) as Record<ModId, boolean>
  );
  const [recipient, setRecipient] = useState<string>("w1");
  const [amount, setAmount] = useState<number>(10_000);
  const [ran, setRan] = useState(false);
  const [distributed, setDistributed] = useState(false);

  const wallet = WALLETS.find((w) => w.id === recipient)!;

  /* pre-flight: each module answers one boolean */
  const checks = useMemo(() => {
    const anchorAge =
      health && health !== "error" && health.anchor ? `${health.anchor.ageDays.toFixed(1)} d` : "unknown";
    const rows: Array<{ id: ModId; result: "pass" | "fail" | "skip"; reason: string }> = MODULES.map((m) => {
      if (!mods[m.id]) return { id: m.id, result: "skip", reason: "not composed for this instrument" };
      switch (m.id) {
        case "eligibility":
          return wallet.claim === "valid"
            ? { id: m.id, result: "pass", reason: "claim valid, trusted issuer" }
            : { id: m.id, result: "fail", reason: wallet.claim === "expired" ? "claim expired" : "no claim on record" };
        case "jurisdiction":
          return wallet.permitted
            ? { id: m.id, result: "pass", reason: `${wallet.jurisdiction} permitted` }
            : { id: m.id, result: "fail", reason: `${wallet.jurisdiction} not permitted for this instrument` };
        case "class":
          return wallet.investorClass === "professional"
            ? { id: m.id, result: "pass", reason: "professional" }
            : { id: m.id, result: "fail", reason: "retail; exemption requires professional" };
        case "holders":
          return wallet.newHolder && CURRENT_HOLDERS >= INSTRUMENT.holderCap
            ? { id: m.id, result: "fail", reason: `would be holder ${CURRENT_HOLDERS + 1} of cap ${INSTRUMENT.holderCap}` }
            : { id: m.id, result: "pass", reason: `${CURRENT_HOLDERS} of ${INSTRUMENT.holderCap} holders` };
        case "lockup":
          return { id: m.id, result: "pass", reason: "no holding period configured" };
        case "sanctions":
          return wallet.sanctioned
            ? { id: m.id, result: "fail", reason: "designation match on consolidated list" }
            : { id: m.id, result: "pass", reason: "no match" };
        case "attestation":
          return anchorOk
            ? { id: m.id, result: "pass", reason: `manifest anchored ${anchorAge} ago, matches` }
            : { id: m.id, result: "fail", reason: health === null ? "reading anchor…" : "anchor stale or unreachable" };
      }
    });
    return rows;
  }, [mods, wallet, anchorOk, health]);

  const firstFail = checks.find((c) => c.result === "fail");
  const amountOk = amount > 0 && amount <= INSTRUMENT.supply;

  /* distribution: pro rata over active balances at the record date */
  const dist = useMemo(() => {
    const holdback = STATEMENT.royaltyDue * STATEMENT.adminHoldback;
    const distributable = STATEMENT.royaltyDue - holdback;
    const perUnit = distributable / INSTRUMENT.supply;
    const rows = WALLETS.filter((w) => w.balance > 0).map((w) => ({
      ...w,
      amount: w.balance * perUnit,
      paid: w.state === "active",
    }));
    const paid = rows.filter((r) => r.paid).reduce((s, r) => s + r.amount, 0);
    const held = rows.filter((r) => !r.paid).reduce((s, r) => s + r.amount, 0);
    const treasury = distributable - paid - held; // units not yet placed
    return { holdback, distributable, perUnit, rows, paid, held, treasury };
  }, []);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="main eng">
      <header className="eng-head">
        <div>
          <p className="eyebrow">Tokenization engine · design preview · devnet</p>
          <h1 className="page-title">
            Issue a royalty stream as a <em>permissioned instrument</em>
          </h1>
          <p className="page-lede">
            The token layer as designed in whitepaper Section 6: a Token-2022 mint, compliance modules composed by
            the issuer, and distributions that pay against attested production statements. Sample instrument, sample
            holders, sample figures.
          </p>
        </div>
        <div className="eng-badges">
          <span className="badge good">attestation · live</span>
          <span className="badge info">mint · devnet next</span>
          <span className="badge warn">compliance &amp; payout · design</span>
        </div>
      </header>

      <div className="eng-notice" role="note">
        <span className="mono">Illustrative</span>
        <span>
          Nothing below the attestation step exists on-chain. No instrument has been issued, no program is deployed,
          no offer is made. GEOM does not issue, custody, trade or settle anything. Informational only, not investment
          advice.
        </span>
      </div>

      <nav className="eng-rail" aria-label="Instrument lifecycle">
        {[
          ["configure", "01", "Configure", "design", "design"],
          ["attest", "02", "Attest", "live", "live"],
          ["mint", "03", "Mint", "devnet next", "next"],
          ["compliance", "04", "Allowlist", "design", "design"],
          ["distribute", "05", "Distribute", "design", "design"],
        ].map(([id, n, t, s, cls]) => (
          <button key={id} type="button" onClick={() => go(id)}>
            <span className="n">{n}</span>
            <span className="t">{t}</span>
            <span className={`s ${cls}`}>{s}</span>
          </button>
        ))}
      </nav>

      {/* ── 01 configure ─────────────────────────────────────────── */}
      <section className="eng-section" id="configure">
        <div className="eng-section-head">
          <h2>
            01 · Configure the <em>instrument</em>
          </h2>
          <span className="ref">Table 4 · Table 6</span>
          <p className="eng-note">
            Most Token-2022 extensions must be enabled at mint creation and cannot be added later, so instrument design
            is an upfront exercise. Four are required for a permissioned resource instrument; two are optional.
          </p>
        </div>
        <div className="eng-grid two">
          <div className="panel">
            <p className="panel-title">Instrument</p>
            <div className="kv-list">
              {[
                ["Symbol", `${INSTRUMENT.symbol} · ${INSTRUMENT.name}`],
                ["Archetype", INSTRUMENT.archetype],
                ["Represents", INSTRUMENT.represents],
                ["Issuer", INSTRUMENT.issuer],
                ["Basis", INSTRUMENT.basis],
                ["Licence ref.", INSTRUMENT.licence],
                ["Supply", `${INSTRUMENT.supply.toLocaleString("en-US")} units · ${INSTRUMENT.decimals} decimals`],
                ["Holder cap", `${INSTRUMENT.holderCap} holders`],
                ["Standard", "Solana Token-2022 (Token Extensions)"],
                ["Cluster", INSTRUMENT.cluster],
                ["Fee model", INSTRUMENT.feeModel],
              ].map(([k, v]) => (
                <div className="row" key={k}>
                  <span className="k">{k}</span>
                  <span className="v">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <p className="panel-title">Token-2022 extensions</p>
            <div className="eng-ext">
              {EXTENSIONS.map((e) => (
                <div className={`eng-ext-row${ext[e.id] ? " on" : ""}`} key={e.id}>
                  <div>
                    <div className="name">{e.name}</div>
                    <div className="fn">{e.fn}</div>
                    <div className="tag">{e.required ? "required · set at mint · immutable" : "optional · set at mint"}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ext[e.id]}
                    aria-label={`${e.name} ${ext[e.id] ? "enabled" : "disabled"}`}
                    className="eng-toggle"
                    disabled={e.required}
                    onClick={() => setExt((s) => ({ ...s, [e.id]: !s[e.id] }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 02 attest ────────────────────────────────────────────── */}
      <section className="eng-section" id="attest">
        <div className="eng-section-head">
          <h2>
            02 · Bind to a <em>current attestation</em>
          </h2>
          <span className="ref">Section 5 · Section 6.7</span>
          <p className="eng-note">
            The instrument&apos;s metadata references the GEOM record, and the attestation module checks at every transfer
            that the reference is current and unrevoked. This panel is live: it reads the same signer and anchor that{" "}
            <Link href="/app?m=oracle">the oracle</Link> publishes.
          </p>
        </div>
        <div className="eng-grid two">
          <div className="panel eng-live">
            <p className="panel-title">
              Attestation reference <span className="badge good">live · mainnet</span>
            </p>
            {health === null && <p className="dimmer">Reading /api/health…</p>}
            {health === "error" && <p className="dimmer">Could not reach /api/health from this origin.</p>}
            {health && health !== "error" && (
              <div className="kv-list">
                <div className="row"><span className="k">Signer</span><span className="v mono">{health.signer}</span></div>
                <div className="row"><span className="k">Manifest</span><span className="v mono">{short(health.manifestHash, 14)}</span></div>
                <div className="row"><span className="k">Cluster</span><span className="v">{health.anchor?.cluster ?? "n/a"}</span></div>
                <div className="row"><span className="k">Anchored</span><span className="v">{health.anchor ? new Date(health.anchor.anchoredAt).toUTCString() : "n/a"}</span></div>
                <div className="row">
                  <span className="k">Status</span>
                  <span className="v">
                    {anchorOk ? <span className="badge good">anchor current</span> : <span className="badge warn">anchor stale</span>}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="panel">
            <p className="panel-title">
              Production statement <span className="badge warn">sample</span>
            </p>
            <div className="kv-list">
              <div className="row"><span className="k">Statement</span><span className="v">{STATEMENT.id} · {STATEMENT.period}</span></div>
              <div className="row"><span className="k">Published by</span><span className="v">{STATEMENT.operator}</span></div>
              <div className="row"><span className="k">Digest</span><span className="v mono">{STATEMENT.digest}</span></div>
              <div className="row"><span className="k">Royalty due</span><span className="v mono">{fmt(STATEMENT.royaltyDue)} USDC (sample figure)</span></div>
              <div className="row"><span className="k">Record date</span><span className="v">{STATEMENT.recordDate}</span></div>
            </div>
            <p className="dimmer" style={{ fontSize: 12, margin: "14px 0 0" }}>
              A real statement would go through the same submit, canonicalise, digest, sign and anchor pipeline as every
              dataset on the oracle. The oracle attests integrity and publication time, never accuracy.
            </p>
          </div>
        </div>
      </section>

      {/* ── 03 mint ──────────────────────────────────────────────── */}
      <section className="eng-section" id="mint">
        <div className="eng-section-head">
          <h2>
            03 · Mint on <em>devnet</em>
          </h2>
          <span className="ref">Section 6.8 · issuance workflow</span>
          <p className="eng-note">
            The issuance workflow takes the configuration above to a deployed, verified mint. This is the next build
            step. The configuration below is what the workflow would submit.
          </p>
        </div>
        <div className="panel">
          <p className="panel-title">Mint configuration</p>
          <pre className="codeblock" dangerouslySetInnerHTML={{ __html: `{
  <span class="k">"program"</span>:        <span class="v">"TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"</span>,   // Token-2022
  <span class="k">"cluster"</span>:        <span class="v">"${INSTRUMENT.cluster}"</span>,
  <span class="k">"symbol"</span>:         <span class="v">"${INSTRUMENT.symbol}"</span>,
  <span class="k">"decimals"</span>:       <span class="v">${INSTRUMENT.decimals}</span>,
  <span class="k">"supply"</span>:         <span class="v">${INSTRUMENT.supply}</span>,
  <span class="k">"extensions"</span>:     [${EXTENSIONS.filter((e) => ext[e.id]).map((e) => `<span class="v">"${e.id}"</span>`).join(", ")}],
  <span class="k">"authorities"</span>: {
    <span class="k">"mint"</span>:           <span class="v">"issuer"</span>,
    <span class="k">"freeze"</span>:         <span class="v">"issuer"</span>,
    <span class="k">"permanentDelegate"</span>: <span class="v">"issuer recovery key"</span>,
    <span class="k">"transferHook"</span>:   <span class="v">"geom_compliance (devnet, not deployed)"</span>
  },
  <span class="k">"metadata"</span>: {
    <span class="k">"name"</span>:           <span class="v">"${INSTRUMENT.name}"</span>,
    <span class="k">"licence_ref"</span>:    <span class="v">"${INSTRUMENT.licence}"</span>,
    <span class="k">"attestation"</span>:    <span class="v">"${health && health !== "error" && /^[0-9a-f]{64}$/.test(health.manifestHash) ? short(health.manifestHash, 12) : "manifest sha256"}"</span>
  }
}` }} />
          <div className="eng-actions">
            <button type="button" className="btn primary" disabled title="Next build step">
              Mint on devnet
            </button>
            <span className="eng-hint">disabled · issuance workflow not built yet</span>
          </div>
        </div>
      </section>

      {/* ── 04 compliance ────────────────────────────────────────── */}
      <section className="eng-section" id="compliance">
        <div className="eng-section-head">
          <h2>
            04 · Compose the <em>compliance modules</em>
          </h2>
          <span className="ref">Table 5 · Figure 10</span>
          <p className="eng-note">
            Each module answers one boolean question at transfer time and is auditable on its own. The issuer composes
            them; GEOM publishes the framework and reference implementations but does not choose which rules apply to
            a third party&apos;s offering. Switch modules off to see the simulation change.
          </p>
        </div>
        <div className="eng-grid wide-left">
          <div className="panel">
            <p className="panel-title">Modules composed by the issuer</p>
            <div className="eng-mods">
              {MODULES.map((m) => (
                <div className="eng-mod" key={m.id}>
                  <div>
                    <div className="name">{m.name}</div>
                    <div className="src">{m.src}</div>
                  </div>
                  <div className="q">{m.q}</div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={mods[m.id]}
                    aria-label={`${m.name} ${mods[m.id] ? "enabled" : "disabled"}`}
                    className="eng-toggle"
                    onClick={() => setMods((s) => ({ ...s, [m.id]: !s[m.id] }))}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <p className="panel-title">Pre-flight simulation</p>
            <div className="eng-form">
              <label>
                From
                <input value={`Issuer treasury · ${INSTRUMENT.symbol}`} readOnly />
              </label>
              <div className="row2">
                <label>
                  To
                  <select value={recipient} onChange={(e) => { setRecipient(e.target.value); setRan(false); }}>
                    {WALLETS.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.addr} · {w.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Units
                  <input
                    type="number"
                    min={1}
                    max={INSTRUMENT.supply}
                    value={amount}
                    onChange={(e) => { setAmount(Number(e.target.value)); setRan(false); }}
                  />
                </label>
              </div>
              <span className="eng-wallet">
                {wallet.addr} · claim {wallet.claim} · {wallet.jurisdiction} · {wallet.investorClass} · account {wallet.state}
              </span>
            </div>
            <div className="eng-actions" style={{ marginTop: 0, marginBottom: 16 }}>
              <button type="button" className="btn primary" onClick={() => setRan(true)} disabled={!amountOk}>
                Simulate transfer
              </button>
              <span className="eng-hint">runs every composed module before anything is submitted</span>
            </div>
            {ran && (
              <>
                <div className="eng-checks" aria-live="polite">
                  {checks.map((c) => {
                    const m = MODULES.find((x) => x.id === c.id)!;
                    return (
                      <div className={`eng-check ${c.result}`} key={c.id}>
                        <span className="dot" aria-hidden="true" />
                        <span className="m">{m.name}</span>
                        <span className="r">{c.reason}</span>
                      </div>
                    );
                  })}
                </div>
                <div className={`eng-verdict ${firstFail ? "fail" : "pass"}`}>
                  {firstFail
                    ? `Transfer reverts · ${MODULES.find((x) => x.id === firstFail.id)!.name}`
                    : `Transfer executes · ${amount.toLocaleString("en-US")} units to ${wallet.addr}`}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── 05 distribute ────────────────────────────────────────── */}
      <section className="eng-section" id="distribute">
        <div className="eng-section-head">
          <h2>
            05 · Distribute against the <em>attested statement</em>
          </h2>
          <span className="ref">Section 6.6 · payment waterfall</span>
          <p className="eng-note">
            The number that triggers a payout is the number in the attested statement, so every holder can verify the
            input. Pro rata over balances at the record date. Frozen accounts are held back until eligibility is
            re-established. Settlement would be performed by the issuer or, once licensed, a GEOM settlement
            subsidiary.
          </p>
        </div>
        <div className="eng-grid two">
          <div className="panel">
            <p className="panel-title">
              Waterfall <span className="badge warn">sample figures</span>
            </p>
            <div className="eng-waterfall">
              <div className="eng-wf">
                <span className="l">Royalty due per statement<small>{STATEMENT.id} · attested input</small></span>
                <span className="a">{fmt(STATEMENT.royaltyDue)} USDC</span>
              </div>
              <div className="eng-wf">
                <span className="l">Administrative holdback<small>{(STATEMENT.adminHoldback * 100).toFixed(0)}% per instrument terms</small></span>
                <span className="a">({fmt(dist.holdback)})</span>
              </div>
              <div className="eng-wf total">
                <span className="l">Distributable<small>pro rata over {INSTRUMENT.supply.toLocaleString("en-US")} units</small></span>
                <span className="a">{fmt(dist.distributable)} USDC</span>
              </div>
              <div className="eng-wf">
                <span className="l">Per unit</span>
                <span className="a">{fmt(dist.perUnit, 6)} USDC</span>
              </div>
              <div className="eng-wf">
                <span className="l">Paid to active accounts</span>
                <span className="a">{fmt(dist.paid)} USDC</span>
              </div>
              <div className="eng-wf">
                <span className="l">Held for frozen accounts</span>
                <span className="a">{fmt(dist.held)} USDC</span>
              </div>
              <div className="eng-wf">
                <span className="l">Unplaced units, retained by issuer</span>
                <span className="a">{fmt(dist.treasury)} USDC</span>
              </div>
            </div>
            <div className="eng-actions">
              <button type="button" className="btn primary" onClick={() => setDistributed(true)}>
                Preview distribution
              </button>
              <span className="eng-hint">devnet USDC · nothing is sent</span>
            </div>
          </div>
          <div className="panel">
            <p className="panel-title">
              Holder register <span className="badge plain">read from chain · not authoritative</span>
            </p>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Wallet</th>
                    <th>Claim</th>
                    <th>Jur.</th>
                    <th className="num">Units</th>
                    <th>Account</th>
                    <th className="num">{distributed ? "Payout" : ""}</th>
                  </tr>
                </thead>
                <tbody>
                  {dist.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="mono">{r.addr}</td>
                      <td>{r.claim}</td>
                      <td>{r.jurisdiction}</td>
                      <td className="num">{r.balance.toLocaleString("en-US")}</td>
                      <td><span className={`state ${r.state}`}>{r.state}</span></td>
                      <td className="num">{distributed ? (r.paid ? fmt(r.amount) : `held ${fmt(r.amount)}`) : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="dimmer" style={{ fontSize: 12, margin: "14px 0 0" }}>
              Until a GEOM subsidiary is licensed to maintain a register, the authoritative register is the issuer&apos;s.
              This view only reads token accounts.
            </p>
          </div>
        </div>
      </section>

      {/* ── boundaries ───────────────────────────────────────────── */}
      <section className="eng-section">
        <div className="eng-section-head">
          <h2>What the engine does <em>not</em> do before it is licensed</h2>
          <span className="ref">Section 6.9</span>
        </div>
        <div className="panel">
          <ul className="eng-nots">
            <li>Custody customer assets</li>
            <li>Match buyers and sellers, or operate any venue on which instruments trade</li>
            <li>Broker, place or solicit the sale of any instrument</li>
            <li>Advise any party on the structure, terms or merits of an offering</li>
            <li>Issue any regulated financial product on behalf of a client</li>
            <li>Maintain the authoritative ownership register for a third party&apos;s instrument</li>
          </ul>
          <p className="dimmer" style={{ fontSize: 12, margin: "16px 0 0" }}>
            Sequencing commitments, not permanent ones. Each falls away for the licensed subsidiary once the
            corresponding authorisation is held. Informational only, not investment advice.
          </p>
        </div>
      </section>
    </main>
  );
}
