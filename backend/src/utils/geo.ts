import { LOCALITIES, LocalityName } from '../constants/localities.constants.js';
import { GeoJSONPoint } from '../interfaces/geo.types.js';

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

// Distancia entre dos puntos [lat, lng], redondeada a 1 decimal
export const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
};

// Localidad más cercana a un punto, según distancia a su centroide
export const nearestLocality = (lat: number, lng: number): LocalityName => {
  let closest: (typeof LOCALITIES)[number] = LOCALITIES[0];
  let closestDistance = haversineKm(lat, lng, closest.lat, closest.lng);

  for (const locality of LOCALITIES) {
    const distance = haversineKm(lat, lng, locality.lat, locality.lng);
    if (distance < closestDistance) {
      closest = locality;
      closestDistance = distance;
    }
  }

  return closest.name;
};

export const localityCentroid = (name: string): { lat: number; lng: number } | null => {
  const locality = LOCALITIES.find((entry) => entry.name === name);
  return locality ? { lat: locality.lat, lng: locality.lng } : null;
};

// PostGIS devuelve también "crs" en el GeoJSON; se descarta para no filtrar detalles internos
export const toPlainPoint = (point: GeoJSONPoint | null | undefined): GeoJSONPoint | null =>
  point ? { type: 'Point', coordinates: point.coordinates } : null;
