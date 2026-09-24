import { MOCK_PRODUCERS, MOCK_PRODUCTS } from "./mockData";

// El backend Express de la hackathon corre local. Si no responde (todavía no está
// levantado o falta el endpoint) se cae a los mocks para que la demo no se corte.
export const API_BASE = "http://localhost:3000";

async function tryFetch(path, init) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Store en memoria: mantiene lo que se crea durante la demo si el backend no guarda.
const localProducers = [...MOCK_PRODUCERS];
const localProducts = [...MOCK_PRODUCTS];
let nextId = 1000;

// TODO: reemplazar el fallback mock por el fetch real cuando el backend esté listo.
export async function getProducers() {
  return (await tryFetch("/api/producers")) ?? localProducers;
}

export async function getProducer(id) {
  return (await tryFetch(`/api/producers/${id}`)) ?? localProducers.find((p) => p.id === id);
}

export async function createProducer(data) {
  const created = await tryFetch("/api/producers", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (created) return created;
  const local = { ...data, id: nextId++, createdAt: new Date().toISOString() };
  localProducers.push(local);
  return local;
}

export async function getProducts(params) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.isOffer) qs.set("isOffer", "true");
  const suffix = qs.toString() ? `?${qs}` : "";
  const remote = await tryFetch(`/api/products${suffix}`);
  if (remote) return remote;
  return localProducts.filter(
    (p) =>
      (!params?.category || p.category === params.category) && (!params?.isOffer || p.isOffer),
  );
}

export async function getProducerProducts(producerId) {
  return (
    (await tryFetch(`/api/producers/${producerId}/products`)) ??
    localProducts.filter((p) => p.producerId === producerId)
  );
}

export async function createProduct(data) {
  const created = await tryFetch("/api/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (created) return created;
  const local = { ...data, id: nextId++ };
  localProducts.unshift(local);
  return local;
}

// Métrica de contacto: se dispara en paralelo, no se espera la respuesta.
export function trackContactClick(payload) {
  tryFetch("/api/interactions/contact-click", {
    method: "POST",
    body: JSON.stringify({ ...payload, at: new Date().toISOString() }),
  });
}
