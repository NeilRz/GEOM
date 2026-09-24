import type { AppData } from "@/components/app/GeomApp";

export default function PublicationHeader({ data }: { data: AppData }) {
  const anchor = data.anchors[0];
  const matches = !!anchor && anchor.manifestSha256 === data.manifestHash;
  const receiptUrl = anchor ? `https://explorer.solana.com/tx/${anchor.signature}${anchor.cluster === "mainnet-beta" ? "" : `?cluster=${anchor.cluster}`}` : null;
  return (
    <header className="oracle-publication">
      <div className="oracle-intro">
        <h1>The resource data registry</h1>
        <p>Explore energy and mineral datasets, trace their sources, and verify what GEOM published.</p>
        <div className="oracle-proof-path" aria-label="Publication process">
          <span>Source data</span><span aria-hidden="true">/</span>
          <span>Signed fingerprint</span><span aria-hidden="true">/</span><span>Solana receipt</span>
        </div>
      </div>
      <section className="oracle-receipt" aria-label="Latest publication receipt">
        <div className="oracle-receipt-top">
          <span>Dataset publication receipt</span>
          <span className={matches ? "oracle-receipt-state" : "oracle-receipt-state warning"}>
            {matches ? "Manifest matches" : anchor ? "Manifest changed" : "No anchor"}
          </span>
        </div>
        <dl>
          <div><dt>Network</dt><dd>{anchor ? `Solana ${anchor.cluster === "mainnet-beta" ? "mainnet" : anchor.cluster}` : "Not anchored"}</dd></div>
          <div><dt>Published</dt><dd>{anchor ? new Date(anchor.anchoredAt).toISOString().slice(0, 10) : "Awaiting publication"}</dd></div>
          <div><dt>Coverage</dt><dd>{data.catalog.length} datasets</dd></div>
        </dl>
        <div className="oracle-receipt-bottom">
          <span>{data.signerDev ? "Development signer" : "Ed25519 signatures"}</span>
          {receiptUrl && <a href={receiptUrl} target="_blank" rel="noreferrer">Inspect transaction <span aria-hidden="true">↗</span></a>}
        </div>
      </section>
    </header>
  );
}
