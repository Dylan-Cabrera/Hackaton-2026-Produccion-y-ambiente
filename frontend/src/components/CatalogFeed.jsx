import { Zap } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ImageWithFallback from "@/components/ImageWithFallback";
import KmZeroBadge from "@/components/KmZeroBadge";
import { formatPrice } from "@/lib/distance";

// items: [{ product, producer, distanceKm }]
export default function CatalogFeed({ items, onSelect }) {
  if (items.length === 0) {
    return <EmptyState message="No hay productos con estos filtros." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const { product, producer, distanceKm } = item;
        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelect(item)}
            className="group overflow-hidden rounded-xl border border-border bg-card text-left transition-shadow hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] bg-muted">
              <ImageWithFallback
                src={product.imageUrl}
                alt={product.title}
                className="size-full transition-transform group-hover:scale-105"
              />
              {product.isOffer && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
                  <Zap className="size-3" />
                  Oferta Relámpago
                </span>
              )}
            </div>
            <div className="space-y-2 p-4">
              <h3 className="font-semibold">{product.title}</h3>
              <p className="text-sm text-muted-foreground">
                {producer?.businessName ?? "Productor local"}
              </p>
              <p className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(product.offerPrice ?? product.price)}
                </span>
                {product.isOffer && product.offerPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </p>
              <KmZeroBadge km={distanceKm} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
