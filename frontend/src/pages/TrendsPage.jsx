import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SearchX, TrendingUp } from "lucide-react";
import DashboardSection from "@/components/DashboardSection";
import ErrorState from "@/components/ErrorState";
import KpiCard from "@/components/KpiCard";
import Skeleton from "@/components/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { getTrends } from "@/lib/api";
import { AXIS_TICK, COLOR_CLICKS, COLOR_SEARCHES, COLOR_VIEWS, TOOLTIP_STYLE } from "@/lib/chartColors";
import { cn } from "@/lib/utils";

const PERIODS = [7, 30, 90];

const SERIES_LABELS = {
  views: "Visitas a productos",
  searches: "Búsquedas",
  contacts: "Contactos por WhatsApp",
  demand: "Demanda",
  found: "Encontraron productos",
  notFound: "No encontraron nada",
  openNeeds: "Necesidades abiertas",
  events: "Demanda",
};

// Recharts ordena la leyenda alfabéticamente: se fuerza el mismo orden que las series
const SERIES_ORDER = ["views", "searches", "contacts", "found", "notFound"];
const sortLegend = (item) => SERIES_ORDER.indexOf(item.dataKey);
const legendLabel = (name) => SERIES_LABELS[name] ?? name;
const tooltipValue = (value, name) => [value, SERIES_LABELS[name] ?? name];

// Un rubro con mucha demanda y poca oferta publicada es una oportunidad para producir
const OPPORTUNITY_RATIO = 5;

function formatDay(isoDate) {
  const [, month, day] = isoDate.split("-");
  return `${Number(day)}/${Number(month)}`;
}

function shorten(text, max = 22) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function isOpportunity(c) {
  return c.demand > 0 && c.demand / Math.max(1, c.availableProducts) >= OPPORTUNITY_RATIO;
}

