const mockProducers = require("../data/mockProducers");
const searchMetrics = require("../data/searchMetrics");

function searchProducts(req, res) {
  const query = (req.query.q || "").trim().toLowerCase();

  if (!query) {
    return res.status(400).json({ error: "Falta el parámetro de búsqueda 'q'" });
  }

  const results = mockProducers.filter((producer) => {
    const businessName = producer.businessName.toLowerCase();
    const category = producer.category.toLowerCase();
    return businessName.includes(query) || category.includes(query);
  });

  // Si no hubo resultados, registramos la búsqueda como demanda insatisfecha
  if (results.length === 0) {
    searchMetrics.push({
      term: query,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({ query, results, resultsCount: results.length });
}

function getUnmetDemand(req, res) {
  // Agrupamos las búsquedas fallidas por término, contando cuántas veces se repitió cada una
  const counts = {};

  searchMetrics.forEach((entry) => {
    counts[entry.term] = (counts[entry.term] || 0) + 1;
  });

  // Convertimos el objeto de conteos en un array ordenado de mayor a menor
  const ranking = Object.entries(counts)
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count);

  res.json(ranking);
}

function getDemandPoints(req, res) {
  const query = (req.query.q || "").trim().toLowerCase();

  if (!query) {
    return res.status(400).json({ error: "Falta el parámetro de búsqueda 'q'" });
  }

  const points = searchMetrics
    .filter((entry) => entry.term === query)
    .map((entry) => [entry.lat, entry.lng]);

  res.json({ query, points });
}

module.exports = { searchProducts, getUnmetDemand, getDemandPoints };
