import { useEffect, useMemo, useState } from "react";
import CatalogFeed from "@/components/CatalogFeed";
import FilterBar from "@/components/FilterBar";
import ProductDetailView from "@/components/ProductDetailView";
import { Button } from "@/components/ui/button";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getProducers, getProducts } from "@/lib/api";
import { geoToLatLng, haversineKm } from "@/lib/distance";

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [producers, setProducers] = useState([]);
  const [category, setCategory] = useState("all");
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [selected, setSelected] = useState(null);
  const { location, status, request } = useUserLocation();

  useEffect(() => {
    document.title = "Mercado Km 0 · Productores de Formosa";
  }, []);

  // Se trae todo una vez y se filtra en cliente: el filtro debe ser instantáneo.
  useEffect(() => {
    getProducts().then(setProducts);
    getProducers().then(setProducers);
  }, []);

  const items = useMemo(() => {
    const list = products
      .filter((p) => (category === "all" || p.category === category) && (!onlyOffers || p.isOffer))
      .map((product) => {
        const producer = producers.find((pr) => pr.id === product.producerId);
        const coords = geoToLatLng(producer?.coordinates);
        const distanceKm = location && coords ? haversineKm(location, coords) : null;
        return { product, producer, distanceKm };
      });

    // Orden por cercanía solo si hay ubicación; si no, se deja el orden original.
    if (location) {
      list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }
    return list;
  }, [products, producers, category, onlyOffers, location]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Lo que se produce cerca tuyo</h1>
        <p className="text-muted-foreground">
          Productores, artesanos y apicultores de Formosa, sin intermediarios.
        </p>
      </section>

      {status === "denied" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Sin ubicación no podemos ordenar por cercanía, pero el catálogo funciona igual.
          </span>
          <Button variant="outline" size="sm" onClick={request}>
            Activar ubicación
          </Button>
        </div>
      )}

      <FilterBar
        category={category}
        onlyOffers={onlyOffers}
        onCategoryChange={setCategory}
        onOnlyOffersChange={setOnlyOffers}
      />

      <CatalogFeed items={items} onSelect={setSelected} />

      <ProductDetailView item={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
