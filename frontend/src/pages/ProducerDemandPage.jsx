import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import B2BSupplyRecommendations from "@/components/B2BSupplyRecommendations";
import ErrorState from "@/components/ErrorState";
import KpiCard from "@/components/KpiCard";
import Skeleton from "@/components/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { getNeeds, getProducerDemand } from "@/lib/api";

// HU-07: qué genera interés (clics de contacto por localidad, términos buscados de tu
// rubro) y qué te están pidiendo (necesidades abiertas de tu mismo rubro).
export default function ProducerDemandPage() {
  const { user, status } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [openNeeds, setOpenNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    document.title = "Demanda de mi negocio · Mercado Km 0";
  }, []);

  useEffect(() => {
    if (status === "anonymous") {
      navigate("/login");
    } else if (status === "authenticated" && user?.role !== "PRODUCER") {
      navigate("/");
    }
  }, [status, user, navigate]);

  useEffect(() => {
    if (user?.role !== "PRODUCER") return;
    setLoading(true);
    setError(null);
    Promise.all([getProducerDemand(), getNeeds({ category: user.category })])
      .then(([s, needs]) => {
        setSummary(s);
        setOpenNeeds(needs);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, retryTick]);

  if (status !== "authenticated" || user?.role !== "PRODUCER") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-72" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <ErrorState
          message={`No pudimos cargar tu demanda: ${error}`}
          onRetry={() => setRetryTick((t) => t + 1)}
        />
      </main>
    );
  }

  const { totals, clicksByLocality, topTerms } = summary;
  const chartData = clicksByLocality.map((c) => ({
    name: c.locality,
    clics: c.clicks,
  }));

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Demanda de mi negocio</h1>
        <p className="text-muted-foreground">
          Qué está generando interés y qué te están pidiendo (últimos {summary.days} días).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Clics de contacto (total)" value={totals.whatsappClicks} />
        <KpiCard
          label="Búsquedas de tu rubro"
          value={totals.relatedSearches}
          hint={totals.relatedFails > 0 ? `${totals.relatedFails} sin resultados` : undefined}
        />
        <KpiCard
          label="Necesidades cerca que podrías cubrir"
          value={totals.openNeedsNearby}
          hint={totals.openNeedsNearby > 0 ? "Mirá el detalle abajo" : "Ninguna por ahora"}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Clics de contacto por localidad
        </h2>
        {totals.whatsappClicks === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Todavía no tenés clics de contacto registrados.
          </p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="clics" fill="var(--color-primary, #2f6b3a)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {topTerms.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Términos más buscados de tu rubro
          </h2>
          <ul className="space-y-1 text-sm">
            {topTerms.map((t) => (
              <li key={t.term} className="flex items-center justify-between">
                <span>{t.term}</span>
                <span className="text-muted-foreground">
                  {t.count} búsquedas{t.fails > 0 && ` · ${t.fails} sin resultados`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {openNeeds.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Necesidades de {user.category} que podrías cubrir
          </h2>
          <ul className="space-y-2 text-sm">
            {openNeeds.map((need) => (
              <li key={need.id} className="flex items-center justify-between gap-2">
                <span>
                  {need.title} — {need.quantity} {need.unit} ({need.frequency})
                </span>
                <Link to={`/necesidades/${need.id}`} className="text-primary underline">
                  Ver
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <B2BSupplyRecommendations />
    </main>
  );
}
