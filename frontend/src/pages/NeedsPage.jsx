import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NeedCard from "@/components/NeedCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useMeta } from "@/hooks/useMeta";
import { getNeeds } from "@/lib/api";

export default function NeedsPage() {
  const { status } = useAuth();
  const { meta } = useMeta();
  const navigate = useNavigate();
  const [needs, setNeeds] = useState([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Necesidades · Mercado Km 0";
  }, []);

  useEffect(() => {
    setLoading(true);
    getNeeds(category === "all" ? undefined : { category })
      .then(setNeeds)
      .finally(() => setLoading(false));
  }, [category]);

  function handlePublish() {
    if (status === "anonymous") {
      navigate("/login");
      return;
    }
    navigate("/necesidades/nueva");
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lo que están necesitando</h1>
          <p className="text-muted-foreground">
            Personas, instituciones y productores que buscan algo puntual.
          </p>
        </div>
        <Button size="lg" onClick={handlePublish}>
          Publicar lo que necesito
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={category === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setCategory("all")}
        >
          Todo
        </Button>
        {(meta?.categories ?? []).map((c) => (
          <Button
            key={c}
            variant={category === c ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : needs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No hay necesidades abiertas en esta categoría todavía.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {needs.map((need) => (
            <NeedCard key={need.id} need={need} />
          ))}
        </div>
      )}
    </main>
  );
}
