"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import tokenized from "@/data/tokenized.json";
import reviewedRegistry from "@/data/registry.json";
import fields from "@/data/fields.json";
import sites from "@/data/sites.json";
import reserves from "@/data/reserves.json";
import pipelines from "@/data/pipelines.json";
import prices from "@/data/prices.json";
import type { CatalogRow } from "@/lib/oracle-catalog";
import CatIcon from "./CatIcon";
import ChainMarks, { type ChainName } from "./ChainMark";
import Flag from "@/components/Flag";

/* The Pyth-explore-shaped surface: a filter rail (quick search, collapsible
   checkbox groups with live counts) beside one dense table where signed
   datasets, tokenized assets, and watchlist names are all rows of the same
   catalog. The quick search goes deeper: it also hits every individual
   asset record inside the datasets (fields, mines, reserve countries,
   pipelines, and the 38,378 power plants, lazy-loaded on first search). */

type Kind = "dataset" | "asset" | "watch" | "record";

interface ExploreRow {
  key: string;
  kind: Kind;
  symbol: string;
  title: string;
  category: string;
  categoryKey: string;
  color: string;
  icon: string;
  status: { cls: string; label: string };
  details: string;
  meta: string;
  spark: number[] | null;
  datasetId: string;
  record: Record<string, unknown> | null;
  lngLat?: [number, number];
  /** Attested indicative quote from the signed prices dataset, if one exists. */
  price?: PriceQuote;
  /** Country whose mini flag decorates the title line (record rows). */
  flagCountry?: string;
  provider?: string;
  /** Chains where a reviewed token exists (asset rows: the token's own chain;
      watchlist rows: every chain with a reviewed wrapper of that stock). */
  chains?: ChainName[];
}

interface PriceQuote {
  price: number;
  currency: string;
  changePct: number | null;
  spark: number[] | null;
}

/* The signed prices snapshot, keyed by registry symbol / watchlist ticker.
   Same bytes the oracle attests and anchors — see /api/datasets/prices. */
const PRICE_BY_SYMBOL: Record<string, PriceQuote> = Object.fromEntries(
  prices.prices.map((p) => [
    p.symbol,
    {
      price: p.price,
      currency: p.currency,
      changePct: p.changePct,
      spark: p.spark?.length > 1 ? p.spark : null,
    },
  ])
);

function fmtPrice(q: PriceQuote): string {
  const v = q.price.toLocaleString("en-US", {
    minimumFractionDigits: q.price < 1 ? 0 : 2,
    maximumFractionDigits: q.price < 1 ? 4 : 2,
  });
  if (q.currency === "USD") return `$${v}`;
  if (q.currency === "GBp") return `${v}p`;
  return `${v} ${q.currency}`;
}

const KIND_LABEL: Record<Kind, string> = {
  dataset: "Dataset",
  asset: "Tokenized asset",
  watch: "Watchlist",
  record: "Asset record",
};

const DATASET_ICON: Record<string, string> = {
  reserves: "droplet",
  fields: "rig",
  tokenized: "coin",
  market: "chart",
  sites: "hammer",
  plants: "bolt",
  pipelines: "pipe",
  eia: "bars",
  prices: "chart",
  goget: "rig",
  goit: "pipe",
  jodi: "droplet",
  noc: "bars",
  minerals: "hammer",
  electricity: "bolt",
};

const SITE_GROUP_STYLE: Record<string, { color: string; icon: string }> = {
  base: { color: "#b26a4e", icon: "hammer" },
  precious: { color: "#cbc3b1", icon: "diamond" },
  battery: { color: "#2ba57e", icon: "battery" },
  ree: { color: "#8a75e8", icon: "crystal" },
  nuclear: { color: "#8fb4c9", icon: "atom" },
};

const ATTESTED = { cls: "good", label: "Attested" };

function pretty(id: string): string {
  return id.replace(/-/g, " ");
}

