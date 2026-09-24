import type { Metadata } from "next";
import Link from "next/link";
import "./tokenize.css";

/* Tokenization engine design preview. Deliberately a standalone route,
   not linked from the public nav or the module lobby: it is a working
   design surface (whitepaper Section 6 made concrete), demoable by URL
   without being shipped to the public site. Everything on it is
   illustrative; no instrument exists. Keep it that way in copy. */

export const metadata: Metadata = {
  title: "Tokenization Engine",
  description:
    "Design preview of the GEOM tokenization engine: attested royalty streams issued as on-chain instruments with GEOM-routed liquidity.",
  robots: { index: false, follow: false },
};

const PIPELINE: Array<{
  name: string;
  status: "live" | "design";
  body: React.ReactNode;
}> = [
  {
    name: "ATTEST",
    status: "live",
    body: (
      <>
        The deal&apos;s dataset (royalty agreement digest, production figures)
        is signed and anchored on Solana by{" "}
        <Link href="/oracle">the oracle</Link>. Integrity and publication
        time, attested at source.
      </>
    ),
  },
  {
    name: "ISSUE",
    status: "design",
    body: (
      <>
        The engine mints a per-deal instrument from one audited program: a
        permissioned Token-2022 mint, transfer-gated by the issuer&apos;s
        compliance modules, with the attested dataset referenced in its
        metadata. A factory, not a launchpad.
      </>
    ),
  },
  {
    name: "POOL",
    status: "design",
    body: (
      <>
        Two single-sided pools open at issuance: a primary pool against GEOM
        and a secondary against USDC. Single-sided means only the instrument
        side is seeded; buyers bring the quote asset.
      </>
    ),
  },
  {
    name: "ROUTE",
    status: "design",
    body: (
      <>
        Launch-guard fees compound the primary GEOM pool. The permanent fee
        converts to USDC through the secondary pool and routes to the issuing
        partner&apos;s treasury. The protocol layer charges flat licensing
        fees, never a cut of flow.
      </>
    ),
  },
  {
    name: "DISTRIBUTE",
    status: "design",
    body: (
      <>
        Royalty cash flow arrives off-chain, its statement is attested, and
        holders claim pro-rata distributions on-chain. The part no venture
        launchpad has: the underlying already pays.
      </>
    ),
  },
];

const ALLOCATION: Array<{
  pct: number;
  color: string;
  label: string;
  why: string;
}> = [
  {
    pct: 70,
    color: "var(--glacial)",
    label: "Partner lock (24 months)",
    why: "The royalty share the partner is not selling, provable on-chain. The lock is the transparency: float and ownership cannot silently diverge.",
  },
  {
    pct: 15,
    color: "var(--c1)",
    label: "Primary pool · INSTRUMENT/GEOM",
    why: "Single-sided seed of the main venue. Every trade in the instrument is structural GEOM volume.",
  },
  {
    pct: 5,
    color: "var(--c3)",
    label: "Secondary pool · INSTRUMENT/USDC",
    why: "The fee-conversion outlet. Without it, converting fees to treasury USDC would mean permanently selling GEOM.",
  },
  {
    pct: 5,
    color: "var(--c2)",
    label: "Bond reserve",
    why: "Held for royalty advances: short-locked supply sold at a discount for USDC when the partner wants working capital.",
  },
  {
    pct: 5,
    color: "var(--c4)",
    label: "Issuer reserve",
    why: "Held by the issuer for unclaimed distributions, rounding, and market operations. The protocol layer takes no allocation in any deal: its compensation is flat licensing fees, which keeps it infrastructure rather than a party to the offering.",
  },
];

const FEE_LADDER: Array<{ range: string; fee: string; use: string }> = [
  {
    range: "Launch → 2× launch valuation",
    fee: "30%",
    use: "Sniper guard. Collected in the instrument and compounded into the primary GEOM pool to thicken it.",
  },
  {
    range: "2× → 3.3×",
    fee: "15%",
    use: "Same routing: compounds the primary pool.",
  },
  {
    range: "3.3× → 5×",
    fee: "5%",
    use: "Same routing: compounds the primary pool.",
  },
  {
    range: "Beyond 5× (permanent)",
    fee: "2%",
    use: "Converted to USDC via the secondary pool and routed to the issuing partner's treasury as the instrument's transfer fee.",
  },
];

