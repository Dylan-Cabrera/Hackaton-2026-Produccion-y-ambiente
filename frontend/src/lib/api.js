// Backend real (Express + Sequelize + PostGIS) de mi compañero, con roles
// CONSUMER/PRODUCER/ADMIN y auth por cookie HTTP-Only.
export const API_BASE = "http://localhost:3000";

// Envuelve fetch: manda cookies de sesión, tira un Error con status/fieldErrors
// normalizados (igual forma en toda la app, así los formularios no repiten lógica).
// Devuelve el body completo ({message, data, pagination?}) porque algunos
// endpoints (búsqueda de productos) traen metadata además de "data".
async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    const error = new Error("No se pudo conectar con el servidor");
    error.status = 0;
    error.fieldErrors = [];
    throw error;
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(body?.message || "Ocurrió un error inesperado");
    error.status = res.status;
    error.fieldErrors = body?.errors ?? [];
    throw error;
  }

  return body;
}

// El perfil de productor viaja anidado (producerProfile) en la cuenta de
// usuario. Se aplana para que el resto de la app trabaje con un solo objeto,
// igual que antes.
function flattenUser(raw) {
  if (!raw) return raw;
  const { producerProfile, ...rest } = raw;
  return { ...rest, ...(producerProfile ?? {}) };
}

// El perfil público de productor trae la ubicación anidada en location.
function flattenProducer(raw) {
  if (!raw) return raw;
  const { location, ...rest } = raw;
  return {
    ...rest,
    address: location?.address ?? rest.address,
    coordinates: location?.coordinates ?? rest.coordinates,
  };
}

// --- Metadatos (categorías, unidades, localidades, tipos de institución) ---

export async function getMeta() {
  const res = await request("/api/meta");
  return res.data;
}

// --- Autenticación / cuenta ---

export async function registerAccount(data) {
  const res = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return { ...res.data, user: flattenUser(res.data.user) };
}

export async function loginAccount(email, password) {
  const res = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return { ...res.data, user: flattenUser(res.data.user) };
}

export async function logoutAccount() {
  return request("/api/auth/logout", { method: "POST" });
}

// Un 401 acá no es un error real: significa "no hay sesión" (visitante).
export async function getProfile() {
  try {
    const res = await request("/api/auth/profile");
    return flattenUser(res.data);
  } catch (err) {
    if (err.status === 401) return null;
    throw err;
  }
}

// Campos de cuenta comunes a cualquier rol (nombre, teléfono, localidad...)
export async function updateAccount(data) {
  const res = await request("/api/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return flattenUser(res.data);
}

export async function deleteAccount() {
  return request("/api/users/me", { method: "DELETE" });
}

// Campos propios del emprendimiento (solo rol PRODUCER)
export async function updateProducerProfile(data) {
  const res = await request("/api/producers/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return flattenUser(res.data);
}

// --- Productores (perfil público) ---

export async function getProducer(id) {
  const res = await request(`/api/producers/${id}`);
  return flattenProducer(res.data);
}

export async function getProducerProducts(id) {
  const res = await request(`/api/producers/${id}/products`);
  return res.data;
}

// --- Productos ---

// Búsqueda pública con paginación y, opcionalmente, orden por cercanía
// (lat/lng/maxDistance, HU-04). Devuelve { data, pagination }, no solo el array,
// porque el catálogo necesita el total para el scroll/paginado.
export async function searchProducts(params = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.category) qs.set("category", params.category);
  if (params.isOffer) qs.set("isOffer", "true");
  if (params.limit) qs.set("limit", params.limit);
  if (params.offset) qs.set("offset", params.offset);
  if (params.lat != null && params.lng != null) {
    qs.set("lat", params.lat);
    qs.set("lng", params.lng);
    if (params.maxDistance) qs.set("maxDistance", params.maxDistance);
  }
  const suffix = qs.toString() ? `?${qs}` : "";
  const res = await request(`/api/products${suffix}`);
  return { items: res.data, pagination: res.pagination };
}

export async function createProduct(data) {
  const res = await request("/api/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function getMyProducts() {
  const res = await request("/api/products/mine");
  return res.data;
}

export async function updateProduct(id, data) {
  const res = await request(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.data;
}

// --- Necesidades ---

export async function getNeeds(params) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  const suffix = qs.toString() ? `?${qs}` : "";
  const res = await request(`/api/needs${suffix}`);
  return res.data;
}

export async function getNeed(id) {
  const res = await request(`/api/needs/${id}`);
  return res.data;
}

export async function getMyNeeds() {
  const res = await request("/api/needs/mine");
  return res.data;
}

export async function createNeed(data) {
  const res = await request("/api/needs", { method: "POST", body: JSON.stringify(data) });
  return res.data;
}

export async function updateNeedStatus(id, status) {
  const res = await request(`/api/needs/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  return res.data;
}

// --- Interacciones (telemetría de contacto, HU-06) ---

// Se dispara en paralelo, no se espera la respuesta: un fallo acá nunca debe
// frenar el contacto real por WhatsApp. Usa el endpoint real de telemetría
// (no existe un endpoint "/interactions" aparte: todo evento de demanda pasa por acá).
export function trackContactClick({ producerId, productId }) {
  fetch(`${API_BASE}/api/telemetry/event`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType: "WHATSAPP_CLICK", producerId, productId }),
  }).catch(() => {});
}

// --- Recomendaciones B2B (HU-05) ---

// El backend devuelve { producerCategory, inputs, radiusKm, recommendations: [...] } en
// forma plana (cada item ya trae su matchedInput); acá se agrupa y se aplana producto+
// productor para que los componentes no tengan que conocer esa forma cruda.
export async function getB2BRecommendations(radiusKm) {
  const res = await request(`/api/recommendations/b2b?radiusKm=${radiusKm}`);
  const { inputs, recommendations } = res.data;

  const byInput = new Map();
  for (const rec of recommendations) {
    const items = byInput.get(rec.matchedInput) ?? [];
    items.push({ ...rec.product, producer: rec.producer, distanceKm: rec.distanceKm });
    byInput.set(rec.matchedInput, items);
  }

  return {
    matchedInputs: inputs,
    groups: [...byInput.entries()].map(([matchedInput, items]) => ({ matchedInput, items })),
  };
}

// --- Recomendaciones personalizadas (HU-10) ---

export async function getForYouRecommendations(params = {}) {
  const qs = new URLSearchParams();
  if (params.lat != null && params.lng != null) {
    qs.set("lat", params.lat);
    qs.set("lng", params.lng);
  }
  if (params.limit) qs.set("limit", params.limit);
  const suffix = qs.toString() ? `?${qs}` : "";
  const res = await request(`/api/recommendations/for-you${suffix}`);
  return res.data;
}

// --- Analítica ---

// HU-07: dashboard de demanda del propio productor
export async function getProducerDemand() {
  const res = await request("/api/analytics/producer-demand");
  return res.data;
}

// HU-08: resumen provincial (admin)
export async function getAdminSummary() {
  const res = await request("/api/analytics/admin-summary");
  return res.data;
}
