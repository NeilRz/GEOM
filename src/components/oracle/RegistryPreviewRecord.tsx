"use client";
import { useEffect } from "react";
import CopyChip from "./CopyChip";

export default function RegistryPreviewRecord({ record, onBack }: { record: Record<string, unknown>; onBack: () => void }) {
  useEffect(() => { const escape = (e: KeyboardEvent) => { if (e.key === "Escape") onBack(); }; window.addEventListener("keydown", escape); return () => window.removeEventListener("keydown", escape); }, [onBack]);
  const links = ["product source", "address source", "explorer"];
  return <main className="main oracle-detail registry-record">
    <button className="btn" onClick={onBack}>← Back to registry</button>
    <p className="eyebrow">Source-reviewed registry · publication pending</p>
    <h1>{String(record.name)}</h1>
    <p className="page-lede">{String(record.note ?? "")}</p>
    <section className="panel" aria-label="Reviewed product evidence">
      <dl className="registry-evidence">
        {Object.entries(record).filter(([k]) => !["reviewPreview", "name", "note", ...links].includes(k)).map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>)}
      </dl>
      {typeof record["Solana mint"] === "string" && <CopyChip value={record["Solana mint"]} label="COPY SOLANA MINT" />}
      {typeof record["contract address"] === "string" && <CopyChip value={record["contract address"]} label="COPY CONTRACT ADDRESS" />}
      <div className="registry-source-links">{links.map(k => typeof record[k] === "string" && /^https:\/\//.test(record[k] as string) ? <a key={k} href={record[k] as string} target="_blank" rel="noreferrer">{k} ↗</a> : null)}</div>
    </section>
    <p className="registry-review-note">This record is an unanchored research preview. Issuer documents and on-chain mint or contract checks establish the source trail, not backing, redemption performance or executable liquidity. The dataset verification panel applies only to published snapshots.</p>
    <p className="dimmer">Informational only · not investment advice</p>
  </main>;
}
