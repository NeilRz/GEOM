"use client";

import { useEffect, useState } from "react";
import type { DatasetDetail } from "@/lib/oracle-catalog";
import type { AppData, AnchorRecord, OracleSelection } from "./GeomApp";
import ExplorerCatalog from "@/components/oracle/ExplorerCatalog";
import Flag from "@/components/Flag";
import SeriesChart from "@/components/oracle/SeriesChart";
import VerifyCard from "@/components/oracle/VerifyCard";
import CodeSnippets from "@/components/oracle/CodeSnippets";
import CopyChip from "@/components/oracle/CopyChip";
import RegistryPreviewRecord from "@/components/oracle/RegistryPreviewRecord";
import TokenDiligence from "@/components/oracle/TokenDiligence";
import "@/components/oracle/token-diligence.css";
import PublicationHeader from "@/components/oracle/PublicationHeader";
import "@/components/oracle/oracle-workspace.css";

function explorerUrl(a: AnchorRecord): string {
  return `https://explorer.solana.com/tx/${a.signature}${
    a.cluster === "mainnet-beta" ? "" : `?cluster=${a.cluster}`
  }`;
}

/* Friendly labels for the compact keys the map's plant popups carry. */
const RECORD_KEY_LABELS: Record<string, string> = {
  n: "Name",
  c: "Country",
  f: "Fuel",
  mw: "Capacity (MW)",
};

/* Record keys whose value is a country name — they get a mini flag. */
const COUNTRY_KEYS = new Set(["country", "c"]);

function RecordPanel({
  record,
  lngLat,
  detail,
  onShowMap,
}: {
  record: Record<string, unknown>;
  lngLat?: [number, number];
  detail: DatasetDetail;
  onShowMap: (lngLat: [number, number], props?: Record<string, unknown>) => void;
}) {
  const entries = Object.entries(record).filter(
    ([, v]) => v !== "" && v !== undefined && v !== null
  );
  const title = String(record.name ?? record.n ?? "Selected record");
  return (
    <div className="panel record-panel">
      <p className="panel-title">
        Selected record <span className="badge info">record</span>
      </p>
      <p className="record-title">{title}</p>
      <div className="kv-list" style={{ marginBottom: 12 }}>
        {entries
          .filter(([k]) => !["name", "n", "kind"].includes(k))
          .map(([k, v]) => (
            <div className="row" key={k}>
              <span className="k">{RECORD_KEY_LABELS[k] ?? k}</span>
              <span className="v" style={{ fontSize: 13 }}>
                {COUNTRY_KEYS.has(k) && typeof v === "string" && (
                  <Flag country={v} />
                )}
                {typeof v === "boolean" ? (v ? "yes" : "no") : String(v)}
              </span>
            </div>
          ))}
      </div>
      <p className="dimmer" style={{ fontSize: 12, margin: "0 0 12px" }}>
        This record ships inside the <span className="mono">{detail.id}</span>{" "}
        dataset, v{detail.version}. The attestation below covers its exact
        bytes, verify it, then fetch the raw record from the data endpoint.
      </p>
      {lngLat && (
        <button className="btn" style={{ fontSize: 13 }} onClick={() => onShowMap(lngLat, record)}>
          ← Show on map
        </button>
      )}
    </div>
  );
}

