import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

// Rampa secuencial de un solo tono (naranja, claro → oscuro): más oscuro = más demanda.
// No se usa el arcoíris por defecto de leaflet.heat, que sugiere categorías que no existen.
const DEMAND_GRADIENT = {
  0.2: "#fed7aa",
  0.45: "#fb923c",
  0.7: "#ea580c",
  1: "#9a3412",
};

// Vista inicial: toda la provincia de Formosa
const PROVINCE_CENTER = [-25.3, -59.5];
const PROVINCE_ZOOM = 7;

// Leaflet mide el contenedor al montarse, antes de que el layout de la página termine:
// se vuelve a medir, se encuadra y recién ahí se dibuja el calor (si no, queda corrido y vacío).
function HeatLayer({ cells }) {
  const map = useMap();

  useEffect(() => {
    let layer = null;
    const timeout = setTimeout(() => {
      map.invalidateSize();
      if (!cells.length) return;
      map.fitBounds(L.latLngBounds(cells.map(([lat, lng]) => [lat, lng])), {
        padding: [40, 40],
        maxZoom: 10,
        animate: false,
      });
      layer = L.heatLayer(cells, {
        radius: 40,
        blur: 25,
        // Con la mitad del máximo, las celdas más fuertes llegan al tono más oscuro
        max: Math.max(...cells.map((c) => c[2])) * 0.5,
        minOpacity: 0.45,
        gradient: DEMAND_GRADIENT,
      }).addTo(map);
    }, 150);

    return () => {
      clearTimeout(timeout);
      if (layer) map.removeLayer(layer);
    };
  }, [map, cells]);

  return null;
}

export function DemandLegend() {
  const stops = Object.entries(DEMAND_GRADIENT)
    .map(([stop, color]) => `${color} ${Number(stop) * 100}%`)
    .join(", ");
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Menos demanda</span>
      <span
        className="h-2 w-28 rounded-full"
        style={{ background: `linear-gradient(to right, #fed7aa 0%, ${stops})` }}
      />
      <span>Más demanda</span>
    </div>
  );
}

// cells: [lat, lng, peso][] (agregado por celdas de ~2 km en el backend)
// producers: opcional, [{ id, businessName, lat, lng }] para ver la oferta encima de la demanda
export default function DemandHeatMap({ cells, producers = [], className = "h-80" }) {
  return (
    <div className={`relative isolate overflow-hidden rounded-lg border border-border ${className}`}>
      <MapContainer center={PROVINCE_CENTER} zoom={PROVINCE_ZOOM} scrollWheelZoom={false} className="size-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <HeatLayer cells={cells} />
        {producers.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={6}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#2e7d32", fillOpacity: 1 }}
          >
            <Tooltip>{p.businessName}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      {cells.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
          <span className="rounded-full bg-card/95 px-4 py-2 text-sm text-muted-foreground shadow-sm">
            Todavía no hay señales de demanda en este período
          </span>
        </div>
      )}
    </div>
  );
}
