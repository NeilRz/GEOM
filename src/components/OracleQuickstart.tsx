"use client";

import { useState } from "react";

/* Pyth-style developer quick-start: one code window, pill tabs, each tab
   showing a real request/response against the live GEOM oracle API. */

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.geom.org";

const TABS: Array<{ id: string; label: string; lang: "json" | "js" | "sh"; code: string }> = [
  {
    id: "shape",
    label: "The dataset",
    lang: "json",
    code: `// GET ${BASE}/api/datasets/reserves
// Every GEOM dataset has the same shape: a meta block, then the records.
{
  "meta": {
    "id": "reserves-v1",
    "title": "Proven crude oil reserves by country",
    "unit": "billion barrels",
    "sources": ["OPEC ASB", "U.S. EIA"],
    "version": "0.1.0"
  },
  "countries": [
    {
      "iso": "VE", "name": "Venezuela",
      "reserves": 303, "lat": 8.5, "lng": -66,
      "status": "constrained",
      "note": "Largest proven reserves; output constrained by sanctions"
    },
    { "iso": "SA", "name": "Saudi Arabia", "reserves": 267, ... },
    // ... 21 more records, same keys, no surprises
  ]
}`,
  },
  {
    id: "fetch",
    label: "Fetch it",
    lang: "js",
    code: `// Any language, no key, no account, it's just HTTPS + JSON.
const res = await fetch("${BASE}/api/datasets/reserves");
const { meta, countries } = await res.json();

console.log(meta.title);      // "Proven crude oil reserves by country"
console.log(meta.unit);       // "billion barrels"
console.log(countries.length) // 23
console.log(countries[0]);    // { iso: "VE", name: "Venezuela", reserves: 303, ... }

// Same pattern for every dataset:
//   /api/datasets/goget        5,391 extraction assets (GEM GOGET, CC BY 4.0)
//   /api/datasets/goit         1,018 oil & NGL pipelines + routes (GEM, CC BY 4.0)
//   /api/datasets/jodi         monthly crude balances, 81 countries (JODI-Oil)
//   /api/datasets/minerals     production & reserves, 84 commodities (USGS MCS)
//   /api/datasets/electricity  generation by fuel, 214 areas (Ember, CC BY 4.0)
//   /api/datasets/noc          61 national oil companies (NRGI open data)
//   /api/datasets/plants       38,378 power plants, all fuels (CC BY GEM)
//   /api/datasets/tokenized    the archived seed registry
//   /api/datasets/registry     reviewed tokens on Solana and Robinhood Chain`,
  },
  {
    id: "attest",
    label: "The attestation",
    lang: "json",
    code: `// GET ${BASE}/api/attest/reserves
// The same dataset, but signed. This is what makes it an oracle.
{
  "domain": "GAEA-ATTEST-V2",
  "scheme": "ed25519",
  "dataset": "reserves",
  "version": "0.1.0",

  // SHA-256 fingerprint of the canonical dataset bytes.
  // Change one digit anywhere and this changes completely:
  "sha256": "72a9bff19c4030931bdab2dbf757cbba0340c92e1e37a75d8b26736e92f44632",

  // What the oracle key actually signs:
  "message": "GAEA-ATTEST-V2|reserves|0.1.0|72a9bff1...",

  // The oracle's public key, same address that anchors on Solana:
  "signer": "DDBT4er8HAHoHvg7xWHfqBY3sdrDhD7uZJW8SctxD9hY",

  // 64-byte Ed25519 signature (base58), unforgeable without the key:
  "signature": "4qQDWb54koVY6ea1rvUQHPrEycpdwHgg45iWnFpe...",
  "signedAt": "2026-07-19T14:21:14.100Z"
}`,
  },
  {
    id: "verify",
    label: "Verify it",
    lang: "js",
    code: `// The check is ~5 lines with any Ed25519 library. Your machine
// does the math, this server is not part of the verdict.
import nacl from "tweetnacl";
import bs58 from "bs58";

const att = await (await fetch("${BASE}/api/attest/reserves")).json();

const ok = nacl.sign.detached.verify(
  new TextEncoder().encode(att.message),  // what was signed
  bs58.decode(att.signature),             // the signature
  bs58.decode(att.signer)                 // the oracle's public key
);

console.log(ok ? "signature valid" : "DO NOT TRUST");

// Full script (recomputes the SHA-256 too) in "Verify it yourself" below.`,
  },
];

/* Tiny regex tokenizer, comments, keys, strings, keywords, numbers.
   Not a real parser; just enough for readable highlighting. */
export function highlight(code: string): React.ReactNode[] {
  const pattern =
    /(\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"(?=\s*:))|("(?:[^"\\\n]|\\.)*")|\b(const|await|fetch|import|from|new|console|GET)\b|\b(\d+(?:\.\d+)?)\b/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = pattern.exec(code)) !== null) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const [full, comment, jsonKey, str, kw, num] = m;
    const cls = comment ? "tk-c" : jsonKey ? "tk-k" : str ? "tk-s" : kw ? "tk-w" : num ? "tk-n" : "";
    out.push(
      <span key={key++} className={cls}>
        {full}
      </span>
    );
    last = m.index + full.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export default function OracleQuickstart() {
  const [tab, setTab] = useState(TABS[0].id);
  const [copied, setCopied] = useState(false);
  const active = TABS.find((t) => t.id === tab)!;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(active.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable, ignore */
    }
  };

  return (
    <section>
      <div className="qs-intro">
        <div>
          <p className="eyebrow">DEVELOPERS</p>
          <h2 className="qs-title">
            One shape. Three endpoints. <em>Zero trust required.</em>
          </h2>
        </div>
        <p className="dim" style={{ fontSize: 14, maxWidth: "44ch", margin: 0 }}>
          Every dataset is the same JSON, a <span className="mono" style={{ fontSize: 12 }}>meta</span>{" "}
          block, then the records. Integrating takes a few lines of any
          language and no credentials.
        </p>
      </div>

      <div className="qs-win">
        <div className="qs-head">
          <span className="left">
            <span className="tick" />
            QUICK START
          </span>
          <span className="qs-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`dl-chip ${tab === t.id ? "on" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </span>
        </div>
        <div className="qs-body">
          <pre className="qs-code">{highlight(active.code)}</pre>
          <button className="dl-chip qs-copy" onClick={copy}>
            {copied ? "COPIED ✓" : "COPY"}
          </button>
        </div>
      </div>
    </section>
  );
}
