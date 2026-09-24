# GEOM utility script | Solana Foundation, 15 September 2026

Spoken script for the "five modules" segment. About 6 minutes, plus questions.
Memorise the spine first, then the beats. Every module has the same shape:
what it is, the utility, what is live versus planned.

Tabs to have open: `/overview`, `/app?m=map`, `/app?m=oracle`, `/app?m=terminal`,
`/app?m=overview`, `/engine`. Never open `/tokenize`.

## The spine (memorise this first)

1. **Map.** Find the physical asset.
2. **Oracle.** Prove what we published about it.
3. **Terminal.** See how the market prices it.
4. **Status.** Check our proof in the open.
5. **Engine.** Turn a real asset right into a Solana instrument. In design.

One line for the whole thing: "GEOM is the information and verification layer
for energy and mineral assets. Four utilities are live. The fifth, issuance,
is being designed on Solana Token-2022."

## Opener | 20 seconds

"GEOM starts from the physical asset, not from a ticker. Where is it, who
operates it, which source describes it, and what would a financial instrument
built on it need to know.

The product is five modules. Four are live today. The fifth is the
tokenization engine we are designing on Solana. I will keep live and planned
clearly separate as I go."

## 01 Map | 45 seconds

**Show:** the globe. Click one oil field, mine or power plant. Open its record.
Point to the source line. If it is quick, use the popup's oracle link.

"Module one is the Map. This is the physical layer on one globe: reserves,
mines, about five thousand extraction assets, routed pipelines and around
thirty-eight thousand power plants.

The utility is research. You find an asset, read its reported
characteristics, and follow it back to the dataset it came from. We combine
curated records with larger public-source datasets, and their coverage and
update schedules differ, so the source and the version always matter.

Live today. Data ends on the dates you see on screen."

**Transition:** "A map is useful. The harder question is whether anyone else
can verify what we published."

## 02 Oracle | 90 seconds

**Show:** Oracle landing and publication receipt. Datasets, then EIA. Point to
source, series, version. Click Request and verify attestation. Wait for
Signature valid. Then switch to Token due diligence, keep GLDx and GLDon,
click Run live check.

"Module two is the Oracle. It is our data attestation layer. Think of it as a
notary, not an oracle of truth.

Sixteen signed datasets. Here is the EIA petroleum dataset. We take the
canonical bytes, hash them with SHA-256, sign the digest with Ed25519, and
commit a manifest of all digests to Solana. The receipt links to the mainnet
transaction. This button verifies the signature in your browser. An
independent verifier can fetch the dataset and recompute the hash.

The scope is exact: this proves what we published and when. It does not prove
the geology or a third party's reporting is accurate. Accuracy comes from the
reserve auditors and licence portals, and we point to them.

The second utility inside the oracle is token due diligence. Two tokens can
give exposure to the same gold fund with different issuer structures and
different on-chain controls. We match the mint to issuer-published records,
then read live Solana account state: mint and freeze authorities, permanent
delegation, pause state, whether a transfer hook is actually configured.
These powers are not bad by default. Securities need admin controls. The
point is to make them explicit and give the researcher a dated evidence file.

Signed datasets and the Solana commitment are live. The live check is
read-only and unsigned. It does not establish backing, redemption or
liquidity."

**If the RPC fails:** "The check is unavailable right now. The app shows an
error rather than passing off an old snapshot as live." Move on.

## 03 Terminal | 40 seconds

**Show:** the candle board. Point to the group headers: partners, tokenized
RWA, energy, minerals, benchmarks.

"Module three is the Terminal. Live candles across our partner listings,
tokenized real-world-asset tokens, energy, minerals and benchmarks, on one
board.

The utility is context. Once you know the asset and trust the data, you want
to see how the market is pricing the exposures around it, side by side.

Execution is routed to external venues and the user self-custodies. GEOM
never holds funds and never takes the other side. Live today. Informational
only, no recommendations anywhere in the product."

