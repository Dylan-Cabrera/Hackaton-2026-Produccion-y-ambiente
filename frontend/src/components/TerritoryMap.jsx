import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { mockProducers } from "../data/mockProducers";

// Colores por categoría, para diferenciar los pines en el mapa
const CATEGORY_COLORS = {
  "Frutihortícola": "#639922",
  "Conservas/Dulces": "#D85A30",
  "Apicultura": "#BA7517",
  "Artesanías/Textil": "#D4537E",
  "Otros": "#5F5E5A",
};

// Convierte [lng, lat] (formato GeoJSON del backend) a [lat, lng] (formato que espera Leaflet)
function toLatLng(coordinates) {
  const [lng, lat] = coordinates.coordinates;
  return [lat, lng];
}

// Crea un ícono de color distinto según la categoría del productor
function createIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color}; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow: 0 0 2px rgba(0,0,0,0.4);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

// Componente aparte para la capa de heatmap, porque leaflet.heat no es un componente de React
// Necesita acceso directo al mapa (useMap) para agregarse como capa
function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const heatLayer = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 17,
    }).addTo(map);

    // Limpieza: si el componente se desmonta o los puntos cambian, sacamos la capa vieja
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

export default function TerritoryMap() {
  const heatPoints = mockProducers.map((p) => toLatLng(p.coordinates));

  return (
    <MapContainer
      center={[-26.1849, -58.1731]}
      zoom={14}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <HeatmapLayer points={heatPoints} />

      {mockProducers.map((producer) => (
        <Marker
          key={producer.id}
          position={toLatLng(producer.coordinates)}
          icon={createIcon(CATEGORY_COLORS[producer.category] || "#5F5E5A")}
        >
          <Popup>
            <strong>{producer.businessName}</strong>
            <br />
            {producer.category}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}