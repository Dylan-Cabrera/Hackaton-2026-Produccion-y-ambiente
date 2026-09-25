import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CatalogFeed from "@/components/CatalogFeed";
import ErrorState from "@/components/ErrorState";
import { ProductCardSkeletonGrid } from "@/components/ProductCardSkeleton";
import ProducerProfileCard from "@/components/ProducerProfileCard";
import ProductDetailView from "@/components/ProductDetailView";
import Skeleton from "@/components/Skeleton";
import { getProducer, getProducerProducts } from "@/lib/api";

export default function ProducerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producer, setProducer] = useState(null);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getProducer(id), getProducerProducts(id)])
      .then(([p, prods]) => {
        setProducer(p);
        setProducts(prods);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, retryTick]);

  useEffect(() => {
    if (producer) document.title = `${producer.businessName} · Mercado Km 0`;
  }, [producer]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <Skeleton className="h-40" />
        <ProductCardSkeletonGrid count={3} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <ErrorState
          message={
            error.includes("no encontrado")
              ? "Ese productor no existe."
              : `No pudimos cargar el perfil: ${error}`
          }
          onRetry={() => setRetryTick((t) => t + 1)}
        />
      </main>
    );
  }

  const items = products.map((product) => ({ product, producer, distanceKm: null }));

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm text-muted-foreground underline"
      >
        ← Volver
      </button>

      <ProducerProfileCard producer={producer} />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Productos publicados</h2>
        <CatalogFeed items={items} onSelect={setSelected} />
      </div>

      <ProductDetailView item={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
