import { useState } from "react";
import { Pencil } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ImageWithFallback from "@/components/ImageWithFallback";
import ProductFormModal from "@/components/ProductFormModal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updateProduct } from "@/lib/api";
import { formatPrice } from "@/lib/distance";

// A diferencia de CatalogFeed (para explorar y ver el detalle), esta lista es
// para gestionar el propio inventario: acá lo que importa es pausar/activar,
// no abrir un modal de detalle.
export default function ProducerInventoryList({ products, onChange }) {
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  async function toggleAvailable(product) {
    setUpdatingId(product.id);
    setError("");
    try {
      const updated = await updateProduct(product.id, { available: !product.available });
      onChange(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  if (products.length === 0) {
    return <EmptyState message="Todavía no publicaste ningún producto." />;
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 p-3">
            <ImageWithFallback
              src={product.imageUrl}
              alt={product.title}
              className="size-14 shrink-0 rounded-md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{product.title}</p>
              <p className="text-sm text-muted-foreground">
                {formatPrice(product.offerPrice ?? product.price)} · {product.stockUnit}
                {product.isOffer && " · Oferta"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ProductFormModal
                product={product}
                onSaved={onChange}
                trigger={
                  <Button variant="outline" size="sm" aria-label={`Editar ${product.title}`}>
                    <Pencil />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                }
              />
              <span className="text-xs text-muted-foreground">
                {product.available ? "Activo" : "Pausado"}
              </span>
              <Switch
                checked={product.available}
                disabled={updatingId === product.id}
                onCheckedChange={() => toggleAvailable(product)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
