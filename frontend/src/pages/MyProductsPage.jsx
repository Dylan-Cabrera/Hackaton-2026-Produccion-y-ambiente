import { useEffect, useState } from "react";
import CatalogFeed from "@/components/CatalogFeed";
import ProducerProfileCard from "@/components/ProducerProfileCard";
import ProductCreateModal from "@/components/ProductCreateModal";
import ProductDetailView from "@/components/ProductDetailView";
import { getProducer, getProducerProducts } from "@/lib/api";

// Demo sin login: se trabaja con un productor fijo hasta que exista sesión real.
const DEMO_PRODUCER_ID = 1;

export default function MyProductsPage() {
  const [producer, setProducer] = useState(null);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    document.title = "Mis productos y excedentes · Mercado Km 0";
    getProducer(DEMO_PRODUCER_ID).then((p) => setProducer(p ?? null));
    getProducerProducts(DEMO_PRODUCER_ID).then(setProducts);
  }, []);

  const items = products.map((product) => ({
    product,
    producer: producer ?? undefined,
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
          producerId={DEMO_PRODUCER_ID}
          defaultCategory={producer?.category}
          onCreated={(p) => setProducts((prev) => [p, ...prev])}
        />
      </div>

      {producer && <ProducerProfileCard producer={producer} />}

      <CatalogFeed items={items} onSelect={setSelected} />

      <ProductDetailView item={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
