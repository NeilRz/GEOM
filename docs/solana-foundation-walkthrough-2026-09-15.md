# GEOM | Solana Foundation website walkthrough

September 15, 2026. Suggested duration: 8–10 minutes, plus questions.

## Before the call

Open these local tabs in order:

1. http://127.0.0.1:3000/
2. http://127.0.0.1:3000/app?m=map
3. http://127.0.0.1:3000/app?m=oracle
4. http://127.0.0.1:3000/app?m=terminal
5. http://127.0.0.1:3000/engine
6. http://127.0.0.1:3000/engine/holder (optional)

Use GEOM as the public brand; GAEA is the repository and legacy signing-domain name. Keep the issuer console separate from the retired `/tokenize` page. Do not show `/tokenize`.

### Presenter-only checks

- Local inspection on September 15: 16 signed datasets; latest stored anchor September 2, 2026, mainnet, slot 443822760; manifest matches. These are publication/version facts, not proof that source observations are up to date.
- `/api/health` reports `ok: true`, but the API signer starts `DDBT4er8` while the stored mainnet anchor signer starts `3khTgJAs`. The health endpoint does not compare these identities. Do not claim the same current key performs both operations. Confirm the intended rotation/configuration separately with the team. No secrets were changed for this demo.
- EIA data on this checkout ends August 28; the indicative registry price snapshot is August 29. Use the dates on screen. Do not call either a live price feed.
- The browser verification button checks the returned message's Ed25519 signature. It does not itself download the full dataset and recompute its hash; the independent verification workflow does that additional step.
- All engine instrument, compliance and payout examples are local simulations. A green general-manifest check does not attest the fictional instrument or its sample royalty statement.
- The map depends on external tiles; have the oracle tab ready if those are slow. Don't place trades or connect a real wallet during this walkthrough.

## 1. Homepage | 30 seconds

**Show:** Hero, then move into the application rather than scrolling the whole marketing site.

**Say:**

“GEOM is building the information and verification layer for energy and mineral assets. Our starting point is the physical asset: where it is, who operates it, which source describes it, and what information a future financial instrument would need.

I’ll show the utilities that exist today, then the tokenization engine we’re designing on Solana. The distinction is important: the intelligence and attestation layer is implemented; issuance is still a prototype.”

## 2. Map | 60 seconds

**Show:** Map. Pick a visible oil field, mine or power plant, open its record, and point out the source information. If convenient, use the popup's oracle link.

**Say:**

“This is the physical layer. It brings resource assets and infrastructure into one geographic view, so a user can inspect an asset in context rather than starting from a ticker.

The practical utility is research: find an asset, understand its reported characteristics, and follow it back to a published dataset. We combine curated records with larger public-source datasets. Their coverage and update schedules differ, so the source and version matter.”

**Transition:** “A map is useful, but the next question is whether someone else can verify the information we published.”

## 3. Oracle registry | 90 seconds

**Navigation:** In Oracle, choose **Datasets & registry** to reach the signed dataset catalog. Switch to **Token due diligence** for the next section.

**Show:** Oracle landing and publication receipt. Click **Datasets**, then **eia**. Point to the source, version and series. Click **Request & verify attestation** and wait for **Signature valid**.

**Say:**

“The oracle is our data attestation layer. This registry lets you inspect the underlying datasets as well as our tokenization research. It currently contains 16 signed datasets.

Here is a concrete example: petroleum fundamentals from the U.S. EIA. You can see exactly which series, source and published version we are using.

We create a SHA-256 fingerprint of the canonical dataset and sign a message containing that fingerprint with Ed25519. This button verifies the signature in the browser. A separate verifier can also fetch the dataset and recompute its fingerprint.

We also commit a manifest of dataset digests to Solana. The publication receipt links to that transaction. That gives an external record of the commitment, rather than relying only on a timestamp on our website.

The scope is precise: this verifies publication integrity. It does not prove the underlying geology, reserves or third-party reporting is accurate.”

**If asked about freshness:** “This local manifest matches the September 2 anchor. Freshness is separate: each dataset has its own observation date and ingestion cadence.”

## 4. Token due diligence | 90 seconds

**Show:** Oracle → **Token due diligence**. Keep the gold-fund pair, GLDx and GLDon, then click **Run live check**. Point to the dated issuer research, mainnet observation slot and control comparison. Inspect permanent delegation, freezing, pause state and transfer-hook configuration. Use the actual results on screen; controls can change.

**Say:**

“Here is the decision workflow we are building around the data. Two tokens can offer exposure to the same gold fund while using different issuer structures and on-chain controls.

We match the mint against issuer-published records, then read current Solana account state. The comparison shows minting and freezing authorities, permanent delegation, pause state and whether a transfer hook is actually configured. An authority can be a program or multisig, so this view does not claim to identify the ultimate controller.

These powers are not automatically bad. Securities can need administrative controls. The purpose is to make them explicit so a researcher knows what to ask the issuer and can retain a dated evidence report.

