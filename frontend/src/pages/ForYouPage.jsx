import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import ImageWithFallback from "@/components/ImageWithFallback";
import KmZeroBadge from "@/components/KmZeroBadge";
import { ProductCardSkeletonGrid } from "@/components/ProductCardSkeleton";
import ProductDetailView from "@/components/ProductDetailView";
import { useAuth } from "@/context/AuthContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getForYouRecommendations } from "@/lib/api";
import { formatPrice } from "@/lib/distance";

// HU-10: feed personalizado según el historial propio de búsquedas/contactos.
// Sin historial, el backend devuelve `coldStart: true` con lo más popular cerca.
export default function ForYouPage() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const { location } = useUserLocation();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    document.title = "Para vos · Formosa Unida";
  }, []);

  useEffect(() => {
    if (status === "anonymous") navigate("/login");
  }, [status, navigate]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    setError(null);
    const params = location ? { lat: location.lat, lng: location.lng } : {};
    getForYouRecommendations(params)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status, location, retryTick]);

  if (status !== "authenticated") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  // El backend anida producer y distanceKm dentro de cada product; acá se separan
  // para reutilizar ProductDetailView, que espera { product, producer, distanceKm }.
  const items = (data?.items ?? []).map(({ score, reason, product: raw }) => {
    const { producer, distanceKm, ...product } = raw;
    return { score, reason, product, producer, distanceKm: distanceKm ?? null };
  });

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Para vos</h1>
        <p className="text-muted-foreground">
          Recomendaciones según lo que buscaste y con quién te contactaste antes.
        </p>
      </section>

      {loading ? (
        <ProductCardSkeletonGrid />
      ) : error ? (
        <ErrorState
          message={`No pudimos cargar tus recomendaciones: ${error}`}
          onRetry={() => setRetryTick((t) => t + 1)}
        />
      ) : items.length === 0 ? (
        <EmptyState message="Todavía no tenemos recomendaciones para vos. Explorá el catálogo para que podamos aprender qué te interesa." />
      ) : (
        <>
          {data.coldStart && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <Sparkles className="size-4 shrink-0" />
              Todavía no tenemos historial tuyo: te mostramos lo más popular cerca tuyo.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <button
                key={item.product.id}
                type="button"
                onClick={() => setSelected(item)}
                className="group overflow-hidden rounded-xl border border-border bg-card text-left transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  <ImageWithFallback
                    src={item.product.imageUrl}
                    alt={item.product.title}
                    className="size-full transition-transform group-hover:scale-105"
                  />
                  {item.product.isOffer && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
                      <Zap className="size-3" />
                      Oferta Relámpago
                    </span>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    <Sparkles className="size-3" />
                    {item.reason.label}
                  </span>
                  <h3 className="font-semibold">{item.product.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.producer?.businessName ?? "Productor local"}
                  </p>
                  <p className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(item.product.offerPrice ?? item.product.price)}
                    </span>
                    {item.product.isOffer && item.product.offerPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(item.product.price)}
                      </span>
                    )}
                  </p>
                  <KmZeroBadge km={item.distanceKm} />
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <ProductDetailView item={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
