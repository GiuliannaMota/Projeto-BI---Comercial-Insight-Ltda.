import type { Feature, FeatureCollection, Geometry } from "geojson";
import brazilRegions from "./brazil-regions-ibge.json";
import type { MapMetric, RegionMetric } from "./types";

type BrazilRegionFeature = Feature<
  Geometry,
  {
    codarea?: string;
    regionCode: string;
    region: string;
    fill?: string;
    revenue?: number;
    profit?: number;
    margin?: number;
    delayRate?: number;
    sales?: number;
  }
>;

const ibgeRegions = brazilRegions as FeatureCollection<
  Geometry,
  {
    codarea?: string;
    regionCode: string;
    region: string;
  }
>;

const baseRegionColors: Record<string, string> = {
  Norte: "#7c5cff",
  Nordeste: "#9b7cf6",
  "Centro-Oeste": "#d14f60",
  Sudeste: "#b5e24a",
  Sul: "#7dbb42",
};

function normalizedColor(value: number, min: number, max: number, metric: MapMetric) {
  const ratio = max === min ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const bucket = Math.round(ratio * 20); // 20 buckets = 5 percentage points each.
  const palettes: Record<MapMetric, { hue: number; saturation: number; lightest: number; darkest: number }> = {
    receita: { hue: 260, saturation: 54, lightest: 76, darkest: 30 },
    lucro: { hue: 83, saturation: 72, lightest: 76, darkest: 28 },
    margem: { hue: 150, saturation: 58, lightest: 74, darkest: 28 },
    atraso: { hue: 356, saturation: 72, lightest: 78, darkest: 30 },
  };
  const palette = palettes[metric];
  const light = palette.lightest - ((palette.lightest - palette.darkest) * bucket) / 20;

  return `hsl(${palette.hue} ${palette.saturation}% ${light}%)`;
}

function metricValue(metric: RegionMetric | undefined, selected: MapMetric) {
  if (!metric) return 0;
  if (selected === "receita") return metric.revenue;
  if (selected === "lucro") return metric.profit;
  if (selected === "margem") return metric.margin;
  return metric.delayRate;
}

export function buildBrazilGeoJson(regionStats: RegionMetric[], selectedMetric: MapMetric): FeatureCollection {
  const values = regionStats.map((region) => metricValue(region, selectedMetric));
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;

  const features: BrazilRegionFeature[] = ibgeRegions.features.map((feature) => {
    const region = feature.properties.region;
    const metric = regionStats.find((item) => item.region === region);
    const value = metricValue(metric, selectedMetric);
    const fill = metric ? normalizedColor(value, min, max, selectedMetric) : baseRegionColors[region];

    return {
      type: "Feature",
      geometry: feature.geometry,
      properties: {
        ...feature.properties,
        fill,
        revenue: metric?.revenue ?? 0,
        profit: metric?.profit ?? 0,
        margin: metric?.margin ?? 0,
        delayRate: metric?.delayRate ?? 0,
        sales: metric?.sales ?? 0,
      },
    };
  });

  return {
    type: "FeatureCollection",
    features,
  };
}
