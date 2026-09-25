import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import { ExternalLink, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

// El mapa se monta dentro del Dialog mientras corre su animación de apertura:
// Leaflet mide el contenedor antes de que tenga su tamaño final y deja tiles grises.
function FixSizeOnOpen() {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(timeout);
  }, [map]);
  return null;
}

// coordinates: GeoJSON Point ({ type: "Point", coordinates: [lng, lat] }), como lo devuelve la API.
export default function ProducerLocationMap({ coordinates, label }) {
  if (!coordinates?.coordinates) return null;
  const [lng, lat] = coordinates.coordinates;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 font-medium">
        <MapPin className="size-4 text-primary" />
        {label ? `Se vende en ${label}` : "Dónde se vende"}
      </p>
      <div className="relative isolate h-48 overflow-hidden rounded-lg border border-border">
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          className="size-full"
          zoomControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          keyboard={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <CircleMarker
            center={[lat, lng]}
            radius={10}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2e7d32", fillOpacity: 1 }}
          />
          <FixSizeOnOpen />
        </MapContainer>
        {/* Capa encima del mapa (Leaflet usa z-index hasta 1000; `isolate` los encierra acá) para que todo el mapa sea el link */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir la ubicación en Google Maps"
          className="group absolute inset-0 z-[1001] flex items-end justify-end p-2"
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-3 py-1 text-xs font-semibold text-primary shadow-sm transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <ExternalLink className="size-3" />
            Abrir en Google Maps
          </span>
        </a>
      </div>
      <p className="text-xs text-muted-foreground">
        &copy; colaboradores de OpenStreetMap
      </p>
    </div>
  );
}
