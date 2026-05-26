import { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Loader2 } from 'lucide-react';

interface RegionStats {
  name: string;
  vendas: number;
  receita: number;
}

interface BrazilMapcnProps {
  regionStats: RegionStats[];
  onRegionDblClick: (regionName: string) => void;
  selectedRegion?: string;
}

// Mapeamento de Estados para Regiões do Brasil
const stateToRegion: Record<string, string> = {
  AC: 'Norte', AM: 'Norte', AP: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste', PE: 'Nordeste', PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MS: 'Centro-Oeste', MT: 'Centro-Oeste',
  ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste',
  PR: 'Sul', RS: 'Sul', SC: 'Sul'
};

// Cores da escala para preencher as regiões (Base: Clean Tech - Verde e Azul Escuro)
// Ajustado para bater exatamente com a legenda
function getColorForSales(salesCount: number, maxSales: number) {
  if (salesCount === 0) return '#f1f5f9'; // Cinza claro
  const ratio = salesCount / (maxSales || 1);
  if (ratio <= 0.2) return '#e2f5ec'; // Menta bem claro
  if (ratio <= 0.45) return '#a7ebd0'; // Verde menta claro
  if (ratio <= 0.7) return '#47cfa2';  // Verde médio
  if (ratio <= 0.9) return '#10b981';  // Emerald
  return '#0f172a'; // Azul Escuro / Slate
}