## 04 Status | 30 seconds

**Show:** the Status view. Point to the anchor history, signer identity and
the dataset digest list.

"Module four is Status. This is the proof surface. Anchor history, the
current signer identity and every dataset digest, in the open, so a
developer can check us without asking us.

The utility is trust without permission. Anyone can compare a digest here
with what is on chain. Developer API access is requested from this page.
Live today."

**Do not say** the same key signs the API and the stored mainnet anchor. Say
"the signer identity is published here" and leave it there.

## 05 Engine | 90 seconds

**Show:** `/engine`. Start on the illustrative notice. Configure, Attest,
then Allowlist: leave the first recipient, click Simulate transfer, it passes.
Select Claim expired, run again, it fails. Then Distribute, Preview
distribution.

"Module five is the Tokenization Engine, and this one is a design preview.
The instrument, wallets and figures are fictional. Nothing here deploys a
program.

An issuer defines the instrument: the right it represents, supply, who may
hold it, governing documents. Our proposed standard is Solana Token-2022.
The extensions map to the operating rules: transfer hooks, default account
state, metadata, authority choices.

The attestation step plugs into the oracle you just saw. A real instrument
would need its own documents and attestations, not just our general manifest.

Transfer policy is composed from eligibility, jurisdiction, investor class,
holder limits, lockups, sanctions and attestation checks. Watch: this
recipient passes. Now with an expired claim, it fails, and the reason is
readable before any transaction is attempted.

Last, distribution. From a sample royalty statement: holdback, amount per
unit, and how active, frozen and unplaced units are treated. This does not
move USDC. Building that path end to end on devnet is the next milestone."

**Structure line if asked who runs the money:** "The Foundation runs the
plumbing and the proof. Licensed companies run the money. Only the data layer
is live."

## Close | 20 seconds

"So: find the asset, prove the data, see the market, check the proof, and
then, in design, turn the asset right into a Solana instrument.

What we would value from the Foundation is a technical review of the
Token-2022 design, and introductions to the Token Extensions, identity and
security teams. The concrete next step is a scoped devnet pilot with
measurable verification and policy checks."

## Three-minute version

1. Map: one asset, one source line. 30 seconds.
2. Oracle: EIA, verify signature, point to the mainnet receipt date. 60 seconds.
3. Engine: say prototype, one pass, one expired-claim failure, distribution
   preview. 75 seconds.
4. Ask for review and a devnet pilot. 15 seconds.

## Guardrails

- Notary, not truth. Never say the oracle verifies operator or reserve data.
  No operator report is in the signed set yet.
- Live versus planned, every module. Never present engine mechanics in the
  present tense.
- No price feed claims. Use the dates on screen. EIA ends 28 August, price
  snapshot 29 August, latest anchor 2 September.
- Solana Token-2022 only. No EVM, no chain-agnostic.
- No revenue projections, no advice, no price targets.
- Praise existing rails (xStocks, Ondo, Backpack, pump.fun, Meteora) as
  pioneers GEOM builds alongside. Never a dig.
- GEOM token confers no interest in any instrument.

## Likely questions

**Why Solana?** "The commitment layer already runs on Solana with Ed25519. The
instrument design is Token-2022. We want to validate the full lifecycle with
this ecosystem rather than promise portability."

**Is the oracle independent?** "It is independent about publication, not
about accuracy. Accuracy is vouched for by the reserve auditor and the
licence regulator, and we link to them."

**Is the engine live?** "Locally as an interactive prototype. Issuance,
enforcement and payout are not deployed."

**How does GEOM make money?** "The engine model proposes a flat licence fee to
the protocol layer. We are discussing the model, not projecting revenue."

**What does the GEOM token give me?** "Nothing in any instrument. It is
separate from the royalty streams and the issuers."

**Who is responsible for compliance?** "The issuer and its advisers. Software
enforces configured rules. It does not make something compliant."
