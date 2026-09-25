import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import ImageWithFallback from "@/components/ImageWithFallback";
import KmZeroBadge from "@/components/KmZeroBadge";
import Skeleton from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import WhatsAppContactButton from "@/components/WhatsAppContactButton";
import { getB2BRecommendations } from "@/lib/api";
import { formatPrice } from "@/lib/distance";

const RADIUS_OPTIONS = [25, 50, 100, 200];

export default function B2BSupplyRecommendations() {
  const [radius, setRadius] = useState(50);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getB2BRecommendations(radius)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [radius, retryTick]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Insumos locales recomendados para tu producción
        </h2>
        <div className="flex gap-1">
          {RADIUS_OPTIONS.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={radius === r ? "default" : "outline"}
              onClick={() => setRadius(r)}
            >
              {r} km
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : error ? (
        <ErrorState
          message={`No pudimos cargar los insumos: ${error}`}
          onRetry={() => setRetryTick((t) => t + 1)}
        />
      ) : data.matchedInputs.length === 0 ? (
        <EmptyState message="Tu rubro todavía no tiene insumos mapeados." />
      ) : data.groups.length === 0 ? (
        <EmptyState
          message={`No encontramos ${data.matchedInputs.join(", ")} dentro de ${radius} km.`}
          action={
            <div className="flex flex-col items-center gap-2">
              {radius < 200 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRadius(RADIUS_OPTIONS[RADIUS_OPTIONS.indexOf(radius) + 1])}
                >
                  Ampliar a {RADIUS_OPTIONS[RADIUS_OPTIONS.indexOf(radius) + 1]} km
                </Button>
              )}
              <Link to="/necesidades/nueva" className="text-sm text-primary underline">
                Publicá una necesidad
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-5">
          {data.groups.map((group) => (
            <div key={group.matchedInput}>
              <span className="mb-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {group.matchedInput}
              </span>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-lg border border-border p-3">
                    <ImageWithFallback
                      src={item.imageUrl}
                      alt={item.title}
                      className="size-16 shrink-0 rounded-md"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.producer.businessName}
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {formatPrice(item.offerPrice ?? item.price)} · {item.stockUnit}
                      </p>
                      <KmZeroBadge km={item.distanceKm ?? null} />
                      <WhatsAppContactButton
                        producer={item.producer}
                        product={item}
                        label="Contactar proveedor"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
