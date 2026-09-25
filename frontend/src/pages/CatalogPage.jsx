import { useEffect, useMemo, useRef, useState } from "react";
import CatalogFeed from "@/components/CatalogFeed";
import { ProductCardSkeletonGrid } from "@/components/ProductCardSkeleton";
import ErrorState from "@/components/ErrorState";
import FilterBar from "@/components/FilterBar";
import ProductDetailView from "@/components/ProductDetailView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMeta } from "@/hooks/useMeta";
import { useUserLocation } from "@/hooks/useUserLocation";
import { searchProducts, trackSearch } from "@/lib/api";

export default function CatalogPage() {
  const { meta } = useMeta();
  const { location, status, request } = useUserLocation();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);
  // Evita registrar dos veces la misma búsqueda (reintentos, cambio de ubicación)
  const lastTrackedSearch = useRef("");

  useEffect(() => {
    document.title = "Formosa Unida · Productores de Formosa";
  }, []);

  // El backend ya filtra, ordena por cercanía (si hay lat/lng) y pagina:
  // no hace falta traer todo y filtrar en el cliente como antes.
  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = {
      q: q.trim() || undefined,
      category: category === "all" ? undefined : category,
      isOffer: onlyOffers || undefined,
      limit: 24,
    };
    if (location) {
      params.lat = location.lat;
      params.lng = location.lng;
    }
    const timeout = setTimeout(() => {
      searchProducts(params)
        .then(({ items }) => {
          setResults(items);
          const term = q.trim();
          const key = `${term.toLowerCase()}|${category}`;
          if (term.length >= 2 && key !== lastTrackedSearch.current) {
            lastTrackedSearch.current = key;
            trackSearch({
              queryTerm: term,
              category: category === "all" ? undefined : category,
              found: items.length > 0,
            });
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 300); // debounce simple para no disparar una consulta por cada tecla en "q"

    return () => clearTimeout(timeout);
  }, [q, category, onlyOffers, location, retryTick]);

  const items = useMemo(
    () =>
      results.map((item) => {
        const { producer, distanceKm, ...product } = item;
        return { product, producer, distanceKm: distanceKm ?? null };
      }),
    [results],
  );

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

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre… (ej: miel, mandioca)"
        className="max-w-md"
      />

      <FilterBar
        category={category}
        onlyOffers={onlyOffers}
        categories={meta?.categories ?? []}
        onCategoryChange={setCategory}
        onOnlyOffersChange={setOnlyOffers}
      />

      {loading ? (
        <ProductCardSkeletonGrid />
      ) : error ? (
        <ErrorState
          message={`No pudimos cargar el catálogo: ${error}`}
          onRetry={() => setRetryTick((t) => t + 1)}
        />
      ) : (
        <CatalogFeed items={items} onSelect={setSelected} />
      )}

      <ProductDetailView item={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
