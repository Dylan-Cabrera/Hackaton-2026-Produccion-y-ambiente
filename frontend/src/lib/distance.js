// Haversine: distancia en km sobre la esfera terrestre. Se calcula en el front
// para no depender de PostGIS ni de un endpoint extra durante la demo.
export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// GeoJSON guarda [lng, lat]; acá se normaliza para no equivocar el orden en cada uso.
export function geoToLatLng(point) {
  if (!point?.coordinates) return null;
  const [lng, lat] = point.coordinates;
  return { lat, lng };
}

export function daysSince(iso) {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

// El autor de una necesidad puede ser CONSUMER (persona o institución) o
// PRODUCER: cada rol guarda el "nombre para mostrar" en un lugar distinto.
export function authorDisplayName(author) {
  if (author.role === "PRODUCER") return author.producerProfile?.businessName ?? author.name;
  if (author.accountType === "INSTITUCION") return author.organizationName ?? author.name;
  return author.name;
}

export function authorBadgeLabel(author) {
  if (author.role === "PRODUCER") return "Productor";
  if (author.accountType === "INSTITUCION") return author.institutionType ?? "Institución";
  return "Persona";
}

export function formatPrice(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}
