import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorState from "@/components/ErrorState";
import KpiCard from "@/components/KpiCard";
import Skeleton from "@/components/Skeleton";
import VacancyMap from "@/components/VacancyMap";
import { useAuth } from "@/context/AuthContext";
import { getAdminSummary } from "@/lib/api";

export default function AdminDashboardPage() {
  const { user, status } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    document.title = "Dashboard admin · Formosa Unida";
  }, []);

  useEffect(() => {
    if (status === "anonymous") {
      navigate("/login");
    } else if (status === "authenticated" && user?.role !== "ADMIN") {
      navigate("/");
    }
  }, [status, user, navigate]);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    setLoading(true);
    setError(null);
    getAdminSummary()
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, retryTick]);

  if (status !== "authenticated" || user?.role !== "ADMIN") {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard provincial</h1>
        <p className="text-muted-foreground">Estado general de la plataforma.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          message={`No pudimos cargar el resumen: ${error}`}
          onRetry={() => setRetryTick((t) => t + 1)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Productores" value={summary.totals.producers} />
          <KpiCard label="Consumidores" value={summary.totals.consumers} />
          <KpiCard label="Instituciones" value={summary.totals.institutions} hint="Comedores, escuelas, ONGs…" />
          <KpiCard label="Productos activos" value={summary.totals.activeProducts} />
          <KpiCard label="Ofertas activas" value={summary.totals.activeOffers} />
          <KpiCard label="Necesidades abiertas" value={summary.totals.openNeeds} />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Mapa de vacíos productivos</h2>
        <VacancyMap />
      </div>
    </main>
  );
}
