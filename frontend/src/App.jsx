import TerritoryMap from "./components/TerritoryMap";
import "./App.css";

function App() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>Mapa de oferta y vacíos productivos</h1>
        <p>Ubicación de productores locales y zonas con poca cobertura</p>
      </header>

      <main>
        <TerritoryMap />
      </main>
    </div>
  );
}

export default App;