function buildRows(catalog: CatalogRow[]): ExploreRow[] {
  const datasets: ExploreRow[] = catalog.map((c) => ({
    key: `ds-${c.id}`,
    kind: "dataset" as const,
    symbol: c.id,
    title: c.id === "tokenized" ? "Archived seed registry" : c.title,
    category: c.category,
    categoryKey: `ds:${c.category}`,
    color: c.color,
    icon: DATASET_ICON[c.id] ?? "coin",
    status: c.id === "tokenized" ? { cls: "warn", label: "Archived" } : ATTESTED,
    details: c.records,
    meta: `v${c.version}`,
    spark: c.spark,
    datasetId: c.id,
    record: null,
  }));

  // Solana records carry a mint; Robinhood Chain records carry an ERC-20
  // contract. Each row keeps the evidence fields its own chain can provide.
  const assets: ExploreRow[] = reviewedRegistry.assets.map((a) => {
    const evm = !a.solanaMint;
    const address = a.solanaMint ?? a.evmAddress ?? "";
    return {
      key: `review-${address}`, kind: "asset", symbol: a.symbol, title: a.name,
      category: a.exposure, categoryKey: a.category, provider: a.provider, chains: a.chains as ChainName[],
      color: a.category === "metal-fund" ? "#c4a469" : "#8fb4c9", icon: a.category === "metal-fund" ? "ingot" : "chart",
      status: { cls: "info", label: "Reviewed" }, details: a.provider + " · " + a.resource,
      meta: "reviewed " + a.reviewedAt.slice(0, 10), spark: null, datasetId: "registry",
      record: { reviewPreview: true, name: a.name, symbol: a.symbol, issuer: a.issuer,
        provider: a.provider, underlying: a.underlying, "underlying ticker": a.underlyingTicker,
        exposure: a.exposure, resource: a.resource, structure: a.structure,
        chain: evm ? `Robinhood Chain mainnet (chain id ${a.chainId})` : "Solana mainnet",
        ...(evm
          ? { "contract address": address, "on-chain check": `Contract code present at block ${a.onchain.block}`,
              "token standard": `ERC-20 · ${a.onchain.decimals} decimals`, "corporate-action multiplier": a.onchain.multiplier }
          : { "Solana mint": address, "on-chain check": "Initialized mint at slot " + a.onchain.slot, "token program": a.onchain.program }),
        "reviewed at": a.reviewedAt, "check time": a.onchain.checkedAt,
        "product source": a.sourceUrl, "address source": a.addressSourceUrl,
        explorer: (evm ? "https://robinhoodchain.blockscout.com/token/" : "https://solscan.io/token/") + address, note: a.relevance },
    };
  });

  const watch: ExploreRow[] = tokenized.watchlist.map((w) => {
    const matches = reviewedRegistry.assets.filter(a => a.underlyingTicker === w.ticker);
    const found = matches.length > 0;
    const price = PRICE_BY_SYMBOL[w.ticker];
    const chains = Array.from(new Set(matches.flatMap(a => a.chains))) as ChainName[];
    return {
      key: `wl-${w.ticker}`, kind: "watch", symbol: w.ticker, title: w.name,
      category: w.sector === "mining" ? "Mining watchlist" : "Energy watchlist",
      categoryKey: w.sector === "mining" ? "watchlist-mining-equity" : "watchlist-oil-equity",
      color: "#7e97a6", icon: "eye", status: { cls: found ? "good" : "", label: found ? "Coverage found" : "Not reviewed" },
      details: found ? matches.map(a => a.solanaMint ? a.symbol : `${a.symbol} · Robinhood`).join(", ") : w.listing,
      meta: "—", chains, spark: price?.spark ?? null, price, datasetId: "tokenized",
      record: { reviewPreview: true, name: w.name, ticker: w.ticker, listing: w.listing,
        "reviewed coverage": found ? matches.map(a=>a.symbol + " (" + a.provider + ")").join(", ") : "Not reviewed in this pass; this is not evidence that no token exists.",
        ...(found ? { "product source": matches[0].sourceUrl } : {}),
        note: "A listed company and a tokenized wrapper are separate instruments. Search the wrapper symbol to inspect its mint and issuer." },
    };
  });

  return [...datasets, ...assets, ...watch];
}

/* Every individual asset inside the small attested datasets, searchable.
   Plants (38,378 records, 7.7 MB) load separately on first search. */
