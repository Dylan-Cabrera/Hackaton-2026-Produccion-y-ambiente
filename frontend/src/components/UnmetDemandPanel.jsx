import { useEffect, useState } from "react";
import "./UnmetDemandPanel.css";

const SEARCH_URL = "http://localhost:3000/api/products/search";
const RANKING_URL = "http://localhost:3000/api/products/unmet-demand";

export default function UnmetDemandPanel() {
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(true);

  // Trae el ranking actual de demanda insatisfecha
  function fetchRanking() {
    setLoadingRanking(true);
    fetch(RANKING_URL)
      .then((res) => res.json())
      .then((data) => {
        setRanking(data);
        setLoadingRanking(false);
      })
      .catch(() => setLoadingRanking(false));
  }

  // Al montar el componente, cargamos el ranking una vez
  useEffect(() => {
    fetchRanking();
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;

    fetch(`${SEARCH_URL}?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        setSearchResult(data);
        // Si la búsqueda no encontró nada, el backend ya la registró.
        // Volvemos a pedir el ranking para que se actualice en pantalla al instante.
        if (data.resultsCount === 0) {
          fetchRanking();
        }
      });
  }

  return (
    <div className="demand-panel">
      <h2>Buscar un producto</h2>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: miel, queso, tejidos..."
        />
        <button type="submit">Buscar</button>
      </form>

      {searchResult && (
        <div className="search-result">
          {searchResult.resultsCount > 0 ? (
            <>
              <p>
                Encontramos {searchResult.resultsCount} productor(es) para "{searchResult.query}":
              </p>
              <ul>
                {searchResult.results.map((producer) => (
                  <li key={producer.id}>
                    {producer.businessName} — {producer.category}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="no-results">
              No encontramos productores para "{searchResult.query}" — esta búsqueda quedó
              registrada como demanda sin cubrir.
            </p>
          )}
        </div>
      )}

      <h3>Lo más buscado sin encontrar</h3>
      {loadingRanking ? (
        <p className="muted">Cargando ranking...</p>
      ) : ranking.length === 0 ? (
        <p className="muted">Todavía no hay búsquedas sin resultado registradas.</p>
      ) : (
        <ol className="ranking-list">
          {ranking.map((item) => (
            <li key={item.term}>
              {item.term} — buscado {item.count} {item.count === 1 ? "vez" : "veces"}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
