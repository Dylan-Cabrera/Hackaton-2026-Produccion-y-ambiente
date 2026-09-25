import { useEffect, useState } from "react";
import { CreditCard, Truck, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageWithFallback from "@/components/ImageWithFallback";
import KmZeroBadge from "@/components/KmZeroBadge";
import TrustBadge from "@/components/TrustBadge";
import WhatsAppContactButton from "@/components/WhatsAppContactButton";
import { getProducer } from "@/lib/api";
import { formatPrice } from "@/lib/distance";

export default function ProductDetailView({ item, onClose }) {
  const product = item?.product;
  const producerSummary = item?.producer;
  // La búsqueda pública solo trae un resumen del productor (sin métodos de pago
  // ni entrega); se pide el perfil completo recién al abrir el detalle.
  const [fullProducer, setFullProducer] = useState(null);

  useEffect(() => {
    setFullProducer(null);
    if (producerSummary?.id) {
      getProducer(producerSummary.id).then(setFullProducer).catch(() => {});
    }
  }, [producerSummary?.id]);

  const producer = fullProducer ?? producerSummary;

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {product && (
          <>
            <DialogHeader>
              <DialogTitle>{product.title}</DialogTitle>
            </DialogHeader>

            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              <ImageWithFallback src={product.imageUrl} alt={product.title} className="size-full" />
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {product.category}
                </span>
                {product.isOffer && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                    <Zap className="size-3" />
                    Oferta Relámpago
                  </span>
                )}
                <KmZeroBadge km={item?.distanceKm ?? null} />
              </div>

              <p className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(product.offerPrice ?? product.price)}
                </span>
                {product.isOffer && product.offerPrice && (
                  <span className="text-muted-foreground line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
                <span className="text-muted-foreground">· {product.stockUnit}</span>
              </p>

              {product.description && (
                <p className="text-muted-foreground">{product.description}</p>
              )}

              {producer && (
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{producer.businessName}</span>
                    <TrustBadge createdAt={producer.createdAt} />
                  </div>
                  <p className="flex items-start gap-2 text-muted-foreground">
                    <CreditCard className="mt-0.5 size-4" />
                    {(producer.paymentMethods ?? []).join(", ") || "A coordinar"}
                  </p>
                  <p className="flex items-start gap-2 text-muted-foreground">
                    <Truck className="mt-0.5 size-4" />
                    {(producer.deliveryOptions ?? []).join(" · ") || "A coordinar"}
                  </p>
                  <WhatsAppContactButton producer={producer} product={product} />
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