function buildRecordIndex(): ExploreRow[] {
  const rec = (
    key: string,
    datasetId: string,
    style: { color: string; icon: string },
    symbol: string,
    title: string,
    details: string,
    record: Record<string, unknown>,
    lngLat?: [number, number],
    flagCountry?: string
  ): ExploreRow => ({
    key,
    kind: "record",
    symbol,
    title,
    category: pretty(datasetId),
    categoryKey: `rec:${datasetId}`,
    color: style.color,
    icon: style.icon,
    status: ATTESTED,
    details,
    meta: datasetId,
    spark: null,
    datasetId,
    record,
    lngLat,
    flagCountry,
  });

  return [
    ...fields.fields.map((f) =>
      rec(
        `rec-f-${f.name}`,
        "fields",
        { color: "#e8a33d", icon: "rig" },
        f.name,
        `${f.country} · ${f.type}`,
        f.figure,
        { name: f.name, country: f.country, commodity: f.type, figure: f.figure, status: f.status, note: f.note },
        [f.lng, f.lat],
        f.country
      )
    ),
    ...sites.sites.map((s) =>
      rec(
        `rec-s-${s.name}`,
        "sites",
        SITE_GROUP_STYLE[s.group] ?? { color: "#b26a4e", icon: "hammer" },
        s.name,
        `${s.country} · ${s.commodity}`,
        s.figure,
        { name: s.name, country: s.country, commodity: s.commodity, figure: s.figure, operator: s.operator, status: s.status, note: s.note },
        [s.lng, s.lat],
        s.country
      )
    ),
    ...reserves.countries.map((c) =>
      rec(
        `rec-r-${c.iso}`,
        "reserves",
        { color: "#5e8ba6", icon: "droplet" },
        c.name,
        "proven crude reserves",
        `${c.reserves} billion bbl`,
        { name: c.name, reserves: `${c.reserves} billion bbl`, status: c.status, note: c.note },
        [c.lng, c.lat]
      )
    ),
    ...pipelines.pipelines.map((p) =>
      rec(
        `rec-p-${p.name}`,
        "pipelines",
        { color: "#c67c1b", icon: "pipe" },
        p.name,
        `${p.kind} pipeline`,
        p.figure,
        { name: p.name, kind: p.kind, figure: p.figure, status: p.status, note: p.note },
        (p.coords as [number, number][])[0]
      )
    ),
  ];
}

const RECORD_HIT_CAP = 40;

