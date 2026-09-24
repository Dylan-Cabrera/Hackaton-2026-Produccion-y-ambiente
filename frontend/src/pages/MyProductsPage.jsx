import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CatalogFeed from "@/components/CatalogFeed";
import ProducerProfileCard from "@/components/ProducerProfileCard";
import ProducerProfileEditForm from "@/components/ProducerProfileEditForm";
import ProductCreateModal from "@/components/ProductCreateModal";
import ProductDetailView from "@/components/ProductDetailView";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getProducerProducts } from "@/lib/api";

export default function MyProductsPage() {
  const { user, status } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    document.title = "Mis productos y excedentes · Mercado Km 0";
  }, []);

  // Sin sesión no hay nada que mostrar: se redirige a login (HU-01: "Redirige a login").
  useEffect(() => {
    if (status === "anonymous") {
      navigate("/login");
    }
  }, [status, navigate]);

  useEffect(() => {
    if (user) getProducerProducts(user.id).then(setProducts);
  }, [user]);

  if (status === "loading" || status === "anonymous") {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  const items = products.map((product) => ({
    product,
    producer: user,
    distanceKm: null,
  }));

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis productos</h1>
          <p className="text-muted-foreground">
            Publicá rápido y marcá los excedentes como oferta.
          </p>
        </div>
        <ProductCreateModal
          producerId={user.id}
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

      <CatalogFeed items={items} onSelect={setSelected} />

      <ProductDetailView item={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
