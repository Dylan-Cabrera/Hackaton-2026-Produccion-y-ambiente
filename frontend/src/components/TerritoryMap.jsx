import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

const API_URL = "http://localhost:3000/api/producers";

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
function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const heatLayer = L.heatLayer(points, {
      radius: 60,
      blur: 40,
      maxZoom: 17,
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

export default function TerritoryMap() {
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("La respuesta del servidor no fue exitosa");
        return res.json();
      })
      .then((data) => {
        setProducers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Cargando productores...</p>;
  if (error) return <p>Error al cargar los datos: {error}</p>;

  const heatPoints = producers.map((p) => toLatLng(p.coordinates));

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

      {producers.map((producer) => (
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
