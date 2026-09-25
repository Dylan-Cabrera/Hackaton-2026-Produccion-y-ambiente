import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorState from "@/components/ErrorState";
import { ProductCardSkeletonGrid } from "@/components/ProductCardSkeleton";
import ProducerInventoryList from "@/components/ProducerInventoryList";
import ProducerProfileCard from "@/components/ProducerProfileCard";
import ProducerProfileEditForm from "@/components/ProducerProfileEditForm";
import ProductCreateModal from "@/components/ProductCreateModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getMyProducts } from "@/lib/api";

export default function MyProductsPage() {
  const { user, status } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    document.title = "Mis productos y excedentes · Mercado Km 0";
  }, []);

  // Sin sesión, o con sesión pero sin ser productor, no hay nada que mostrar acá.
  useEffect(() => {
    if (status === "anonymous") {
      navigate("/login");
    } else if (status === "authenticated" && user?.role !== "PRODUCER") {
      navigate("/");
    }
  }, [status, user, navigate]);

  useEffect(() => {
    if (user?.role !== "PRODUCER") return;
    setLoadingProducts(true);
    setError(null);
    getMyProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingProducts(false));
  }, [user, retryTick]);

  if (status !== "authenticated" || user?.role !== "PRODUCER") {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis productos</h1>
          <p className="text-muted-foreground">
            Publicá rápido, marcá los excedentes como oferta y pausá lo que se te acabó.
          </p>
        </div>
        <ProductCreateModal
          defaultCategory={user.category}
          onCreated={(p) => setProducts((prev) => [p, ...prev])}
        />
      </div>

      {editing ? (
        <ProducerProfileEditForm
          producer={user}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="space-y-3">
          <ProducerProfileCard producer={user} />
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Editar perfil
          </Button>
        </div>
      )}

      {loadingProducts ? (
        <ProductCardSkeletonGrid count={3} />
      ) : error ? (
        <ErrorState
          message={`No pudimos cargar tus productos: ${error}`}
          onRetry={() => setRetryTick((t) => t + 1)}
        />
      ) : (
        <ProducerInventoryList
          products={products}
          onChange={(updated) =>
            setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          }
        />
      )}
    </main>
  );
}