The open diligence items matter just as much: this does not establish backing, redemption performance, liquidity or accuracy of off-chain reporting. This is a working first diligence workflow. We still need to validate it with users.”

**Optional second example:** Click **Oil fund vs oil company**, then **Run live check**. USOon represents fund exposure; XOMx references Exxon equity. A common oil theme does not make the instruments interchangeable.

**If the RPC fails:** Say the current check is unavailable. The app displays an error instead of substituting the earlier registry snapshot as a live result. Continue with **Datasets & registry** and its dated sources.

**Transition:** “The longer-term connection is project-level evidence. Before royalties are tokenized, we can pilot a reporting workflow with an operator: versioned production statements, reporting deadlines and explainable exceptions. Connecting those reports to instrument policy and distributions is the engine roadmap.”

**Presenter note:** Do not claim the operator reporting workflow, external adoption, backing verification or automated royalty execution exists today. The local feature is a token-controls comparison, and its read-only observations are unsigned, separate from the anchored datasets.

## 5. Issuer engine | 2–3 minutes

**Show:** `/engine`. Start with the illustrative notice, then use Configure, Attest, Mint, Allowlist and Distribute.

**Say:**

“This is the issuer-side design preview. The sample royalty instrument, wallets and figures are fictional. No issuance program is deployed by this console.

First, an issuer defines the instrument: what right it represents, the supply, who can hold it, and the governing documents. Our proposed standard is Solana Token-2022.

The configuration shows how token extensions could support the instrument’s operating rules: transfer hooks, default account state, metadata references, and authority choices. These are design choices for technical and legal review, not a compliance guarantee.

The attestation reference connects to our existing oracle. Ultimately, a real instrument would need its own issuer documents and attestations; a healthy general data manifest is not enough.

Next comes the transfer-policy simulation. The issuer composes eligibility, jurisdiction, investor-class, holder-limit, lockup, sanctions and attestation checks.”

**Action:** Leave the first sample recipient selected; click **Simulate transfer**. If the local oracle reference is healthy, the example passes. Select **Claim expired**, run again, and show the eligibility failure.

**Say:**

“The value is making a rejection understandable before a transaction is attempted. Here the expired claim causes the example to fail. These results are calculated locally; we are not demonstrating deployed on-chain enforcement.”

**Action:** Go to Distribute; click **Preview distribution**.

**Say:**

“The last part previews a distribution from a sample royalty statement: the administration holdback, amount per unit, and treatment of active, frozen and unplaced units.

The intended connection is between a defined instrument, its supporting evidence and a reproducible payment calculation. The sample statement here is not attested, and this button does not transfer USDC. Building and validating that end-to-end path on devnet is the next engineering milestone.”

## 6. Holder experience | optional 45 seconds

**Show:** `/engine/holder`. Open Northern royalty, then Evidence and Terms. If time permits, show the eligibility screen.

**Say:**

“This is the other side of the same design: what a holder would inspect before requesting access. The instrument’s rights, evidence and eligibility rules should be legible before anyone interacts with it.

This is a demo wallet and fictional instrument. Holding GEOM alone does not confer an interest in a royalty instrument or a distribution entitlement.”

## 7. Close | 30 seconds

**Say:**

“What we can demonstrate today is the resource-intelligence workflow and signed publications with Solana commitments. What we want to validate next is the instrument lifecycle: issuer documents, Token-2022 configuration, transfer policy and a sample distribution cycle.

We would value the Foundation’s feedback on the architecture and introductions to relevant Token Extensions, identity and security teams. The concrete next step would be a scoped devnet pilot with measurable verification and policy checks.”

The closing ask is a suggested discussion prompt, not a commitment on the team's behalf. Adjust it if the meeting has an agreed commercial or grants objective.

## If you only have three minutes

1. **30 seconds:** Map: inspect the physical asset and identify its source.
2. **60 seconds:** Oracle: open EIA, verify the signature, point to the mainnet receipt and its date.
3. **75 seconds:** Engine: state prototype status, show one pass and one expired-claim failure, then the distribution preview.
4. **15 seconds:** Ask for a technical review and scoped devnet pilot.

## Short answers for likely questions

**Why Solana?** “The implemented commitment layer already uses Solana and Ed25519. The proposed instrument design uses Token-2022. We want to validate the full lifecycle with the ecosystem rather than promise portability before it exists.”

**Does the oracle validate the real-world asset?** “It proves integrity of published information. Independent technical diligence and issuer/legal verification remain separate.”

**Is the engine live?** “The interactive prototype is live locally. Issuance, policy enforcement and payout execution are not deployed by this console.”

**How does GEOM earn revenue?** “The current engine model proposes a flat licence fee to the protocol layer. We are discussing the operating model, not making revenue projections.”

**Who owns the compliance responsibility?** “The issuer and its advisers establish the requirements. Software can enforce configured rules, but does not itself establish legal compliance.”

**What does the GEOM token entitle someone to?** “It is separate from the instrument. Holding GEOM is not a claim on the sample royalty stream or the issuer.”


