import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import ErrorState from "@/components/ErrorState";
import Skeleton from "@/components/Skeleton";
import { getNeeds, searchProducts } from "@/lib/api";

const FORMOSA_CENTER = [-25.5, -59.5];

function toLatLng(point) {
  if (!point?.coordinates) return null;
  const [lng, lat] = point.coordinates;
  return [lat, lng];
}

// Capa de calor genérica (leaflet.heat), igual mecanismo que usa TerritoryMap
// para el mapa de oferta público.
function HeatmapLayer({ points, gradient, radius = 32, blur = 22 }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    // Los puntos están dispersos por toda la provincia (8 localidades, no un solo barrio);
    // sin puntos superpuestos, leaflet.heat normaliza la intensidad contra `max` y cada
    // punto aislado queda casi invisible con el `max: 1` por defecto. Con pocos puntos por
    // zona, basta un `max` bajo para que cada uno se vea a pleno color.
    const heatLayer = L.heatLayer(points, {
      radius,
      blur,
      maxZoom: 17,
      max: 0.2,
      minOpacity: 0.55,
      gradient,
    }).addTo(map);
    return () => map.removeLayer(heatLayer);
  }, [map, points, gradient, radius, blur]);

  return null;
}

// Encuadra el mapa para que entre toda la provincia (las 8 localidades del catálogo),
// no solo Formosa capital: con el crecimiento de los datos, un centro/zoom fijo dejaba
// afuera la mayoría de las localidades.
function FitToPoints({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 9 });
  }, [map, points]);

  return null;
}

// Mapa de vacíos (HU-08): calor de oferta (productores con productos activos) en verde,
// calor de demanda sin cubrir (necesidades abiertas) en rojo. Reutiliza los mismos
// endpoints públicos del catálogo y del tablero de necesidades.
export default function VacancyMap() {
  const [supply, setSupply] = useState([]);
  const [demand, setDemand] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([searchProducts({ limit: 100 }), getNeeds()])
      .then(([{ items }, needs]) => {
        const byProducer = new Map();
        for (const item of items) {
          if (item.producer?.coordinates && !byProducer.has(item.producer.id)) {
            byProducer.set(item.producer.id, item.producer);
          }
        }
        setSupply([...byProducer.values()]);
        setDemand(needs.filter((n) => n.coordinates));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [retryTick]);

  const supplyPoints = useMemo(() => supply.map((p) => toLatLng(p.coordinates)), [supply]);
  const demandPoints = useMemo(() => demand.map((n) => toLatLng(n.coordinates)), [demand]);
  const allPoints = useMemo(() => [...supplyPoints, ...demandPoints], [supplyPoints, demandPoints]);

  if (loading) return <Skeleton className="h-[420px]" />;
  if (error) {
    return (
      <ErrorState
        message={`No pudimos cargar el mapa: ${error}`}
        onRetry={() => setRetryTick((t) => t + 1)}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex gap-4 border-b border-border bg-card px-4 py-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-emerald-500" /> Oferta ({supply.length})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-500" /> Necesidad sin cubrir ({demand.length})
        </span>
      </div>
      <MapContainer center={FORMOSA_CENTER} zoom={8} style={{ height: 420, width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <FitToPoints points={allPoints} />

        <HeatmapLayer
          points={supplyPoints}
          gradient={{ 0.3: "#a7f3d0", 0.6: "#10b981", 1: "#059669" }}
        />
        <HeatmapLayer
          points={demandPoints}
          gradient={{ 0.3: "#fecaca", 0.6: "#ef4444", 1: "#b91c1c" }}
        />

        {/* Marcadores chicos y translúcidos encima del calor, solo para poder ver el detalle al tocar */}
        {supply.map((producer) => (
          <CircleMarker
            key={`supply-${producer.id}`}
            center={toLatLng(producer.coordinates)}
            radius={4}
            pathOptions={{ color: "#059669", fillColor: "#10b981", fillOpacity: 0.9, weight: 1 }}
          >
            <Popup>{producer.businessName}</Popup>
          </CircleMarker>
        ))}
        {demand.map((need) => (
          <CircleMarker
            key={`demand-${need.id}`}
            center={toLatLng(need.coordinates)}
            radius={4}
            pathOptions={{ color: "#b91c1c", fillColor: "#ef4444", fillOpacity: 0.9, weight: 1 }}
          >
            <Popup>
              {need.title} — {need.quantity} {need.unit} ({need.category})
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
