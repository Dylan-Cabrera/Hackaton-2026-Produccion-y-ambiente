// Array en memoria que guarda cada búsqueda que no encontró resultados.
// Arranca con datos ficticios para que el heatmap de demanda tenga algo para mostrar
// desde el primer momento, sin depender de buscar manualmente muchas veces.
const searchMetrics = [
  // Mucha demanda de miel cerca de Barrio La Paz, poca oferta ahí
  { term: "miel", lat: -26.1780, lng: -58.1820, timestamp: new Date().toISOString() },
  { term: "miel", lat: -26.1785, lng: -58.1815, timestamp: new Date().toISOString() },
  { term: "miel", lat: -26.1775, lng: -58.1825, timestamp: new Date().toISOString() },
  { term: "miel", lat: -26.1790, lng: -58.1810, timestamp: new Date().toISOString() },

  // Demanda de queso cerca de Villa del Carmen
  { term: "queso", lat: -26.2100, lng: -58.1600, timestamp: new Date().toISOString() },
  { term: "queso", lat: -26.2095, lng: -58.1610, timestamp: new Date().toISOString() },
  { term: "queso", lat: -26.2105, lng: -58.1595, timestamp: new Date().toISOString() },

  // Demanda de tejidos/artesanías cerca de La Nueva Formosa
  { term: "tejidos", lat: -26.1950, lng: -58.1850, timestamp: new Date().toISOString() },
  { term: "tejidos", lat: -26.1945, lng: -58.1845, timestamp: new Date().toISOString() },

  // Demanda de pescado cerca de Don Bosco (poca oferta de este rubro en general)
  { term: "pescado", lat: -26.1810, lng: -58.1780, timestamp: new Date().toISOString() },
  { term: "pescado", lat: -26.1815, lng: -58.1775, timestamp: new Date().toISOString() },
  { term: "pescado", lat: -26.1805, lng: -58.1785, timestamp: new Date().toISOString() },
  { term: "pescado", lat: -26.1808, lng: -58.1790, timestamp: new Date().toISOString() },
  { term: "pescado", lat: -26.1812, lng: -58.1770, timestamp: new Date().toISOString() },
  { term: "pescado", lat: -26.1802, lng: -58.1792, timestamp: new Date().toISOString() },
  { term: "pescado", lat: -26.1818, lng: -58.1768, timestamp: new Date().toISOString() },
  { term: "pescado", lat: -26.1798, lng: -58.1795, timestamp: new Date().toISOString() },
  { term: "pescado", lat: -26.1820, lng: -58.1765, timestamp: new Date().toISOString() },
  { term: "pescado", lat: -26.1807, lng: -58.1783, timestamp: new Date().toISOString() },
  { term: "pescado", lat: -26.1813, lng: -58.1773, timestamp: new Date().toISOString() },
  { term: "pescado", lat: -26.1800, lng: -58.1788, timestamp: new Date().toISOString() },
  { term: "pescado", lat: -26.1816, lng: -58.1778, timestamp: new Date().toISOString() },
  { term: "pescado", lat: -26.1809, lng: -58.1793, timestamp: new Date().toISOString() },
  { term: "pescado", lat: -26.1811, lng: -58.1768, timestamp: new Date().toISOString() },

  // Demanda de herrería cerca de Barrio 7 de Mayo, una sola búsqueda (demanda baja)
  { term: "herreria", lat: -26.1700, lng: -58.1700, timestamp: new Date().toISOString() },
];

module.exports = searchMetrics;
