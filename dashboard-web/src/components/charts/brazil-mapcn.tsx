import * as React from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapMetric, RegionMetric } from "../../data/types";
import { buildBrazilGeoJson } from "../../data/brazil-geo";
import { formatCompactBRL, formatNumber, formatPercent } from "../../lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs } from "../ui/tabs";
import { ReadingIconButton, ReadingPanel } from "../dashboard/reading-disclosure";

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

export function BrazilMapcn({ regionStats, metric, onMetricChange, activeRegion, onRegionHover }: BrazilMapcnProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const [readingOpen, setReadingOpen] = React.useState(false);
  const data = React.useMemo(() => buildBrazilGeoJson(regionStats, metric) as GeoJSON.FeatureCollection, [regionStats, metric]);
  const metricLabel = metricTabs.find((item) => item.value === metric)?.label ?? "metrica";

  // Keep hover handler updated in a ref so map event listener doesn't trigger map recreation
  const hoverRef = React.useRef(onRegionHover);
  React.useEffect(() => {
    hoverRef.current = onRegionHover;
  }, [onRegionHover]);

  // Initialize map exactly once on mount
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
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
        dragPan: false,
        scrollZoom: false,
        boxZoom: false,
        doubleClickZoom: false,
        dragRotate: false,
      });

      map.on("load", () => {
        try {
          map.resize();
          map.fitBounds(
            [
              [-74.5, -34.5],
              [-34.5, 5.7],
            ],
            { padding: 18, duration: 0 },
          );
        } catch (err) {
          console.warn("Map fitBounds failed:", err);
        }
      });

      map.on("mousemove", "states-fill", (event) => {
        try {
          const feature = event.features?.[0];
          if (!feature?.properties) return;
          const props = feature.properties as Record<string, string | number>;
          const region = String(props.region);
          hoverRef.current(region);
          map.getCanvas().style.cursor = "pointer";
        } catch (err) {
          console.warn("Map mousemove handler failed:", err);
        }
      });

      map.on("mouseleave", "states-fill", () => {
        try {
          hoverRef.current(null);
          map.getCanvas().style.cursor = "";
        } catch (err) {
          console.warn("Map mouseleave handler failed:", err);
        }
      });

      mapRef.current = map;
    } catch (err) {
      console.error("Failed to initialize MapLibre GL Map:", err);
      return;
    }

    return () => {
      try {
        if (mapRef.current) {
          const mapToRemove = mapRef.current;
          mapRef.current = null;
          // Defer map removal to next tick to avoid synchronous unmount crashes in React StrictMode/HMR
          setTimeout(() => {
            try {
              mapToRemove.remove();
            } catch (err) {
              console.warn("Failed to remove MapLibre Map asynchronously:", err);
            }
          }, 0);
        }
      } catch (err) {
        console.warn("Failed to remove MapLibre Map:", err);
      }
    };
  }, []); // Empty dependency array ensures map is initialized only once

  // Update source data when data changes
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateSource = () => {
      try {
        const source = map.getSource("states") as maplibregl.GeoJSONSource | undefined;
        if (source) {
          source.setData(data);
        }
      } catch (err) {
        console.warn("Failed to update map data source:", err);
      }
    };

    try {
      if (map.isStyleLoaded()) {
        updateSource();
      } else {
        map.once("style.load", updateSource);
      }
    } catch (err) {
      console.warn("Failed to check style loading for data update:", err);
    }
  }, [data]);

  // Update line highlighting when activeRegion changes
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateHighlight = () => {
      try {
        if (map.getLayer("states-line")) {
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
        }
      } catch (err) {
        console.warn("Failed to update map paint properties:", err);
      }
    };

    try {
      if (map.isStyleLoaded()) {
        updateHighlight();
      } else {
        map.once("style.load", updateHighlight);
      }
    } catch (err) {
      console.warn("Failed to check style loading for highlight update:", err);
    }
  }, [activeRegion]);


  return (
    <Card className="glass-panel overflow-hidden">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Mapa regional do Brasil</CardTitle>
          <CardDescription>Estados simplificados em GeoJSON, coloridos pela metrica selecionada.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Tabs items={metricTabs} value={metric} onValueChange={(value) => onMetricChange(value as MapMetric)} />
          <ReadingIconButton
            open={readingOpen}
            ariaLabel="Ver leitura do mapa regional"
            onClick={() => setReadingOpen((current) => !current)}
          />
        </div>
      </CardHeader>
      {readingOpen ? (
        <div className="px-5 pb-3">
          <ReadingPanel
            reading={{
              sobre: `O mapa colore os estados pela metrica selecionada (${metricLabel}) e agrupa a leitura por regiao brasileira.`,
              comoAnalisar: "Use a cor para localizar concentracao geografica e passe o mouse sobre o mapa para focar o resumo da regiao ao lado.",
              insight: "Diferenca regional pequena deve ser tratada como sinal de investigacao, nao como prova de superioridade operacional.",
            }}
          />
        </div>
      ) : null}
      <CardContent className="relative pt-0">
        <div className="relative">
          <div ref={containerRef} className="h-[25rem] overflow-hidden rounded-md border border-white/10 bg-slate-950/20" />
        </div>
      </CardContent>
    </Card>
  );
}
