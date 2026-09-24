// Backend real (Express + Sequelize + PostGIS) corriendo en local, con auth por
// cookie HTTP-Only.
export const API_BASE = "http://localhost:3000";

// Envuelve fetch: manda cookies de sesión, tira un Error con status/fieldErrors
// normalizados (igual forma en toda la app, así los formularios no repiten lógica).
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

  return body?.data;
}

// El backend anida la ubicación en location: { address, coordinates }. El resto
// del frontend ya espera address/coordinates sueltos (mismo shape que el mock
// viejo), así que se aplana acá, en un solo lugar.
function flattenProducer(raw) {
  if (!raw) return raw;
  const { location, ...rest } = raw;
  return {
    ...rest,
    address: location?.address ?? rest.address,
    coordinates: location?.coordinates ?? rest.coordinates,
  };
}

// --- Autenticación ---

export async function registerProducer(data) {
  const result = await request("/api/producers", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return { ...result, producer: flattenProducer(result.producer) };
}

export async function loginProducer(email, password) {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return { ...result, producer: flattenProducer(result.producer) };
}

export async function logoutProducer() {
  return request("/api/auth/logout", { method: "POST" });
}

// Un 401 acá no es un error real: significa "no hay sesión" (visitante).
export async function getProfile() {
  try {
    const producer = await request("/api/auth/profile");
    return flattenProducer(producer);
  } catch (err) {
    if (err.status === 401) return null;
    throw err;
  }
}

// --- Productores ---

export async function getProducers() {
  const producers = await request("/api/producers");
  return producers.map(flattenProducer);
}

export async function getProducer(id) {
  const producer = await request(`/api/producers/${id}`);
  return flattenProducer(producer);
}

export async function updateProducer(id, data) {
  const producer = await request(`/api/producers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return flattenProducer(producer);
}

export async function deleteProducer(id) {
  return request(`/api/producers/${id}`, { method: "DELETE" });
}

// --- Productos ---

export async function getProducts(params) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.isOffer) qs.set("isOffer", "true");
  const suffix = qs.toString() ? `?${qs}` : "";
  return request(`/api/products${suffix}`);
}

export async function getProducerProducts(producerId) {
  return request(`/api/producers/${producerId}/products`);
}

export async function createProduct(data) {
  return request("/api/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProduct(id, data) {
  return request(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Métrica de contacto: se dispara en paralelo, no se espera la respuesta.
// Todavía no existe el endpoint en el backend real, así que no rompe si falla.
export function trackContactClick(payload) {
  fetch(`${API_BASE}/api/interactions/contact-click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, at: new Date().toISOString() }),
  }).catch(() => {});
}
