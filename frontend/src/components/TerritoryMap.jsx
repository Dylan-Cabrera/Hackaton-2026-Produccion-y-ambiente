import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import "./TerritoryMap.css";
import { getProducers } from "@/lib/api";

const DEMAND_URL = "http://localhost:3000/api/products/demand-heatmap";

// Colores por categoría, para diferenciar los pines en el mapa
const CATEGORY_COLORS = {
  "Frutihortícola": "#639922",
  "Conservas/Dulces": "#D85A30",
  "Apicultura": "#BA7517",
  "Artesanías/Textil": "#D4537E",
  "Otros": "#5F5E5A",
};

const CATEGORIES = ["Todos", ...Object.keys(CATEGORY_COLORS)];

// Convierte [lng, lat] (formato GeoJSON del backend) a [lat, lng] (formato que espera Leaflet)
function toLatLng(coordinates) {
  const [lng, lat] = coordinates.coordinates;
  return [lat, lng];
}

// Crea un ícono de color distinto según la categoría del productor
function createIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div class="producer-marker" style="background:${color}; width:22px; height:22px;"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

// Heatmap genérico: recibe los puntos y los colores del degradado, y se encarga
// de dibujar la capa y limpiarla cuando cambian los datos. Lo reutilizamos para
// oferta y demanda, cambiando solo qué puntos y qué colores le pasamos.
function HeatmapLayer({ points, gradient }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const heatLayer = L.heatLayer(points, {
      radius: 60,
      blur: 40,
      maxZoom: 17,
      gradient,
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, gradient]);

  return null;
}

export default function TerritoryMap() {
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // "oferta" o "demanda": qué heatmap se está mostrando en el mapa
  const [mode, setMode] = useState("oferta");
  const [demandQuery, setDemandQuery] = useState("");
  const [demandPoints, setDemandPoints] = useState([]);
  const [demandSearched, setDemandSearched] = useState(false);

  useEffect(() => {
    getProducers()
      .then((data) => {
        setProducers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  function handleDemandSearch(e) {
    e.preventDefault();
    if (!demandQuery.trim()) return;

    fetch(`${DEMAND_URL}?q=${encodeURIComponent(demandQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        setDemandPoints(data.points);
        setDemandSearched(true);
      });
  }

  if (loading) {
    return (
      <div className="map-card">
        <div className="map-status">Cargando productores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-card">
        <div className="map-status is-error">Error al cargar los datos: {error}</div>
      </div>
    );
  }

  const filteredProducers =
    selectedCategory === "Todos"
      ? producers
      : producers.filter((p) => p.category === selectedCategory);

  const offerPoints = filteredProducers.map((p) => toLatLng(p.coordinates));

  return (
    <div className="map-card">
      <div className="mode-toggle">
        <button
          type="button"
          className={`mode-button ${mode === "oferta" ? "active" : ""}`}
          onClick={() => setMode("oferta")}
        >
          Oferta
        </button>
        <button
          type="button"
          className={`mode-button ${mode === "demanda" ? "active" : ""}`}
          onClick={() => setMode("demanda")}
        >
          Demanda
        </button>
      </div>

      {mode === "oferta" && (
        <div className="map-legend">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={`legend-item legend-button ${selectedCategory === category ? "active" : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category !== "Todos" && (
                <span className="legend-dot" style={{ background: CATEGORY_COLORS[category] }} />
              )}
              {category}
            </button>
          ))}
        </div>
      )}

      {mode === "demanda" && (
        <form onSubmit={handleDemandSearch} className="demand-form">
          <input
            type="text"
            value={demandQuery}
            onChange={(e) => setDemandQuery(e.target.value)}
            placeholder="Ej: pescado, miel, queso..."
          />
          <button type="submit">Ver demanda</button>
        </form>
      )}

      {mode === "demanda" && demandSearched && demandPoints.length === 0 && (
        <p className="demand-empty">No hay búsquedas registradas para "{demandQuery}" todavía.</p>
      )}

      <MapContainer center={[-26.1849, -58.1731]} zoom={14}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {mode === "oferta" && (
          <>
            <HeatmapLayer points={offerPoints} />
            {filteredProducers.map((producer) => (
              <Marker
                key={producer.id}
                position={toLatLng(producer.coordinates)}
                icon={createIcon(CATEGORY_COLORS[producer.category] || "#5F5E5A")}
              >
                <Popup className="producer-popup">
                  <div
                    className="popup-content"
                    style={{ "--popup-color": CATEGORY_COLORS[producer.category] || "#5F5E5A" }}
                  >
                    <strong>{producer.businessName}</strong>
                    <span>{producer.category}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {mode === "demanda" && demandPoints.length > 0 && (
          <HeatmapLayer
            points={demandPoints}
            gradient={{ 0.4: "yellow", 0.7: "orange", 1: "red" }}
          />
        )}
      </MapContainer>
    </div>
  );
}
