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
import KpiCard from "@/components/KpiCard";
import { useAuth } from "@/context/AuthContext";
import { getMyContactClicksSummary, getNeeds } from "@/lib/api";

// HU-07: qué genera interés (clics de contacto por producto) y qué te están
// pidiendo (necesidades abiertas de tu mismo rubro).
export default function ProducerDemandPage() {
  const { user, status } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [openNeeds, setOpenNeeds] = useState([]);
  const [loading, setLoading] = useState(true);

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
    Promise.all([getMyContactClicksSummary(), getNeeds({ category: user.category })])
      .then(([s, needs]) => {
        setSummary(s);
        setOpenNeeds(needs);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (status !== "authenticated" || user?.role !== "PRODUCER" || loading || !summary) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  const topProduct = summary.byProduct[0];
  const chartData = summary.byProduct.map((p) => ({
    name: p.title.length > 22 ? `${p.title.slice(0, 22)}…` : p.title,
    clics: p.count,
  }));

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Demanda de mi negocio</h1>
        <p className="text-muted-foreground">Qué está generando interés y qué te están pidiendo.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Clics de contacto (total)" value={summary.total} />
        <KpiCard
          label="Producto más consultado"
          value={topProduct ? topProduct.count : 0}
          hint={topProduct?.title}
        />
        <KpiCard
          label={`Necesidades abiertas de ${user.category}`}
          value={openNeeds.length}
          hint={openNeeds.length > 0 ? "Podés ofrecerte a cubrirlas" : "Ninguna por ahora"}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Clics de contacto por producto
        </h2>
        {summary.total === 0 ? (
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
    </main>
  );
}
