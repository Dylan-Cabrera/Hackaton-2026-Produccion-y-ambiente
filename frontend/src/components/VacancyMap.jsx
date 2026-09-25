import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ErrorState from "@/components/ErrorState";
import Skeleton from "@/components/Skeleton";
import { getNeeds, searchProducts } from "@/lib/api";

function toLatLng(point) {
  if (!point?.coordinates) return null;
  const [lng, lat] = point.coordinates;
  return [lat, lng];
}

// Mapa de vacíos (HU-08): oferta (productores con productos activos) en verde,
// demanda sin cubrir (necesidades abiertas) en rojo. Reutiliza los mismos
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
        setDemand(needs.filter((n) => n.author?.coordinates));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [retryTick]);

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
      <MapContainer center={[-26.1849, -58.1731]} zoom={12} style={{ height: 420, width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {supply.map((producer) => (
          <CircleMarker
            key={`supply-${producer.id}`}
            center={toLatLng(producer.coordinates)}
            radius={7}
            pathOptions={{ color: "#059669", fillColor: "#10b981", fillOpacity: 0.8 }}
          >
            <Popup>{producer.businessName}</Popup>
          </CircleMarker>
        ))}
        {demand.map((need) => (
          <CircleMarker
            key={`demand-${need.id}`}
            center={toLatLng(need.author.coordinates)}
            radius={7}
            pathOptions={{ color: "#dc2626", fillColor: "#ef4444", fillOpacity: 0.8 }}
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
