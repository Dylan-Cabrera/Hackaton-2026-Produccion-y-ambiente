import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import "./TerritoryMap.css";
import { DemandLegend } from "@/components/DemandHeatMap";
import { useMeta } from "@/hooks/useMeta";
import { getDemandHeat, searchProducts } from "@/lib/api";

// Rampa de un solo tono para la demanda (igual que DemandHeatMap): más oscuro = más demanda
const DEMAND_GRADIENT = { 0.2: "#fed7aa", 0.45: "#fb923c", 0.7: "#ea580c", 1: "#9a3412" };

// Genera un color estable por nombre de categoría (ya no son 5 fijas, son las
// que devuelva /api/meta) usando el propio texto como semilla del matiz.
function colorForCategory(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 42%)`;
}

// Convierte [lng, lat] (formato GeoJSON del backend) a [lat, lng] (formato que espera Leaflet)
function toLatLng(coordinates) {
  const [lng, lat] = coordinates.coordinates;
  return [lat, lng];
}

function createIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div class="producer-marker" style="background:${color}; width:22px; height:22px;"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function HeatmapLayer({ points, options }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const heatLayer = L.heatLayer(points, { radius: 60, blur: 40, maxZoom: 17, ...options }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, options]);

  return null;
}

// Al cambiar de capa o de filtro, encuadra lo que se está mostrando
function FitToPoints({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points.map(([lat, lng]) => [lat, lng])), { padding: [40, 40], maxZoom: 13 });
  }, [map, points]);

  return null;
}

export default function TerritoryMap() {
  const { meta } = useMeta();
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  // "demanda": dónde se busca/mira/contacta (telemetría agregada) · "oferta": dónde están los productores
  const [layer, setLayer] = useState("demanda");
  const [demand, setDemand] = useState({ heat: [], byLocality: [] });

  const categories = meta?.categories ?? [];
  const colors = useMemo(() => {
    const map = {};
    for (const c of categories) map[c] = colorForCategory(c);
    return map;
  }, [categories]);

  // No hay endpoint para listar productores directamente: se derivan de los
  // productos publicados (con hasta 100 resultados alcanza para la demo).
  // Cada productor queda asociado a la categoría de su primer producto
  // encontrado, que en la práctica coincide con su propio rubro.
  useEffect(() => {
    setLoading(true);
    searchProducts({
      category: selectedCategory === "Todos" ? undefined : selectedCategory,
      limit: 100,
    })
      .then(({ items }) => {
        const byProducer = new Map();
        for (const item of items) {
          if (!item.producer?.coordinates || byProducer.has(item.producer.id)) continue;
          byProducer.set(item.producer.id, { ...item.producer, category: item.category });
        }
        setProducers([...byProducer.values()]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedCategory]);

  useEffect(() => {
    getDemandHeat({ category: selectedCategory === "Todos" ? undefined : selectedCategory })
      .then(setDemand)
      .catch(() => setDemand({ heat: [], byLocality: [] }));
  }, [selectedCategory]);

  const offerPoints = useMemo(() => producers.map((p) => toLatLng(p.coordinates)), [producers]);
  const demandOptions = useMemo(
    () => ({
      radius: 45,
      blur: 30,
      minOpacity: 0.35,
      max: Math.max(1, ...demand.heat.map((c) => c[2])),
      gradient: DEMAND_GRADIENT,
    }),
    [demand.heat],
  );

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

  const heatPoints = layer === "demanda" ? demand.heat : offerPoints;

  return (
    <div className="map-card">
      <div className="map-toolbar">
        <div className="map-layer-toggle" role="group" aria-label="Qué mostrar en el mapa">
          <button
            type="button"
            className={layer === "demanda" ? "active" : ""}
            aria-pressed={layer === "demanda"}
            onClick={() => setLayer("demanda")}
          >
            Dónde hay demanda
          </button>
          <button
            type="button"
            className={layer === "oferta" ? "active" : ""}
            aria-pressed={layer === "oferta"}
            onClick={() => setLayer("oferta")}
          >
            Dónde hay oferta
          </button>
        </div>
        {layer === "demanda" && <DemandLegend />}
      </div>

      <div className="map-legend">
        <button
          type="button"
          className={`legend-item legend-button ${selectedCategory === "Todos" ? "active" : ""}`}
          onClick={() => setSelectedCategory("Todos")}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`legend-item legend-button ${selectedCategory === category ? "active" : ""}`}
            onClick={() => setSelectedCategory(category)}
          >
            <span className="legend-dot" style={{ background: colors[category] }} />
            {category}
          </button>
        ))}
      </div>

      <MapContainer center={[-26.1849, -58.1731]} zoom={14}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {layer === "demanda" ? (
          <HeatmapLayer points={demand.heat} options={demandOptions} />
        ) : (
          <HeatmapLayer points={offerPoints} />
        )}
        <FitToPoints points={heatPoints} />

        {producers.map((producer) => (
          <Marker
            key={producer.id}
            position={toLatLng(producer.coordinates)}
            icon={createIcon(colors[producer.category] || "#5F5E5A")}
          >
            <Popup className="producer-popup">
              <div
                className="popup-content"
                style={{ "--popup-color": colors[producer.category] || "#5F5E5A" }}
              >
                <strong>{producer.businessName}</strong>
                <span>{producer.category}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {layer === "demanda" && (
        <div className="map-demand-summary">
          <h2>Localidades con más demanda{selectedCategory !== "Todos" ? ` de ${selectedCategory}` : ""}</h2>
          {demand.byLocality.length === 0 ? (
            <p>Todavía no hay búsquedas ni consultas registradas para este rubro en los últimos 30 días.</p>
          ) : (
            <ol>
              {demand.byLocality.map((l) => (
                <li key={l.locality}>
                  <span>{l.locality}</span>
                  <strong>{l.events}</strong>
                </li>
              ))}
            </ol>
          )}
          <p className="map-demand-note">
            Búsquedas, visitas a productos y contactos por WhatsApp de los últimos 30 días (un contacto pesa 3).
            Los puntos verdes son los productores: donde hay calor y pocos puntos, falta oferta.
          </p>
        </div>
      )}
    </div>
  );
}
