import { useEffect } from "react";
import TerritoryMap from "@/components/TerritoryMap";
import UnmetDemandPanel from "@/components/UnmetDemandPanel";
import "@/App.css";

export default function MapPage() {
  useEffect(() => {
    document.title = "Mapa de oferta y vacíos productivos";
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Mapa de oferta y vacíos productivos</h1>
        <p>Ubicación de productores locales y zonas con poca cobertura</p>
      </header>

      <main>
        <TerritoryMap />
        <UnmetDemandPanel />
      </main>
    </div>
  );
}
