import { useEffect } from "react";
import TerritoryMap from "@/components/TerritoryMap";
import "@/App.css";

export default function MapPage() {
  useEffect(() => {
    document.title = "Mapa de oferta · Mercado Km 0";
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Mapa de oferta</h1>
        <p>Ubicación de productores locales por rubro</p>
      </header>

      <main>
        <TerritoryMap />
      </main>
    </div>
  );
}