export default function TokenizePage() {
  return (
    <main className="tkz">
      {/* ── hero ── */}
      <section>
        <p className="tkz-eyebrow">Tokenization engine · design preview</p>
        <h1>
          From royalty stream to <em>on-chain instrument</em>
        </h1>
        <p className="tkz-lede">
          The engine takes a defined slice of a partner&apos;s royalty or
          offtake stream, attests the deal data through the oracle, and issues
          it as a tradable on-chain claim with liquidity routed through GEOM.
        </p>
        <p className="tkz-sub">
          This page is the working design for whitepaper Section 6, made
          concrete. Every figure and instrument shown is illustrative; nothing
          here is issued, offered, or live.
        </p>
        <div className="tkz-chips">
          <span className="tkz-chip">
            Status <b>Design v0.1</b>
          </span>
          <span className="tkz-chip">
            Chain <b>Solana</b>
          </span>
          <span className="tkz-chip">
            Venue <b>Meteora DLMM</b>
          </span>
          <span className="tkz-chip">
            Working name <b>The Claim Program</b>
          </span>
          <span className="tkz-chip warn">Internal · not an offer</span>
        </div>
      </section>

      {/* ── pipeline ── */}
      <section>
        <p className="tkz-eyebrow">Pipeline</p>
        <h2>Five stages, one already live</h2>
        <p className="tkz-sub">
          The oracle is the stage every RWA platform is missing and the one
          GEOM already runs in production. The engine extends an attestation
          layer into an issuance layer; it does not start from zero.
        </p>
        <div className="tkz-pipe">
          {PIPELINE.map((s, i) => (
            <div className="tkz-step" key={s.name}>
              <div className="tkz-step-head">
                <span className="tkz-step-n">0{i + 1}</span>
                <span className={`tkz-tag ${s.status}`}>
                  {s.status === "live" ? "LIVE" : "IN DESIGN"}
                </span>
              </div>
              <h3>{s.name}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── worked example ── */}
      <section>
        <p className="tkz-eyebrow">Worked example · illustrative</p>
        <h2>Anatomy of a deal</h2>
        <p className="tkz-sub">
          A hypothetical issuance, shown to make the structure legible. No
          such instrument exists and no terms have been agreed with any
          partner.
        </p>
        <div className="tkz-panel">
          <dl className="tkz-kv">
            <dt>Underlying</dt>
            <dd>
              2.5% net smelter return royalty on a producing asset{" "}
              <span className="dim">(illustrative)</span>
            </dd>
            <dt>Tokenized slice</dt>
            <dd>
              25% of the royalty stream <span className="dim">
                (the partner keeps 75%; the locked allocation proves it)
              </span>
            </dd>
            <dt>Instrument</dt>
            <dd>
              GEOM-R1 <span className="dim">(one mint per deal, issued by the engine)</span>
            </dd>
            <dt>Attestation</dt>
            <dd>
              Deal dataset signed by the oracle, digest anchored on Solana;
              production statements attested on each distribution
            </dd>
            <dt>Issuer</dt>
            <dd>
              Member operator or a special purpose vehicle, under its own
              registration or exemption{" "}
              <span className="dim">(never an unlicensed GEOM entity)</span>
            </dd>
            <dt>Distributions</dt>
            <dd>Quarterly, pro-rata to holders, claimable on-chain</dd>
            <dt>Legal wrapper</dt>
            <dd>
              Per-deal structure under counsel review{" "}
              <span className="dim">(gates any live issuance)</span>
            </dd>
          </dl>
        </div>
      </section>

      {/* ── allocation ── */}
      <section>
        <p className="tkz-eyebrow">Supply</p>
        <h2>Allocation of a deal&apos;s instrument</h2>
        <p className="tkz-sub">
          The majority lock is the honesty mechanism: the float the market
          trades matches the slice that was actually sold. Circulating supply
          at launch is the 20% seeded across the two pools.
        </p>
        <div className="tkz-panel">
          <div className="tkz-bar" role="img" aria-label="Instrument supply allocation: 70% partner lock, 15% primary pool, 5% secondary pool, 5% bond reserve, 5% protocol">
            {ALLOCATION.map((a) => (
              <div
                key={a.label}
                style={{ width: `${a.pct}%`, background: a.color }}
              >
                {a.pct}%
              </div>
            ))}
          </div>
          <div className="tkz-legend">
            {ALLOCATION.map((a) => (
              <div className="tkz-legrow" key={a.label}>
                <span className="sw" style={{ background: a.color }} />
                <span className="pct">{a.pct}%</span>
                <span className="lab">{a.label}</span>
                <span className="why">{a.why}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── pools & fees ── */}
      <section>
        <p className="tkz-eyebrow">Liquidity</p>
        <h2>Two single-sided pools, GEOM in the middle</h2>
        <p className="tkz-sub">
          Single-sided seeding means no pre-existing liquidity is required in
          the instrument: the engine deposits only the instrument side and the
          market brings the quote asset, exactly as a bonding-curve launch
          does.
        </p>
        <div className="tkz-2col">
          <div className="tkz-panel tkz-pool">
            <span className="tkz-pool-pair">
              INSTRUMENT <span className="u">/</span>{" "}
              <span className="q">GEOM</span>
            </span>
            <ul>
              <li>Primary venue, 15% of supply, single-sided.</li>
              <li>
                All instrument trading is quoted in GEOM; every new deal adds
                a standing GEOM-paired venue and deepens shared liquidity.
              </li>
              <li>Launch-guard fees are compounded here, thickening the pool over time.</li>
            </ul>
          </div>
          <div className="tkz-panel tkz-pool">
            <span className="tkz-pool-pair">
              INSTRUMENT <span className="u">/</span>{" "}
              <span className="q">USDC</span>
            </span>
            <ul>
              <li>Secondary venue, 5% of supply, single-sided.</li>
              <li>
                Exists so the permanent fee can convert to USDC without
                selling GEOM into its own pool.
              </li>
              <li>Also gives holders a stable-quote exit and a cleaner price reference.</li>
            </ul>
          </div>
        </div>
        <div className="tkz-panel" style={{ marginTop: 16 }}>
          <table className="tkz-table">
            <thead>
              <tr>
                <th>Swap fee</th>
                <th>Valuation band</th>
                <th>Routing</th>
              </tr>
            </thead>
            <tbody>
              {FEE_LADDER.map((f) => (
                <tr key={f.range}>
                  <td>{f.fee}</td>
                  <td>{f.range}</td>
                  <td>{f.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── distributions ── */}
      <section>
        <p className="tkz-eyebrow">Cash flow</p>
        <h2>Distributions, attested end to end</h2>
        <p className="tkz-sub">
          The step that separates a royalty instrument from a venture token:
          the underlying pays today, and the oracle&apos;s existing machinery
          verifies each payment&apos;s paper trail.
        </p>
        <div className="tkz-panel">
          <ol className="tkz-flow">
            <li>
              <span>
                <b>Royalty statement arrives.</b> The partner reports the
                period&apos;s royalty receipts for the tokenized slice.
              </span>
            </li>
            <li>
              <span>
                <b>The oracle attests it.</b> The statement dataset is signed
                and its digest anchored, the same pipeline the live datasets
                already use. The oracle attests integrity and publication
                time, not accuracy.
              </span>
            </li>
            <li>
              <span>
                <b>Funds are escrowed on-chain.</b> The distribution amount is
                deposited to the deal&apos;s distributor account in USDC.
              </span>
            </li>
            <li>
              <span>
                <b>Holders claim pro-rata.</b> Claims settle against a
                snapshot of instrument holders; unclaimed funds roll forward.
              </span>
            </li>
          </ol>
        </div>
      </section>

      {/* ── bonds ── */}
      <section>
        <p className="tkz-eyebrow">Financing</p>
        <h2>Royalty advances</h2>
        <p className="tkz-sub">
          The bond reserve gives partners a second reason to issue beyond
          liquidity: once an instrument trades at a level the partner accepts,
          they can sell short-locked supply at a discount for immediate USDC.
          A streaming-and-royalty advance, the financing structure miners
          already use, executed on-chain.
        </p>
        <div className="tkz-panel">
          <ol className="tkz-flow">
            <li>
              <span>
                <b>Partner opens an advance window.</b> A tranche of the 5%
                bond reserve is offered at a stated discount to the market
                price.
              </span>
            </li>
            <li>
              <span>
                <b>Buyers pay USDC, supply locks one week.</b> The lock keeps
                the discount from being instantly arbitraged into the pools.
              </span>
            </li>
            <li>
              <span>
                <b>Partner receives USDC directly.</b> Working capital raised
                against a stream they still own, with no bank in the loop.
              </span>
            </li>
          </ol>
        </div>
      </section>

      {/* ── where GEOM sits ── */}
      <section>
        <p className="tkz-eyebrow">Ecosystem</p>
        <h2>Where $GEOM sits</h2>
        <p className="tkz-sub">
          The role is deliberate and matches the whitepaper&apos;s Section 7
          design principles: utility and access, never a claim.
        </p>
        <div className="tkz-panel">
          <ol className="tkz-flow">
            <li>
              <span>
                <b>The shared quote asset.</b> Each instrument&apos;s primary
                pool is quoted in GEOM, so the ecosystem shares one pricing
                and liquidity layer instead of fragmenting across quote
                assets.
              </span>
            </li>
            <li>
              <span>
                <b>Utility, not claim.</b> GEOM confers no royalty, revenue
                share, or claim on any deal, and no deal revenue funds any
                support of its price. That absence is a design principle, not
                an omission.
              </span>
            </li>
            <li>
              <span>
                <b>Liquidity compounds where trading happens.</b> Launch-guard
                fees thicken the GEOM-paired pools, improving execution for
                holders and lowering the cost of the next issuance.
              </span>
            </li>
            <li>
              <span>
                <b>Clean separation of roles.</b> The per-deal instruments
                carry the claims; the issuers carry the regulation; GEOM
                carries pricing, access, and liquidity. The ecosystem token
                never becomes the deal.
              </span>
            </li>
          </ol>
        </div>
      </section>

      {/* ── roadmap ── */}
      <section>
        <p className="tkz-eyebrow">Status</p>
        <h2>What exists, what is next</h2>
        <div className="tkz-road">
          <div className="tkz-roadrow">
            <span className="v">v0 · live</span>
            <span className="tkz-tag live">SHIPPED</span>
            <span className="d">
              The oracle: signed datasets, Solana-anchored digests, public
              verification. The tracker: the registry documenting that no
              institutional tokenized crude or rare-earth instrument exists,
              the whitespace this engine targets.
            </span>
          </div>
          <div className="tkz-roadrow">
            <span className="v">v0.1 · now</span>
            <span className="tkz-tag design">THIS PAGE</span>
            <span className="d">
              Issuance design: allocation, dual single-sided pools, fee
              ladder, distributions, advances. Under internal review.
            </span>
          </div>
          <div className="tkz-roadrow">
            <span className="v">v0.2</span>
            <span className="tkz-tag design">NEXT</span>
            <span className="d">
              Devnet pilot: mint a mock instrument, seed both single-sided
              Meteora pools, exercise the fee router and a claim cycle with
              synthetic data end to end.
            </span>
          </div>
          <div className="tkz-roadrow">
            <span className="v">v0.3</span>
            <span className="tkz-tag gated">GATED</span>
            <span className="d">
              First partner pilot. Gated on the per-deal legal wrapper and
              counsel sign-off; no live issuance before then.
            </span>
          </div>
        </div>
      </section>

      <p className="tkz-note">
        This page describes a system under design. It is informational only:
        not an offer to sell or a solicitation to buy any security, token, or
        instrument, and not investment advice. Illustrative deals, symbols,
        percentages, and fee levels are placeholders for design discussion and
        do not represent agreed terms with any partner. The oracle attests to
        data integrity and publication time only; it does not issue, custody,
        trade, or settle anything. Any live issuance is subject to legal
        structuring and counsel approval.
      </p>
    </main>
  );
}