function Sparkline({ values }: { values: number[] }) {
  const W = 88;
  const H = 22;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min || 1) * 0.12;
  const lo = min - pad;
  const hi = max + pad;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - lo) / (hi - lo)) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const up = values[values.length - 1] >= values[0];
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={up ? "#5fd4ae" : "#e87a85"}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: Array<{ key: string; label: string; count: number }>;
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="ex-group">
      <button className="ex-group-title" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{title}</span>
        <span className={`ex-chevron ${open ? "" : "closed"}`} aria-hidden="true">
          ⌃
        </span>
      </button>
      <div className={`ex-group-body ${open ? "" : "closed"}`}>
        <div>
          {options.map((o) => (
            <label key={o.key} className="ex-check">
              <input
                type="checkbox"
                checked={selected.has(o.key)}
                onChange={() => onToggle(o.key)}
              />
              <span className="ex-box" aria-hidden="true" />
              <span className="ex-check-label">{o.label}</span>
              <span className="ex-check-count">{o.count}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

type SortCol = "symbol" | "kind" | "category" | "chain" | "status" | "price" | "details" | "meta";

const SORT_KEY: Record<SortCol, (r: ExploreRow) => string | number> = {
  symbol: (r) => r.symbol.toLowerCase(),
  kind: (r) => r.kind,
  category: (r) => r.category,
  chain: (r) => (r.chains ?? []).join(" + ") || "~",
  status: (r) => r.status.label,
  price: (r) => r.price?.price ?? -1,
  details: (r) => r.details.toLowerCase(),
  meta: (r) => r.meta.toLowerCase(),
};

const SKELETON_WIDTHS = [72, 48, 64, 36, 52, 88, 44, 60];

export default function ExplorerCatalog({
  catalog,
  onOpenDataset,
  onOpenRecord,
}: {
  catalog: CatalogRow[];
  onOpenDataset: (id: string) => void;
  onOpenRecord: (
    datasetId: string,
    record: Record<string, unknown>,
    lngLat?: [number, number]
  ) => void;
}) {
  const rows = useMemo(() => buildRows(catalog), [catalog]);
  const staticRecords = useMemo(() => buildRecordIndex(), []);
  const [plantRecords, setPlantRecords] = useState<ExploreRow[] | null>(null);
  const [plantsLoading, setPlantsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [kinds, setKinds] = useState<Set<string>>(new Set());
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Set<string>>(new Set());
  const [providers, setProviders] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ col: SortCol; dir: 1 | -1 } | null>(null);

  const q = query.trim().toLowerCase();

  /* Short skeleton shimmer on checkbox-filter changes (not while typing),
     the Pyth-style "results refreshing" beat. */
  const [pending, setPending] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const bumpEpoch = () => {
    setEpoch((e) => e + 1);
    setPending(true);
  };
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setPending(false), 300);
    return () => clearTimeout(t);
  }, [pending, kinds, cats, statuses]);

  /* The heavy record indexes ride in on the first real search, from the
     same signed bytes the oracle attests: the 38,378 plants (CDN copy),
     plus the GEM extraction assets and pipelines (dataset API). */
  const plantsFetchStarted = useRef(false);
  const maybeLoadPlants = (value: string) => {
    if (value.trim().length < 2 || plantsFetchStarted.current) return;
    plantsFetchStarted.current = true;
    setPlantsLoading(true);
    const plants: Promise<ExploreRow[]> = fetch("/data/plants.json")
      .then((r) => r.json())
      .then(
        (ds: {
          plants: Array<{ name: string; country: string; fuel: string; mw: number; lat: number; lng: number }>;
        }) =>
          ds.plants.map((p) => ({
            key: `rec-pl-${p.name}-${p.lat}-${p.lng}`,
            kind: "record" as const,
            symbol: p.name,
            title: `${p.country} · ${p.fuel}`,
            category: "plants",
            categoryKey: "rec:plants",
            color: "#5fd4ae",
            icon: "bolt",
            status: ATTESTED,
            details: `${p.mw.toLocaleString("en-US")} MW`,
            meta: "plants",
            spark: null,
            datasetId: "plants",
            record: { name: p.name, country: p.country, fuel: p.fuel, "capacity (MW)": p.mw },
            lngLat: [p.lng, p.lat] as [number, number],
            flagCountry: p.country,
          }))
      );
    const goget: Promise<ExploreRow[]> = fetch("/api/datasets/goget")
      .then((r) => r.json())
      .then(
        (ds: {
          assets: Array<{ project: string; country: string; status: string; fuel: string; type: string; operator?: string; parent?: string; lat?: number; lng?: number }>;
        }) =>
          ds.assets.map((a, i) => ({
            key: `rec-gx-${i}-${a.project}`,
            kind: "record" as const,
            symbol: a.project,
            title: `${a.country} · ${a.fuel} ${a.type}`,
            category: "goget",
            categoryKey: "rec:goget",
            color: "#e8873c",
            icon: "rig",
            status: ATTESTED,
            details: a.status,
            meta: "goget",
            spark: null,
            datasetId: "goget",
            record: {
              project: a.project,
              country: a.country,
              status: a.status,
              hydrocarbon: a.fuel,
              type: a.type,
              ...(a.operator ? { operator: a.operator } : {}),
              ...(a.parent ? { parent: a.parent } : {}),
            },
            lngLat:
              a.lng !== undefined && a.lat !== undefined
                ? ([a.lng, a.lat] as [number, number])
                : undefined,
            flagCountry: a.country,
          }))
      );
    const goit: Promise<ExploreRow[]> = fetch("/api/datasets/goit")
      .then((r) => r.json())
      .then(
        (ds: {
          pipelines: Array<{ project: string; unit?: string; type: string; parent?: string; countries: string; status: string; capacity?: number }>;
        }) =>
          ds.pipelines.map((p, i) => ({
            key: `rec-gp-${i}-${p.project}`,
            kind: "record" as const,
            symbol: p.unit ? `${p.project} · ${p.unit}` : p.project,
            title: `${p.countries} · ${p.type.replace(/_/g, " ")}`,
            category: "goit",
            categoryKey: "rec:goit",
            color: "#b5773a",
            icon: "pipe",
            status: ATTESTED,
            details: p.status,
            meta: "goit",
            spark: null,
            datasetId: "goit",
            record: {
              project: p.project,
              ...(p.unit ? { unit: p.unit } : {}),
              countries: p.countries,
              kind: p.type.replace(/_/g, " "),
              status: p.status,
              ...(p.parent ? { parent: p.parent } : {}),
              ...(p.capacity !== undefined ? { capacity: p.capacity } : {}),
            },
          }))
      );
    Promise.allSettled([plants, goget, goit])
      .then((results) => {
        const rows = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
        if (rows.length) setPlantRecords(rows);
      })
      .finally(() => setPlantsLoading(false));
  };

  const toggle =
    (set: Set<string>, apply: (s: Set<string>) => void) => (key: string) => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      bumpEpoch();
      apply(next);
    };

  const filtered = useMemo(() => {
    const out = rows.filter((r) => {
      if (kinds.size && !kinds.has(r.kind)) return false;
      if (providers.size && (!r.provider || !providers.has(r.provider))) return false;
      if (cats.size && !cats.has(r.categoryKey)) return false;
      if (statuses.size && !statuses.has(r.status.label)) return false;
      if (
        q &&
        !`${r.symbol} ${r.title} ${r.category} ${r.details} ${r.meta} ${JSON.stringify(r.record ?? {})}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    if (sort) {
      const key = SORT_KEY[sort.col];
      out.sort((a, b) => (key(a) < key(b) ? -sort.dir : key(a) > key(b) ? sort.dir : 0));
    } else {
      // Default order: live rows first — anything with a 52w trend (priced
      // assets, watchlist names, the EIA series) reads like an oracle at
      // first sight. Stable sort keeps catalog order within each group.
      out.sort((a, b) => Number(!!b.spark) - Number(!!a.spark));
    }
    return out;
  }, [rows, q, kinds, cats, statuses, providers, sort]);

  /* Deep hits: individual records inside the datasets, search-only. */
  const recordHits = useMemo(() => {
    if (q.length < 2 || providers.size || cats.size || statuses.size || (kinds.size && !kinds.has("record"))) return [];
    const all = plantRecords ? staticRecords.concat(plantRecords) : staticRecords;
    const hits: ExploreRow[] = [];
    for (const r of all) {
      if (`${r.symbol} ${r.title} ${r.details}`.toLowerCase().includes(q)) {
        hits.push(r);
        if (hits.length >= RECORD_HIT_CAP) break;
      }
    }
    return hits;
  }, [q, staticRecords, plantRecords, providers, cats, statuses, kinds]);

  const { kindCounts, statusCounts, catOptions } = useMemo(() => {
    const kind = new Map<string, number>();
    const status = new Map<string, number>();
    const catLabels = new Map<string, string>();
    const cat = new Map<string, number>();
    for (const r of rows) {
      kind.set(r.kind, (kind.get(r.kind) ?? 0) + 1);
      status.set(r.status.label, (status.get(r.status.label) ?? 0) + 1);
      // Registry folders only: every dataset has a one-off category, which
      // would render a filter list of nothing but (1)s. Datasets are already
      // one checkbox in the Type group.
      if (r.kind === "dataset") continue;
      cat.set(r.categoryKey, (cat.get(r.categoryKey) ?? 0) + 1);
      if (!catLabels.has(r.categoryKey)) catLabels.set(r.categoryKey, r.category);
    }
    return {
      kindCounts: kind,
      statusCounts: status,
      catOptions: Array.from(catLabels.entries()).map(([key, label]) => ({
        key,
        label,
        count: cat.get(key) ?? 0,
      })),
    };
  }, [rows]);

  const anyFilter = providers.size > 0 || kinds.size > 0 || cats.size > 0 || statuses.size > 0 || query.length > 0;
  const clearAll = () => {
    bumpEpoch();
    setKinds(new Set());
    setCats(new Set());
    setStatuses(new Set());
    setQuery("");
    setProviders(new Set());
  };

  const open = (r: ExploreRow) => {
    if (r.record) onOpenRecord(r.datasetId, r.record, r.lngLat);
    else onOpenDataset(r.datasetId);
  };

  const clickSort = (col: SortCol) => {
    setSort((prev) =>
      !prev || prev.col !== col
        ? { col, dir: 1 }
        : prev.dir === 1
          ? { col, dir: -1 }
          : null
    );
  };

  const caret = (col: SortCol) =>
    sort?.col === col ? (sort.dir === 1 ? "↑" : "↓") : "⇅";

  const sortableTh = (col: SortCol, label: string) => (
    <th>
      <button className="th-sort" onClick={() => clickSort(col)}>
        {label} <span className={`th-caret ${sort?.col === col ? "on" : ""}`}>{caret(col)}</span>
      </button>
    </th>
  );

  const renderRow = (r: ExploreRow) => {
    const address = r.kind === "asset" ? r.record?.["Solana mint"] ?? r.record?.["contract address"] : undefined;
    return (
    <tr key={r.key} className="catalog-row" onClick={() => open(r)}>
      <td>
        <span className="cat-id">
          <span
            className="ex-avatar"
            style={{ background: `${r.color}22`, color: r.color }}
          >
            <CatIcon icon={r.icon} />
            {r.kind === "dataset" && (
              <span className="ex-avatar-badge" title="Attested dataset">
                ✓
              </span>
            )}
          </span>
          <span>
            <button className="mono catalog-name ex-open" onClick={(event) => { event.stopPropagation(); open(r); }} aria-label={`Open ${r.symbol}: ${r.title}`}>{r.symbol}</button>
            <br />
            <span className="dim" style={{ fontSize: 11.5 }}>
              {r.flagCountry && <Flag country={r.flagCountry} />}
              {r.title}
            </span>
          </span>
        </span>
      </td>
      <td className="mono dim" style={{ fontSize: 11 }}>{KIND_LABEL[r.kind]}</td>
      <td className="mono dim" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {r.category}
      </td>
      <td className="chain-cell">
        {r.kind === "dataset" || r.kind === "record" ? <span className="dimmer mono" style={{ fontSize: 11 }}>—</span> : <ChainMarks chains={r.chains ?? []} />}
      </td>
      <td>
        <span className={`badge ${r.status.cls}`}>{r.status.label}</span>
      </td>
      <td className="mono" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
        {typeof address === "string" ? (
          <span title={address}>{address.slice(0, 6)}…{address.slice(-4)}</span>
        ) : r.price ? (
          <>
            {fmtPrice(r.price)}
            {r.price.changePct !== null && (
              <span
                className={
                  r.price.changePct < 0 ? "px-delta down" : "px-delta up"
                }
              >
                {r.price.changePct > 0 ? "+" : ""}
                {r.price.changePct.toFixed(2)}%
              </span>
            )}
          </>
        ) : (
          <span className="dimmer">—</span>
        )}
      </td>
      <td className="dim" style={{ fontSize: 12 }}>{r.details}</td>
      <td className="mono dim" style={{ fontSize: 11.5 }}>{r.meta}</td>
      <td>
        {r.spark ? (
          <Sparkline values={r.spark} />
        ) : (
          <span className="dimmer mono" style={{ fontSize: 11 }}>—</span>
        )}
      </td>
      <td className="mono catalog-go" aria-hidden="true">→</td>
    </tr>
    );
  };

  return (
    <div className="ex-shell">
      <aside className="ex-rail">
        <input
          className="lib-search"
          placeholder="Search datasets & assets…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            maybeLoadPlants(e.target.value);
          }}
          aria-label="Search the catalog and all asset records"
        />
        <div className="ex-rail-head">
          <span>Filters</span>
          {anyFilter && (
            <button className="ex-clear" onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>
        <FilterGroup
          title="Type"
          options={(["dataset", "asset", "watch"] as Kind[]).map((k) => ({
            key: k,
            label: KIND_LABEL[k],
            count: kindCounts.get(k) ?? 0,
          }))}
          selected={kinds}
          onToggle={toggle(kinds, setKinds)}
        />
        <FilterGroup title="Issuer program"
          options={["xStocks", "Ondo", "Backpack", "Robinhood"].map(p => ({ key: p, label: p, count: reviewedRegistry.assets.filter(a => a.provider === p).length }))}
          selected={providers} onToggle={toggle(providers, setProviders)} />
        <FilterGroup
          title="Exposure"
          options={catOptions}
          selected={cats}
          onToggle={toggle(cats, setCats)}
        />
        <FilterGroup
          title="Status"
          options={Array.from(statusCounts.entries()).map(([k, count]) => ({
            key: k,
            label: k,
            count,
          }))}
          selected={statuses}
          onToggle={toggle(statuses, setStatuses)}
        />
        <p className="ex-rail-note">
          Search reaches every asset record inside the datasets: fields,
          mines, reserve countries, pipelines, and all power plants.
        </p>
      </aside>

      <div className="ex-body">
        <section className="registry-review-note" aria-label="Registry review status">
          <div><strong>Solana and Robinhood Chain coverage</strong><span>{reviewedRegistry.assets.length} issuer-linked tokens · registry v{reviewedRegistry.meta.version}</span></div>
          <p>Resource funds, company shares and equity benchmarks. Curated coverage; each mint or contract was checked on its chain&apos;s mainnet at review time. Published as the signed registry dataset; the attestation covers these bytes, not issuer claims.</p>
          <button className="ex-clear" onClick={() => { setKinds(new Set(["asset"])); setCats(new Set()); setStatuses(new Set()); setProviders(new Set()); setQuery(""); }}>Explore reviewed assets →</button>
        </section>
        <nav className="ex-views" aria-label="Catalog views">
          {[{ key: "", label: "All records", count: rows.length },
            { key: "dataset", label: "Datasets", count: kindCounts.get("dataset") ?? 0 },
            { key: "asset", label: "Tokenized assets", count: kindCounts.get("asset") ?? 0 },
            { key: "watch", label: "Watchlist", count: kindCounts.get("watch") ?? 0 }].map((view) => (
            <button key={view.key} aria-pressed={view.key ? kinds.size === 1 && kinds.has(view.key) : kinds.size === 0}
              onClick={() => { setKinds(view.key ? new Set([view.key]) : new Set()); setCats(new Set()); setStatuses(new Set()); setProviders(new Set()); bumpEpoch(); }}>
              {view.label}{" "}<span>{view.count}</span>
            </button>
          ))}
        </nav>
        <p className="ex-context">Attestations verify publication integrity, not the accuracy of source data.</p>
        <div className="ex-table-scroll" role="region" aria-label="Catalog results" tabIndex={0}>
        <table className="data catalog explore">
          <thead>
            <tr>
              {sortableTh("symbol", "Symbol")}
              {sortableTh("kind", "Type")}
              {sortableTh("category", "Category")}
              {sortableTh("chain", "Chain")}
              {sortableTh("status", "Status")}
              {sortableTh("price", "Mint / quote")}
              {sortableTh("details", "Details")}
              {sortableTh("meta", "Version")}
              <th>Trend · 52w</th>
              <th aria-hidden="true"></th>
            </tr>
          </thead>
          {pending ? (
            <tbody>
              {SKELETON_WIDTHS.map((w, i) => (
                <tr key={i} className="ex-skel-row">
                  <td>
                    <span className="cat-id">
                      <span className="ex-avatar ex-skel" />
                      <span className="ex-skel ex-skel-bar" style={{ width: w + 30 }} />
                    </span>
                  </td>
                  {[0, 1, 2, 3, 4, 5].map((c) => (
                    <td key={c}>
                      <span
                        className="ex-skel ex-skel-bar"
                        style={{ width: SKELETON_WIDTHS[(i + c + 1) % SKELETON_WIDTHS.length] }}
                      />
                    </td>
                  ))}
                  <td></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          ) : (
            <tbody key={epoch} className="ex-rows">
              {!filtered.length && !recordHits.length && (
                <tr><td colSpan={9} className="ex-empty">{plantsLoading ? "Searching asset records…" : "No matching records. Try a company, country or dataset name, or clear your filters."}</td></tr>
              )}
              {filtered.map(renderRow)}
              {recordHits.length > 0 && (
                <tr className="ex-sep">
                  <td colSpan={9}>
                    Asset records · from inside the attested datasets
                    {plantsLoading ? " · indexing plants, assets & pipelines…" : ""}
                  </td>
                </tr>
              )}
              {recordHits.map(renderRow)}
            </tbody>
          )}
        </table>
        </div>
        <div className="ex-foot mono">
          {filtered.length} results
          {recordHits.length > 0 &&
            ` · ${recordHits.length}${recordHits.length >= RECORD_HIT_CAP ? "+" : ""} asset records`}
          {plantsLoading && " · indexing plants, assets & pipelines…"}
          {" · "}
          {rows.length} in catalog
        </div>
        <div className="ex-foot mono">
          Indicative prices and 52w trends: snapshot of {prices.meta.version}{" "}
          from the attested prices dataset (Yahoo chart API, unofficial,
          delayed). Informational only, not investment advice.
        </div>
      </div>
    </div>
  );
}
