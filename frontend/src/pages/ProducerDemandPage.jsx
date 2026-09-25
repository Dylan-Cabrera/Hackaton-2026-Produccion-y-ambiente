import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import B2BSupplyRecommendations from "@/components/B2BSupplyRecommendations";
import DemandHeatMap, { DemandLegend } from "@/components/DemandHeatMap";
import ErrorState from "@/components/ErrorState";
import KpiCard from "@/components/KpiCard";
import Skeleton from "@/components/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { getNeeds, getProducerDemand } from "@/lib/api";
import { cn } from "@/lib/utils";

// Validado con el validador de paleta (dataviz): verde/ámbar pasan contraste y visión normal;
// en protanopía quedan cerca (ΔE 6.6), por eso siempre van con leyenda, tooltip y números.
const COLOR_VIEWS = "#2e7d32";
const COLOR_CLICKS = "#d97706";

const PERIODS = [7, 30, 90];

const SERIES_LABELS = { views: "Visitas", clicks: "Contactos por WhatsApp" };

function formatDay(isoDate) {
  const [, month, day] = isoDate.split("-");
  return `${Number(day)}/${Number(month)}`;
}

function conversion(views, clicks) {
  if (views === 0) return null;
  return Math.round((clicks / views) * 100);
}

function Section({ title, description, action, children }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// HU-07: qué genera interés (visitas y contactos de tus productos, dónde se busca lo tuyo,
// términos de tu rubro) y qué te están pidiendo (necesidades abiertas de tu mismo rubro).
export default function ProducerDemandPage() {
  const { user, status } = useAuth();
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
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
    Promise.all([getProducerDemand(days), getNeeds({ category: user.category })])
      .then(([s, needs]) => {
        setSummary(s);
        setOpenNeeds(needs);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, days, retryTick]);

  if (status !== "authenticated" || user?.role !== "PRODUCER") {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  const periodPicker = (
    <div className="flex gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Período">
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setDays(p)}
          aria-pressed={days === p}
          className={cn(
            "cursor-pointer rounded-md px-3 py-1 text-sm font-medium transition-colors",
            days === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {p} días
        </button>
      ))}
    </div>
  );

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Demanda de mi negocio</h1>
        <p className="text-muted-foreground">
          Cuánta gente mira tus productos, cuántos te escriben y dónde se busca lo tuyo.
        </p>
      </div>
      {periodPicker}
    </div>
  );

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        {header}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-72" />
        <Skeleton className="h-80" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        {header}
        <ErrorState
          message={`No pudimos cargar tu demanda: ${error}`}
          onRetry={() => setRetryTick((t) => t + 1)}
        />
      </main>
    );
  }

  const { totals, clicksByLocality, topTerms, dailyActivity, productPerformance, demandHeat, demandByLocality } =
    summary;
  const totalConversion = conversion(totals.productViews, totals.whatsappClicks);
  const hasActivity = dailyActivity.some((d) => d.views > 0 || d.clicks > 0);
  const maxProductViews = Math.max(1, ...productPerformance.map((p) => Math.max(p.views, p.clicks)));
  const maxLocalityEvents = Math.max(1, ...demandByLocality.map((l) => l.events));
  const localityChart = clicksByLocality.map((c) => ({ name: c.locality, clics: c.clicks }));

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Visitas a tus productos" value={totals.productViews} hint="Veces que abrieron el detalle" />
        <KpiCard
          label="Contactos por WhatsApp"
          value={totals.whatsappClicks}
          hint={totalConversion !== null ? `${totalConversion}% de las visitas te escribió` : undefined}
        />
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

      <Section title="Visitas y contactos por día" description={`Últimos ${summary.days} días`}>
        {!hasActivity ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Todavía no hay visitas ni contactos en este período. Se registran cuando alguien abre uno de
            tus productos en el catálogo.
          </p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyActivity} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLOR_VIEWS} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={COLOR_VIEWS} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLOR_CLICKS} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={COLOR_CLICKS} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDay}
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  labelFormatter={formatDay}
                  formatter={(value, name) => [value, SERIES_LABELS[name] ?? name]}
                  contentStyle={{ borderRadius: 8, borderColor: "var(--color-border)", fontSize: 13 }}
                />
                <Legend formatter={(name) => SERIES_LABELS[name] ?? name} iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke={COLOR_VIEWS}
                  strokeWidth={2}
                  fill="url(#viewsFill)"
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke={COLOR_CLICKS}
                  strokeWidth={2}
                  fill="url(#clicksFill)"
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      <Section
        title="Tus productos"
        description="Cuántos lo vieron y cuántos de esos te escribieron"
        action={
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: COLOR_VIEWS }} />
              Visitas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: COLOR_CLICKS }} />
              Contactos
            </span>
          </div>
        }
      >
        {productPerformance.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Todavía no publicaste productos.</p>
        ) : (
          <ul className="divide-y divide-border">
            {productPerformance.map((p) => {
              const rate = conversion(p.views, p.clicks);
              return (
                <li key={p.productId} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,14rem)_1fr_auto] sm:items-center sm:gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    {!p.available && <p className="text-xs text-muted-foreground">Pausado</p>}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${(p.views / maxProductViews) * 100}%`, background: COLOR_VIEWS }}
                        />
                      </div>
                      <span className="w-20 text-right text-xs text-muted-foreground">{p.views} visitas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${(p.clicks / maxProductViews) * 100}%`, background: COLOR_CLICKS }}
                        />
                      </div>
                      <span className="w-20 text-right text-xs text-muted-foreground">{p.clicks} contactos</span>
                    </div>
                  </div>
                  <span
                    className="text-sm font-semibold sm:w-24 sm:text-right"
                    title="Porcentaje de visitas que terminaron en un contacto por WhatsApp"
                  >
                    {rate !== null ? `${rate}% conversión` : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section
        title="Dónde se busca lo tuyo"
        description={`Búsquedas, visitas y contactos de ${user.category} en la provincia`}
        action={<DemandLegend />}
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
          <DemandHeatMap cells={demandHeat} />
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Localidades con más demanda</h3>
            {demandByLocality.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos en este período.</p>
            ) : (
              <ol className="space-y-2">
                {demandByLocality.map((l, i) => (
                  <li key={l.locality} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>
                        {i + 1}. {l.locality}
                      </span>
                      <span className="text-muted-foreground">{l.events}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-[#ea580c]"
                        style={{ width: `${(l.events / maxLocalityEvents) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Un contacto por WhatsApp pesa 3; una búsqueda o una visita, 1.
            </p>
          </div>
        </div>
      </Section>

      {localityChart.length > 0 && (
        <Section title="De dónde te escriben" description="Contactos por WhatsApp según la localidad del cliente">
          <div style={{ height: Math.max(160, localityChart.length * 44) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={localityChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [value, "Contactos"]} cursor={{ fill: "var(--color-muted)" }} />
                <Bar dataKey="clics" fill={COLOR_CLICKS} radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {topTerms.length > 0 && (
        <Section title="Lo más buscado de tu rubro">
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
        </Section>
      )}

      {openNeeds.length > 0 && (
        <Section title={`Necesidades de ${user.category} que podrías cubrir`}>
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
        </Section>
      )}

      <B2BSupplyRecommendations />
    </main>
  );
}
