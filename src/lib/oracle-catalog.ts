import { DATASETS, datasetHashes } from "@/lib/attest";
import eia from "@/data/eia.json";
import spots from "@/data/spots.json";
import jodi from "@/data/jodi.json";
import minerals from "@/data/minerals.json";
import electricity from "@/data/electricity.json";

/**
 * Presentation metadata for the oracle explorer. The signed datasets stay
 * untouched; this module only shapes what the catalog and detail pages show.
 */

interface DatasetMetaBlock {
  id: string;
  title: string;
  unit?: string;
  note?: string;
  description?: string;
  cadence?: string;
  sources?: string[];
  license?: string;
  version: string;
}

interface EiaSeries {
  id: string;
  unit: string;
  points: Array<{ period: string; value: number }>;
}

const count = (id: string, key: string): number =>
  ((DATASETS[id].data as Record<string, unknown>)[key] as unknown[]).length;

const DISPLAY: Record<
  string,
  {
    category: string;
    color: string;
    recordsKey: string | null;
    recordsNoun: string;
    schedule?: string;
  }
> = {
  reserves: { category: "Crude reserves", color: "#5e8ba6", recordsKey: "countries", recordsNoun: "countries" },
  fields: { category: "Upstream assets", color: "#e8a33d", recordsKey: "fields", recordsNoun: "fields" },
  tokenized: { category: "RWA registry", color: "#cbc3b1", recordsKey: "assets", recordsNoun: "assets" },
  registry: {
    category: "Tokenization registry",
    color: "#8fb4c9",
    recordsKey: "assets",
    recordsNoun: "reviewed tokens",
    schedule: "issuer lists re-reviewed on change · mint and contract checks dated per record",
  },
  market: { category: "Market structure", color: "#8fb4c9", recordsKey: null, recordsNoun: "sample series" },
  sites: { category: "Minerals & nuclear", color: "#b26a4e", recordsKey: "sites", recordsNoun: "sites" },
  plants: { category: "Power infrastructure", color: "#5fd4ae", recordsKey: "plants", recordsNoun: "plants" },
  pipelines: { category: "Midstream", color: "#c67c1b", recordsKey: "pipelines", recordsNoun: "pipelines" },
  spots: {
    category: "Spot prices",
    color: "#4fae8d",
    recordsKey: null,
    recordsNoun: "series",
    schedule: "EIA daily spot series · ingested with the weekly EIA run",
  },
  eia: {
    category: "Weekly fundamentals",
    color: "#3e90cb",
    recordsKey: null,
    recordsNoun: "series",
    schedule: "WPSR release Wednesdays ~10:30 ET · ingested Wed 21:30 UTC (Fri catch-up)",
  },
  prices: {
    category: "Indicative prices",
    color: "#c4a469",
    recordsKey: "prices",
    recordsNoun: "quotes",
    schedule: "snapshot on ingest · every snapshot re-signed and re-anchored",
  },
  goget: {
    category: "Extraction assets",
    color: "#e8873c",
    recordsKey: "assets",
    recordsNoun: "assets",
    schedule: "GEM tracker releases, roughly twice yearly",
  },
  goit: {
    category: "Oil pipelines",
    color: "#b5773a",
    recordsKey: "pipelines",
    recordsNoun: "pipeline units",
    schedule: "GEM tracker releases, roughly twice yearly",
  },
  jodi: {
    category: "Country balances",
    color: "#4a9db5",
    recordsKey: "countries",
    recordsNoun: "countries",
    schedule: "JODI monthly update ~20th · re-ingested on release",
  },
  noc: {
    category: "NOC indicators",
    color: "#9b8ec4",
    recordsKey: "companies",
    recordsNoun: "national oil companies",
    schedule: "NRGI database revisions",
  },
  minerals: {
    category: "Minerals statistics",
    color: "#b26a4e",
    recordsKey: "rows",
    recordsNoun: "observations",
    schedule: "USGS MCS release, annually (~February)",
  },
  electricity: {
    category: "Power generation",
    color: "#5fd4ae",
    recordsKey: "areas",
    recordsNoun: "areas",
    schedule: "Ember yearly release + in-year revisions",
  },
};

const SERIES_LABELS: Record<string, string> = {
  crude_stocks: "Commercial crude stocks",
  spr_stocks: "Strategic Petroleum Reserve",
  crude_production: "Field production",
  refiner_inputs: "Refiner net inputs",
  refinery_utilization: "Refinery utilization",
  crude_imports: "Crude imports",
  gasoline_stocks: "Gasoline stocks",
  distillate_stocks: "Distillate stocks",
};

function metaOf(id: string): DatasetMetaBlock {
  return (DATASETS[id].data as { meta: DatasetMetaBlock }).meta;
}

function recordsLabel(id: string): string {
  const d = DISPLAY[id];
  if (id === "spots") {
    const s = (spots as { series: EiaSeries[] }).series;
    return `${s.length} series · ${s[0]?.points.length ?? 0} trading days`;
  }
  if (id === "eia") {
    const s = (eia as { series: EiaSeries[] }).series;
    return `${s.length} series · ${s[0]?.points.length ?? 0} weeks`;
  }
  if (id === "jodi") {
    return `${jodi.countries.length} countries · ${jodi.flows.length} monthly flows`;
  }
  if (id === "minerals") {
    return `${minerals.rows.length.toLocaleString("en-US")} observations · 84 commodities`;
  }
  if (id === "electricity") {
    return `${electricity.areas.length} areas · ${electricity.fuels.length} fuels, yearly`;
  }
  if (id === "market") return "3 sample series";
  if (!d.recordsKey) return "—";
  return `${count(id, d.recordsKey).toLocaleString("en-US")} ${d.recordsNoun}`;
}