function EmptyChart({ children }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

// Tendencias generales de toda la plataforma (solo ADMIN): qué se busca, qué se mira, qué se
// consulta y qué se pide, para ver dónde falta oferta y qué rubros impulsar.
export default function TrendsPage() {
  const { user, status } = useAuth();
  const navigate = useNavigate();
  const isAdmin = status === "authenticated" && user?.role === "ADMIN";
  const [days, setDays] = useState(30);
  const [trends, setTrends] = useState(null);
  const [error, setError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    document.title = "Tendencias · Formosa Unida";
  }, []);

  // Sin sesión va al login; con sesión pero sin ser ADMIN, al inicio (igual que el dashboard admin)
  useEffect(() => {
    if (status === "anonymous") {
      navigate("/login");
    } else if (status === "authenticated" && user?.role !== "ADMIN") {
      navigate("/");
    }
  }, [status, user, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    getTrends(days)
      .then((data) => {
        if (!cancelled) {
          setTrends(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, days, retryTick]);

  const loading = !trends || trends.days !== days;

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
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
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <TrendingUp className="size-7 text-primary" />
          Tendencias
        </h1>
        <p className="text-muted-foreground">
          Qué se busca, qué se consulta y qué se está pidiendo en toda la provincia.
        </p>
      </div>
      {periodPicker}
    </div>
  );

  if (error && !trends) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {header}
        <ErrorState
          message={`No pudimos cargar las tendencias: ${error}`}
          onRetry={() => setRetryTick((t) => t + 1)}
        />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {header}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </main>
    );
  }

  const { totals, daily, categories, topProducts, topTerms, unmetTerms, localities } = trends;
  const failRate = totals.searches > 0 ? Math.round((totals.searchFails / totals.searches) * 100) : null;
  const hasDaily = daily.some((d) => d.searches + d.views + d.contacts > 0);
  const demandedCategories = categories.filter((c) => c.demand > 0).slice(0, 8);
  const requestedCategories = categories.filter((c) => c.openNeeds > 0).sort((a, b) => b.openNeeds - a.openNeeds);
  // Dos productores pueden publicar el mismo producto: el eje usa el id y la etiqueta suma el productor
  const productChart = topProducts.map((p) => ({ ...p, name: `${p.title} · ${p.businessName}` }));
  const productLabel = new Map(productChart.map((p) => [p.productId, p.name]));
  const termsChart = topTerms.map((t) => ({ name: t.term, found: t.count - t.fails, notFound: t.fails }));

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Búsquedas"
          value={totals.searches}
          hint={failRate !== null ? `${failRate}% no encontró nada` : undefined}
        />
        <KpiCard label="Visitas a productos" value={totals.views} hint="Veces que se abrió un producto" />
        <KpiCard label="Contactos por WhatsApp" value={totals.contacts} hint="Consultas directas a productores" />
        <KpiCard
          label="Necesidades abiertas"
          value={totals.openNeeds}
          hint="Pedidos publicados sin resolver"
        />
      </div>

      <DashboardSection title="Actividad en la plataforma" description={`Por día, últimos ${days} días`}>
        {!hasDaily ? (
          <EmptyChart>Todavía no hay actividad registrada en este período.</EmptyChart>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDay}
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <Tooltip labelFormatter={formatDay} formatter={tooltipValue} contentStyle={TOOLTIP_STYLE} />
                <Legend formatter={legendLabel} itemSorter={sortLegend} iconType="circle" />
                <Line type="monotone" dataKey="views" stroke={COLOR_VIEWS} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="searches" stroke={COLOR_SEARCHES} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="contacts" stroke={COLOR_CLICKS} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Rubros más demandados"
        description="Búsquedas, visitas y contactos por rubro (un contacto por WhatsApp pesa 3), frente a lo que hay publicado"
      >
        {demandedCategories.length === 0 ? (
          <EmptyChart>Todavía no hay demanda registrada en este período.</EmptyChart>
        ) : (
          <>
            <div style={{ height: Math.max(200, demandedCategories.length * 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandedCategories} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="category" width={150} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <Tooltip formatter={tooltipValue} cursor={{ fill: "var(--color-muted)" }} contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="demand" fill={COLOR_VIEWS} radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Rubro</th>
                    <th className="py-2 pr-3 text-right font-medium">Búsquedas</th>
                    <th className="py-2 pr-3 text-right font-medium">Visitas</th>
                    <th className="py-2 pr-3 text-right font-medium">Contactos</th>
                    <th className="py-2 pr-3 text-right font-medium">Productos publicados</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {demandedCategories.map((c) => (
                    <tr key={c.category}>
                      <td className="py-2 pr-3">{c.category}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{c.searches}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{c.views}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{c.contacts}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{c.availableProducts}</td>
                      <td className="py-2 text-right">
                        {isOpportunity(c) && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-offer px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-offer-foreground"
                            title="Mucha demanda para lo poco que hay publicado"
                          >
                            <TrendingUp className="size-3" />
                            Falta oferta
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DashboardSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Productos más consultados" description="Los que más gente abrió y por los que más escribieron">
          {productChart.length === 0 ? (
            <EmptyChart>Todavía no hay visitas ni contactos a productos en este período.</EmptyChart>
          ) : (
            <div style={{ height: Math.max(220, productChart.length * 52) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productChart} layout="vertical" margin={{ left: 8, right: 16 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="productId"
                    width={190}
                    tick={AXIS_TICK}
                    tickFormatter={(id) => shorten(productLabel.get(id) ?? "", 30)}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={tooltipValue}
                    labelFormatter={(id) => productLabel.get(id) ?? id}
                    cursor={{ fill: "var(--color-muted)" }}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Legend formatter={legendLabel} itemSorter={sortLegend} iconType="circle" />
                  <Bar dataKey="views" fill={COLOR_VIEWS} radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="contacts" fill={COLOR_CLICKS} radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashboardSection>

        <DashboardSection
          title="Lo más buscado"
          description="Lo naranja es gente que buscó y no encontró quién venda"
        >
          {termsChart.length === 0 ? (
            <EmptyChart>Todavía no hay búsquedas en este período.</EmptyChart>
          ) : (
            <div style={{ height: Math.max(220, termsChart.length * 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={termsChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={AXIS_TICK}
                    tickFormatter={(name) => shorten(name, 18)}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip formatter={tooltipValue} cursor={{ fill: "var(--color-muted)" }} contentStyle={TOOLTIP_STYLE} />
                  <Legend formatter={legendLabel} itemSorter={sortLegend} iconType="circle" />
                  {/* stroke del color de la tarjeta: separa los dos tramos apilados */}
                  <Bar dataKey="found" stackId="terms" fill={COLOR_VIEWS} stroke="var(--color-card)" strokeWidth={2} barSize={18} />
                  <Bar
                    dataKey="notFound"
                    stackId="terms"
                    fill={COLOR_CLICKS}
                    stroke="var(--color-card)"
                    strokeWidth={2}
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashboardSection>
      </div>

      {unmetTerms.length > 0 && (
        <section className="rounded-xl border border-[#fdba74] bg-offer/60 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold">
                <SearchX className="size-5 text-offer-foreground" />
                Se busca y no se encuentra
              </h2>
              <p className="text-sm text-muted-foreground">
                Productos que la gente buscó sin encontrar a nadie que los venda: demanda que hoy no tiene oferta.
              </p>
            </div>
          </div>
          <ul className="flex flex-wrap gap-2">
            {unmetTerms.map((t) => (
              <li
                key={t.term}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
              >
                <span className="font-medium">{t.term}</span>
                <span className="rounded-full bg-offer px-2 text-xs font-semibold text-offer-foreground">
                  {t.fails} {t.fails === 1 ? "búsqueda" : "búsquedas"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Lo que más se está pidiendo"
          description="Necesidades abiertas por rubro (comedores, escuelas, comercios…)"
          action={
            <Link to="/necesidades" className="text-sm font-semibold text-primary underline underline-offset-4">
              Ver necesidades
            </Link>
          }
        >
          {requestedCategories.length === 0 ? (
            <EmptyChart>No hay necesidades abiertas en este momento.</EmptyChart>
          ) : (
            <div style={{ height: Math.max(180, requestedCategories.length * 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={requestedCategories} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="category" width={150} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <Tooltip formatter={tooltipValue} cursor={{ fill: "var(--color-muted)" }} contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="openNeeds" fill={COLOR_VIEWS} radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashboardSection>

        <DashboardSection
          title="Localidades con más demanda"
          description="Búsquedas, visitas y contactos según desde dónde se hicieron"
          action={
            <Link to="/mapa" className="text-sm font-semibold text-primary underline underline-offset-4">
              Ver en el mapa
            </Link>
          }
        >
          {localities.length === 0 ? (
            <EmptyChart>Todavía no hay demanda con ubicación en este período.</EmptyChart>
          ) : (
            <div style={{ height: Math.max(180, localities.length * 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={localities} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="locality" width={120} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <Tooltip formatter={tooltipValue} cursor={{ fill: "var(--color-muted)" }} contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="events" fill={COLOR_VIEWS} radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashboardSection>
      </div>
    </main>
  );
}