function DatasetDetailView({
  detail,
  data,
  selection,
  onBack,
  onShowMap,
}: {
  detail: DatasetDetail;
  data: AppData;
  selection: OracleSelection;
  onBack: () => void;
  onShowMap: (lngLat: [number, number], props?: Record<string, unknown>) => void;
}) {
  const latestAnchor = data.anchors[0];
  const anchorIsCurrent = latestAnchor?.manifestSha256 === data.manifestHash;
  const record =
    selection.dataset === detail.id && selection.record ? selection.record : null;

  // Esc walks back to the explorer, same as the back button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  return (
    <>
      <nav className="crumb detail-nav" aria-label="Breadcrumb">
        <button className="btn-back" onClick={onBack}>
          <span aria-hidden="true">←</span> Back to explorer
        </button>
        <span className="crumb-trail">
          <button className="crumb-link" onClick={onBack}>
            Oracle
          </button>
          <span aria-hidden="true">/</span>
          <span className="crumb-here">{detail.id}</span>
        </span>
        <span className="crumb-hint mono" aria-hidden="true">ESC</span>
      </nav>

      <header className="o-head">
        <div>
          <p className="eyebrow">{detail.category.toUpperCase()}</p>
          <h1 className="page-title" style={{ fontSize: 26 }}>
            {detail.title}
          </h1>
          <p className="page-lede" style={{ fontSize: 14 }}>{detail.description}</p>
        </div>
        <div className="o-head-badges">
          <span className="badge good">attested</span>
          {anchorIsCurrent ? (
            <span className="badge good">manifest matches</span>
          ) : (
            <span className="badge warn">manifest changed</span>
          )}
          <span className="badge plain">
            {detail.timeseries
              ? detail.id === "jodi"
                ? "monthly series"
                : detail.id === "electricity"
                  ? "yearly series"
                  : "weekly series"
              : "registry"}
          </span>
        </div>
      </header>

      <div className="o-detail-grid">
        <div style={{ display: "grid", gap: 20, minWidth: 0 }}>
          {record && (
            <RecordPanel
              record={record}
              lngLat={selection.lngLat}
              detail={detail.id === "tokenized" ? { ...detail, title: "Archived seed registry", description: "Historical signed snapshot, retained for reproducibility. Its coverage gaps and market-size estimates are outdated. The refreshed source-reviewed Solana records are available in the catalog; they are not included in this snapshot's signature or anchor." } : detail}
              onShowMap={onShowMap}
            />
          )}

          {detail.series ? (
            <SeriesChart
              series={detail.series}
              provenance={
                detail.id === "jodi"
                  ? "Source: JODI-Oil World Database (jodidata.org), national submissions compiled by the Joint Organisations Data Initiative, republished under GEOM attestation. Field production of the largest reporting producers."
                  : detail.id === "electricity"
                    ? "Source: Ember yearly electricity data (ember-energy.org), CC BY 4.0, republished under GEOM attestation. World generation by fuel."
                    : undefined
              }
              deltaLabel={
                detail.id === "jodi" ? "MO/MO" : detail.id === "electricity" ? "YR/YR" : undefined
              }
            />
          ) : (
            <div className="panel">
              <p className="panel-title">About this dataset</p>
              <div className="grid grid-3">
                <div className="stat-tile">
                  <span className="stat-value" style={{ fontSize: 26 }}>{detail.records}</span>
                  <span className="stat-label">Records</span>
                </div>
                <div className="stat-tile">
                  <span className="stat-value" style={{ fontSize: 26 }}>v{detail.version}</span>
                  <span className="stat-label">Version</span>
                </div>
                <div className="stat-tile">
                  <span className="stat-value" style={{ fontSize: 26 }}>
                    {detail.unit ?? "JSON"}
                  </span>
                  <span className="stat-label">Unit</span>
                </div>
              </div>
              <p className="provenance">
                Static registry dataset: it changes only on revision, and every
                revision is re-fingerprinted, re-signed, and re-anchored.
              </p>
            </div>
          )}

          <VerifyCard id={detail.id} />
          <CodeSnippets id={detail.id} />
        </div>

        <aside className="o-rail">
          <div className="panel">
            <p className="panel-title">Dataset metadata</p>
            <div className="kv-list">
              <div className="row">
                <span className="k">Id</span>
                <span className="v mono" style={{ fontSize: 12 }}>{detail.id}</span>
              </div>
              <div className="row">
                <span className="k">Version</span>
                <span className="v mono" style={{ fontSize: 12 }}>v{detail.version}</span>
              </div>
              <div className="row">
                <span className="k">Records</span>
                <span className="v mono" style={{ fontSize: 12 }}>{detail.records}</span>
              </div>
              <div className="row">
                <span className="k">Cadence</span>
                <span className="v" style={{ fontSize: 12.5 }}>{detail.cadence}</span>
              </div>
              {detail.schedule && (
                <div className="row">
                  <span className="k">Schedule</span>
                  <span className="v" style={{ fontSize: 12.5 }}>{detail.schedule}</span>
                </div>
              )}
              <div className="row">
                <span className="k">Sources</span>
                <span className="v" style={{ fontSize: 12.5 }}>{detail.sources.join(" · ")}</span>
              </div>
              {detail.license && (
                <div className="row">
                  <span className="k">License</span>
                  <span className="v" style={{ fontSize: 12.5 }}>{detail.license}</span>
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <p className="panel-title">Attestation</p>
            <div className="kv-list">
              <div className="row">
                <span className="k">SHA-256</span>
                <span className="v">
                  <span className="hash">{detail.sha256}</span>
                </span>
              </div>
              <div className="row">
                <span className="k">Signer</span>
                <span className="v">
                  <span className="hash">
                    {data.signer}
                    {data.signerDev ? "  (dev key, set ORACLE_SIGNER_KEY in production)" : ""}
                  </span>
                </span>
              </div>
              <div className="row">
                <span className="k">Scheme</span>
                <span className="v mono" style={{ fontSize: 12 }}>
                  Ed25519 · GAEA-ATTEST-V2
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              <CopyChip value={detail.sha256} label="COPY SHA-256" />
              <CopyChip value={data.signer} label="COPY SIGNER" />
            </div>
          </div>

          <div className="panel">
            <p className="panel-title">
              On-chain anchor
              {latestAnchor &&
                (anchorIsCurrent ? (
                  <span className="badge good">current</span>
                ) : (
                  <span className="badge warn">stale</span>
                ))}
            </p>
            {!latestAnchor ? (
              <p className="dim" style={{ fontSize: 13, margin: 0 }}>
                No anchors published yet.
              </p>
            ) : (
              <>
                <div className="kv-list">
                  <div className="row">
                    <span className="k">Network</span>
                    <span className="v mono" style={{ fontSize: 12 }}>
                      Solana {latestAnchor.cluster}
                    </span>
                  </div>
                  <div className="row">
                    <span className="k">Slot</span>
                    <span className="v mono" style={{ fontSize: 12 }}>
                      {latestAnchor.slot?.toLocaleString("en-US") ?? "—"}
                    </span>
                  </div>
                  <div className="row">
                    <span className="k">Anchored</span>
                    <span className="v mono" style={{ fontSize: 12 }}>
                      {new Date(latestAnchor.anchoredAt)
                        .toUTCString()
                        .replace("GMT", "UTC")}
                    </span>
                  </div>
                </div>
                <p className="dimmer" style={{ fontSize: 11.5, margin: "10px 0 12px" }}>
                  One Memo transaction commits to the digest manifest of all
                  datasets at once, including this one.
                </p>
                <a
                  className="btn"
                  style={{ fontSize: 13 }}
                  href={explorerUrl(latestAnchor)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on Solana Explorer →
                </a>
              </>
            )}
          </div>

          <div className="panel">
            <p className="panel-title">Endpoints</p>
            <div className="kv-list">
              <div className="row">
                <span className="k">Data</span>
                <span className="v">
                  <a
                    className="mono"
                    style={{ color: "var(--glacial-bright)", fontSize: 12 }}
                    href={`/api/datasets/${detail.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    /api/datasets/{detail.id}
                  </a>
                </span>
              </div>
              <div className="row">
                <span className="k">Attest</span>
                <span className="v">
                  <a
                    className="mono"
                    style={{ color: "var(--glacial-bright)", fontSize: 12 }}
                    href={`/api/attest/${detail.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    /api/attest/{detail.id}
                  </a>
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function OracleModule({
  data,
  selection,
  onSelect,
  onSelectRecord,
  onShowMap,
}: {
  data: AppData;
  selection: OracleSelection;
  onSelect: (dataset: string | null) => void;
  onSelectRecord: (
    dataset: string,
    record: Record<string, unknown>,
    lngLat?: [number, number]
  ) => void;
  onShowMap: (lngLat: [number, number], props?: Record<string, unknown>) => void;
}) {
  const [mode, setMode] = useState<"diligence" | "catalog">("diligence");
  const detail = selection.dataset ? data.details[selection.dataset] : null;

  if (selection.record?.reviewPreview === true) {
    return <RegistryPreviewRecord record={selection.record} onBack={() => onSelect(null)} />;
  }

  if (detail) {
    return (
      <main className="main oracle-detail">
        <DatasetDetailView
          detail={detail.id === "tokenized" ? { ...detail, title: "Archived seed registry", description: "Historical signed snapshot retained for reproducibility. Its gap claims and market estimates are outdated. Use the source-reviewed Solana registry for current coverage; that preview is not covered by this signature." } : detail}
          data={data}
          selection={selection}
          onBack={() => onSelect(null)}
          onShowMap={onShowMap}
        />
      </main>
    );
  }

  return (
    <section className="oracle-workspace" aria-label="Oracle workspace">
      <nav className="oracle-modes" aria-label="Oracle workflows">
        <button aria-pressed={mode === "diligence"} onClick={() => setMode("diligence")}>Token due diligence</button>
        <button aria-pressed={mode === "catalog"} onClick={() => setMode("catalog")}>Datasets & registry</button>
      </nav>
      {mode === "diligence" ? <TokenDiligence /> : <>
        <PublicationHeader data={data} />
        <ExplorerCatalog catalog={data.catalog} onOpenDataset={(id) => onSelect(id)} onOpenRecord={onSelectRecord} />
      </>}
    </section>
  );
}