export default function BrazilMapcn({ regionStats, onRegionDblClick, selectedRegion }: BrazilMapcnProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const geojsonRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Estatísticas das regiões indexadas por nome
  const statsMap = useMemo(() => {
    const map = new Map<string, RegionStats>();
    regionStats.forEach(stat => map.set(stat.name, stat));
    return map;
  }, [regionStats]);

  const maxSales = useMemo(() => {
    return Math.max(...regionStats.map(s => s.vendas), 1);
  }, [regionStats]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;
    let map: maplibregl.Map | null = null;

    // Buscar o GeoJSON das divisões do Brasil
    fetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson')
      .then(res => {
        if (!res.ok) throw new Error('Não foi possível carregar os limites do mapa.');
        return res.json();
      })
      .then(geojson => {
        if (!isMounted) return;

        // Adicionar um ID numérico único no nível de Feature (essencial para o state de hover do MapLibre)
        const processedFeatures = geojson.features.map((feature: any, index: number) => {
          const stateSiglaRaw = feature.properties.sigla || feature.properties.state;
          const stateSigla = typeof stateSiglaRaw === 'string' ? stateSiglaRaw.toUpperCase().trim() : '';
          const region = stateToRegion[stateSigla] || 'Outros';
          
          return {
            ...feature,
            id: index + 1, // Atribui ID numérico no nível de feature
            properties: {
              ...feature.properties,
              region,
              vendas: 0,
              receita: 0,
              color: '#f1f5f9'
            }
          };
        });

        // Salvar cópia do GeoJSON base com os IDs
        geojsonRef.current = {
          ...geojson,
          features: processedFeatures
        };

        // Configuração do MapLibre GL
        map = new maplibregl.Map({
          container: mapContainerRef.current!,
          style: {
            version: 8,
            sources: {},
            layers: [
              {
                id: 'background',
                type: 'background',
                paint: {
                  'background-color': '#f8fafc' // Slate 50
                }
              }
            ]
          },
          center: [-54, -15],
          zoom: 3.6,
          minZoom: 2,
          maxZoom: 6,
          doubleClickZoom: false
        });

        mapRef.current = map;

        map.on('load', () => {
          if (!isMounted || !map) return;

          setLoading(false);

          // Adicionar fonte geojson processada
          map.addSource('brazil-states', {
            type: 'geojson',
            data: geojsonRef.current
          });

          // 1. Layer de preenchimento por cor da região
          map.addLayer({
            id: 'states-fill',
            type: 'fill',
            source: 'brazil-states',
            paint: {
              'fill-color': ['get', 'color'],
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.95,
                0.75
              ]
            }
          });

          // 2. Layer de bordas
          map.addLayer({
            id: 'states-borders',
            type: 'line',
            source: 'brazil-states',
            paint: {
              'line-color': '#ffffff',
              'line-width': 1
            }
          });

          // 3. Destacar as bordas da região sob hover
          map.addLayer({
            id: 'states-borders-hover',
            type: 'line',
            source: 'brazil-states',
            paint: {
              'line-color': '#0f172a',
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                2.5,
                0
              ]
            }
          });

          let hoveredStateId: any = null;

          // Mouse move
          map.on('mousemove', 'states-fill', (e) => {
            if (e.features && e.features.length > 0) {
              const currentFeature = e.features[0];
              const regionName = currentFeature.properties?.region;
              setHoveredRegion(regionName);

              // Limpar hover anterior
              if (hoveredStateId !== null) {
                geojsonRef.current.features.forEach((f: any) => {
                  map?.setFeatureState(
                    { source: 'brazil-states', id: f.id },
                    { hover: false }
                  );
                });
              }

              // Ativar hover para todos os estados da região sob cursor
              const featuresInRegion = geojsonRef.current.features.filter((f: any) => f.properties.region === regionName);
              featuresInRegion.forEach((f: any) => {
                map?.setFeatureState(
                  { source: 'brazil-states', id: f.id },
                  { hover: true }
                );
              });
              
              hoveredStateId = currentFeature.id;
            }
          });

          // Mouse leave
          map.on('mouseleave', 'states-fill', () => {
            setHoveredRegion(null);
            if (hoveredStateId !== null) {
              geojsonRef.current.features.forEach((f: any) => {
                map?.setFeatureState(
                  { source: 'brazil-states', id: f.id },
                  { hover: false }
                );
              });
              hoveredStateId = null;
            }
          });

          // Evento de duplo clique
          map.on('dblclick', 'states-fill', (e) => {
            if (e.features && e.features.length > 0) {
              const regionName = e.features[0].properties?.region;
              if (regionName) {
                onRegionDblClick(regionName);
              }
            }
          });
        });
      })
      .catch(err => {
        console.error(err);
        if (isMounted) {
          setError('Erro de conexão ao carregar o mapa. Verifique seu acesso à internet.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (map) {
        map.remove();
      }
    };
  }, [onRegionDblClick]);

  // Atualizar as cores e os dados quando as estatísticas mudarem (sem refazer requisição de rede)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || loading || error || !geojsonRef.current) return;

    const source = map.getSource('brazil-states') as maplibregl.GeoJSONSource;
    if (!source) return;

    // Atualizar as propriedades do GeoJSON local baseados nos dados dinâmicos do pai
    const updatedFeatures = geojsonRef.current.features.map((feature: any) => {
      const stateSiglaRaw = feature.properties.sigla || feature.properties.state;
      const stateSigla = typeof stateSiglaRaw === 'string' ? stateSiglaRaw.toUpperCase().trim() : '';
      const region = stateToRegion[stateSigla] || 'Outros';
      const stats = statsMap.get(region) || { name: region, vendas: 0, receita: 0 };
      
      return {
        ...feature,
        properties: {
          ...feature.properties,
          region,
          vendas: stats.vendas,
          receita: stats.receita,
          color: getColorForSales(stats.vendas, maxSales)
        }
      };
    });

    geojsonRef.current = {
      ...geojsonRef.current,
      features: updatedFeatures
    };

    source.setData(geojsonRef.current);
  }, [regionStats, statsMap, maxSales, loading, error]);

  const activeHoverStats = useMemo(() => {
    if (!hoveredRegion) return null;
    return statsMap.get(hoveredRegion) || { name: hoveredRegion, vendas: 0, receita: 0 };
  }, [hoveredRegion, statsMap]);

  return (
    <div className="relative border border-border rounded-md bg-card overflow-hidden h-[460px] flex flex-col">
      {/* Indicador de Carregamento */}
      {loading && (
        <div className="absolute inset-0 bg-card/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Carregando mapa interativo...</span>
        </div>
      )}

      {/* Exibição de Erro */}
      {error && (
        <div className="absolute inset-0 bg-card flex flex-col items-center justify-center gap-3 z-10 px-4 text-center">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-3 py-1.5 text-xs bg-primary text-white rounded-md font-medium cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Título do Mapa */}
      <div className="p-3 border-b border-border bg-slate-50 flex items-center justify-between z-10">
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Densidade de Vendas por Região</h4>
          <p className="text-[10px] text-muted-foreground">Dê dois cliques em uma região para ver o detalhamento de cidades</p>
        </div>
        {selectedRegion && (
          <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
            Filtro ativo: {selectedRegion}
          </span>
        )}
      </div>

      {/* Container do Mapa */}
      <div ref={mapContainerRef} className="flex-1 w-full" />

      {/* Info Flutuante no Hover */}
      {hoveredRegion && activeHoverStats && (
        <div className="absolute bottom-3 left-3 z-10 bg-card border border-border rounded-md p-3 shadow-md fade-in min-w-[200px]">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Região {hoveredRegion}</span>
          <strong className="block text-sm font-bold text-foreground mt-0.5">{activeHoverStats.vendas} vendas</strong>
          <div className="mt-1.5 pt-1.5 border-t border-border flex justify-between text-xs text-muted-foreground">
            <span>Faturamento:</span>
            <span className="font-semibold text-foreground">
              {activeHoverStats.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}

      {/* Legenda de Cores do Mapa */}
      <div className="absolute bottom-3 right-3 z-10 bg-card/90 backdrop-blur-xs border border-border rounded-md p-2 flex flex-col gap-1.5 text-[9px] text-muted-foreground">
        <span className="font-semibold text-foreground text-center">Volume de Vendas</span>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-[2px]">
            <div className="w-[10px] h-[10px] rounded-xs" style={{ backgroundColor: '#e2f5ec' }} />
            <div className="w-[10px] h-[10px] rounded-xs" style={{ backgroundColor: '#a7ebd0' }} />
            <div className="w-[10px] h-[10px] rounded-xs" style={{ backgroundColor: '#47cfa2' }} />
            <div className="w-[10px] h-[10px] rounded-xs" style={{ backgroundColor: '#10b981' }} />
            <div className="w-[10px] h-[10px] rounded-xs" style={{ backgroundColor: '#0f172a' }} />
          </div>
          <div className="flex justify-between w-full">
            <span>Menor</span>
            <span className="ml-2">Maior</span>
          </div>
        </div>
      </div>
    </div>
  );
}