/** Headline JODI chart series: crude production of the largest producers. */
function jodiTopProduction(n: number) {
  type Pt = [string, number];
  // JSON tuples import as (string | number)[][]; go through unknown.
  const producers = (jodi.countries as unknown as Array<{ code: string; name: string; series: Record<string, Pt[]> }>)
    .map((c) => ({ ...c, prod: c.series.INDPROD }))
    .filter((c): c is typeof c & { prod: Pt[] } => !!c.prod && c.prod.length > 12)
    .sort((a, b) => b.prod[b.prod.length - 1][1] - a.prod[a.prod.length - 1][1])
    .slice(0, n);
  return producers.map((c) => ({
    id: `prod_${c.code}`,
    label: c.name,
    unit: "kb/d",
    // lightweight-charts wants full dates; JODI periods are YYYY-MM.
    points: c.prod.map(([time, value]) => ({ time: `${time}-01`, value })),
  }));
}

const FUEL_LABELS: Record<string, string> = {
  total: "Total generation",
  coal: "Coal",
  gas: "Gas",
  other_fossil: "Other fossil",
  nuclear: "Nuclear",
  hydro: "Hydro",
  wind: "Wind",
  solar: "Solar",
  bioenergy: "Bioenergy",
  other_renewables: "Other renewables",
};

/** Headline electricity chart series: world generation per fuel. */
function electricityWorldSeries() {
  const world = (
    electricity.areas as unknown as Array<{
      code: string;
      series: Record<string, Array<[number, number]>>;
    }>
  ).find((a) => a.code === "WLD");
  if (!world) return [];
  return (electricity.fuels as string[])
    .filter((f) => world.series[f]?.length)
    .map((f) => ({
      id: `gen_${f}`,
      label: FUEL_LABELS[f] ?? f,
      unit: "TWh",
      points: world.series[f].map(([year, value]) => ({
        time: `${year}-12-31`,
        value,
      })),
    }));
}

export interface CatalogRow {
  id: string;
  title: string;
  category: string;
  color: string;
  records: string;
  version: string;
  updated: string;
  timeseries: boolean;
  spark: number[] | null;
}

export function catalogRows(): CatalogRow[] {
  return datasetHashes().map(({ id, title, version }) => {
    const timeseries = id === "eia" || id === "jodi" || id === "electricity";
    let spark: number[] | null = null;
    if (id === "eia") {
      const crude = (eia as { series: EiaSeries[] }).series.find(
        (s) => s.id === "crude_stocks"
      );
      spark = crude ? crude.points.slice(-52).map((p) => p.value) : null;
    } else if (id === "jodi") {
      const top = jodiTopProduction(1)[0];
      spark = top ? top.points.slice(-36).map((p) => p.value) : null;
    } else if (id === "electricity") {
      const total = electricityWorldSeries().find((s) => s.id === "gen_total");
      spark = total ? total.points.map((p) => p.value) : null;
    }
    return {
      id,
      title,
      category: DISPLAY[id]?.category ?? "Dataset",
      color: DISPLAY[id]?.color ?? "#7e97a6",
      records: recordsLabel(id),
      version,
      updated:
        id === "eia"
          ? `week of ${version}`
          : id === "jodi"
            ? `month of ${version}`
            : id === "electricity"
              ? `data year ${version}`
              : `registry v${version}`,
      timeseries,
      spark,
    };
  });
}

export interface DatasetDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  cadence: string;
  schedule: string | null;
  sources: string[];
  license: string | null;
  unit: string | null;
  version: string;
  records: string;
  sha256: string;
  timeseries: boolean;
  series: Array<{
    id: string;
    label: string;
    unit: string;
    points: Array<{ time: string; value: number }>;
  }> | null;
}

export function datasetIds(): string[] {
  return Object.keys(DATASETS);
}

export function datasetDetail(id: string): DatasetDetail | null {
  if (!DATASETS[id]) return null;
  const meta = metaOf(id);
  const hash = datasetHashes().find((h) => h.id === id)!;
  const timeseries = id === "eia" || id === "jodi" || id === "electricity";
  let series: DatasetDetail["series"] = null;
  if (id === "eia") {
    series = (eia as { series: EiaSeries[] }).series.map((s) => ({
      id: s.id,
      label: SERIES_LABELS[s.id] ?? s.id,
      unit: s.unit,
      points: s.points.map((p) => ({ time: p.period, value: p.value })),
    }));
  } else if (id === "jodi") {
    series = jodiTopProduction(8);
  } else if (id === "electricity") {
    series = electricityWorldSeries();
  }
  return {
    id,
    title: DATASETS[id].title,
    description: meta.description ?? meta.note ?? "",
    category: DISPLAY[id]?.category ?? "Dataset",
    cadence: meta.cadence ?? "static registry · updated on revision",
    schedule: DISPLAY[id]?.schedule ?? null,
    sources: meta.sources ?? [],
    license: meta.license ?? null,
    unit: meta.unit ?? null,
    version: hash.version,
    records: recordsLabel(id),
    sha256: hash.sha256,
    timeseries,
    series,
  };
}
