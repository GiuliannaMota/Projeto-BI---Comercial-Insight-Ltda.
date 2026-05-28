import * as React from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapMetric, RegionMetric } from "../../data/types";
import { buildBrazilGeoJson } from "../../data/brazil-geo";
import { formatCompactBRL, formatNumber, formatPercent } from "../../lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs } from "../ui/tabs";

interface BrazilMapcnProps {
  regionStats: RegionMetric[];
  metric: MapMetric;
  onMetricChange: (metric: MapMetric) => void;
  activeRegion: string | null;
  onRegionHover: (region: string | null) => void;
}

const metricTabs: Array<{ value: MapMetric; label: string }> = [
  { value: "receita", label: "Receita" },
  { value: "lucro", label: "Lucro" },
  { value: "margem", label: "Margem" },
  { value: "atraso", label: "Atraso" },
];

function runWhenStyleReady(map: maplibregl.Map, callback: () => void) {
  const run = () => {
    if (!map.isStyleLoaded()) return;
    callback();
  };

  if (map.isStyleLoaded()) {
    callback();
    return () => undefined;
  }

  map.once("load", run);
  map.once("styledata", run);

  return () => {
    map.off("load", run);
    map.off("styledata", run);
  };
}

export function BrazilMapcn({ regionStats, metric, onMetricChange, activeRegion, onRegionHover }: BrazilMapcnProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const data = React.useMemo(() => buildBrazilGeoJson(regionStats, metric) as GeoJSON.FeatureCollection, [regionStats, metric]);
  const [hovered, setHovered] = React.useState<{
    x: number;
    y: number;
    region: string;
    revenue: number;
    profit: number;
    margin: number;
    delayRate: number;
    sales: number;
    width: number;
    height: number;
  } | null>(null);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          states: {
            type: "geojson",
            data,
          },
        },
        layers: [
          {
            id: "bg",
            type: "background",
            paint: { "background-color": "rgba(15, 23, 42, 0)" },
          },
          {
            id: "states-fill",
            type: "fill",
            source: "states",
            paint: {
              "fill-color": ["get", "fill"],
              "fill-opacity": 0.78,
            },
          },
          {
            id: "states-line",
            type: "line",
            source: "states",
            paint: {
              "line-color": "rgba(255,255,255,0.22)",
              "line-width": 0.9,
            },
          },
        ],
      },
      center: [-53, -14],
      zoom: 3.05,
      minZoom: 2.2,
      maxZoom: 5.8,
      attributionControl: false,
    });

    const handleLoad = () => {
      map.resize();
      map.fitBounds(
        [
          [-74.5, -34.5],
          [-34.5, 5.7],
        ],
        { padding: 18, duration: 0 },
      );
    };

    map.on("load", handleLoad);

    const handleMouseMove = (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature?.properties) return;
      const props = feature.properties as Record<string, string | number>;
      const region = String(props.region);
      onRegionHover(region);
      map.getCanvas().style.cursor = "crosshair";
      setHovered({
        x: event.point.x,
        y: event.point.y,
        region,
        revenue: Number(props.revenue),
        profit: Number(props.profit),
        margin: Number(props.margin),
        delayRate: Number(props.delayRate),
        sales: Number(props.sales),
        width: map.getCanvas().clientWidth,
        height: map.getCanvas().clientHeight,
      });
    };

    const handleMouseLeave = () => {
      onRegionHover(null);
      map.getCanvas().style.cursor = "";
      setHovered(null);
    };

    map.on("mousemove", "states-fill", handleMouseMove);
    map.on("mouseleave", "states-fill", handleMouseLeave);

    mapRef.current = map;
    return () => {
      map.off("load", handleLoad);
      map.off("mousemove", "states-fill", handleMouseMove);
      map.off("mouseleave", "states-fill", handleMouseLeave);
      map.remove();
      mapRef.current = null;
    };
  }, [onRegionHover]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    return runWhenStyleReady(map, () => {
      const source = map.getSource("states") as maplibregl.GeoJSONSource | undefined;
      if (source) source.setData(data);
    });
  }, [data]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    return runWhenStyleReady(map, () => {
      if (!map.getLayer("states-line")) return;

      map.setPaintProperty("states-line", "line-color", [
        "case",
        ["==", ["get", "region"], activeRegion ?? ""],
        "#f8fafc",
        "rgba(255,255,255,0.24)",
      ]);
      map.setPaintProperty("states-line", "line-width", [
        "case",
        ["==", ["get", "region"], activeRegion ?? ""],
        2.6,
        0.9,
      ]);
    });
  }, [activeRegion]);

  const tooltipStyle = hovered
    ? {
        left: Math.max(8, Math.min(hovered.x + 18, hovered.width - 272)),
        top: Math.max(8, Math.min(hovered.y - 18, hovered.height - 188)),
      }
    : undefined;

  return (
    <Card className="glass-panel overflow-hidden">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Mapa regional do Brasil</CardTitle>
          <CardDescription>Estados simplificados em GeoJSON, coloridos pela metrica selecionada.</CardDescription>
        </div>
        <Tabs items={metricTabs} value={metric} onValueChange={(value) => onMetricChange(value as MapMetric)} />
      </CardHeader>
      <CardContent className="relative pt-0">
        <div className="relative">
          <div ref={containerRef} className="h-[25rem] overflow-hidden rounded-md border border-white/10 bg-slate-950/20" />
          {hovered ? (
            <div
              className="pointer-events-none absolute z-20 w-64 rounded-md border border-white/14 bg-[#080c14] p-3.5 text-xs shadow-2xl"
              style={tooltipStyle}
            >
              <div className="border-b border-white/10 pb-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Regiao</p>
                <p className="mt-1 text-sm font-semibold text-white">{hovered.region}</p>
              </div>
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-[5.5rem_1fr] gap-3">
                  <span className="text-slate-300">Vendas</span>
                  <span className="metric-number text-right font-semibold text-white">{formatNumber(hovered.sales)}</span>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-3">
                  <span className="text-slate-300">Receita</span>
                  <span className="metric-number text-right font-semibold text-violet-100">{formatCompactBRL(hovered.revenue)}</span>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-3">
                  <span className="text-slate-300">Lucro</span>
                  <span className="metric-number text-right font-semibold text-lime-signal">{formatCompactBRL(hovered.profit)}</span>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-3">
                  <span className="text-slate-300">Margem</span>
                  <span className="metric-number text-right font-semibold text-white">{formatPercent(hovered.margin)}</span>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-3">
                  <span className="text-slate-300">Atraso</span>
                  <span className="metric-number text-right font-semibold text-red-100">{formatPercent(hovered.delayRate)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
