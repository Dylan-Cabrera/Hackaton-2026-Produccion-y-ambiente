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

const SERIES_LABELS = {
  views: "Visitas",
  clicks: "Contactos por WhatsApp",
  found: "Encontraron productos",
  notFound: "No encontraron nada",
};

const AXIS_TICK = { fontSize: 12, fill: "var(--color-muted-foreground)" };
const TOOLTIP_STYLE = { borderRadius: 8, borderColor: "var(--color-border)", fontSize: 13 };

// Recharts ordena la leyenda alfabéticamente: se fuerza el mismo orden que las barras
const SERIES_ORDER = ["views", "clicks", "found", "notFound"];
const sortLegend = (item) => SERIES_ORDER.indexOf(item.dataKey);

// Lunes primero (así se piensa la semana acá); getDay() devuelve 0 = domingo
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const WEEKDAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"];

function listJoin(items) {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
}

function byWeekday(dailyActivity) {
  const totals = WEEKDAYS.map((day) => ({ day, views: 0, clicks: 0 }));
  for (const d of dailyActivity) {
    const [year, month, day] = d.date.split("-").map(Number);
    const index = (new Date(year, month - 1, day).getDay() + 6) % 7;
    totals[index].views += d.views;
    totals[index].clicks += d.clicks;
  }
  return totals;
}

function shorten(text, max = 22) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

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
    document.title = "Demanda de mi negocio · Formosa Unida";
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
  const productChart = productPerformance.map((p) => ({ name: p.title, views: p.views, clicks: p.clicks }));
  const hasProductActivity = productPerformance.some((p) => p.views > 0 || p.clicks > 0);
  const weekdayChart = byWeekday(dailyActivity);
  const busiestTotal = Math.max(...weekdayChart.map((d) => d.views + d.clicks));
  const busiestDays = listJoin(
    weekdayChart.flatMap((d, i) => (d.views + d.clicks === busiestTotal ? [WEEKDAY_NAMES[i]] : [])),
  );
  const termsChart = topTerms.map((t) => ({ name: t.term, found: t.count - t.fails, notFound: t.fails }));
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
                <Legend formatter={(name) => SERIES_LABELS[name] ?? name} itemSorter={sortLegend} iconType="circle" />
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

      <Section title="Tus productos" description="Cuántos lo vieron y cuántos de esos te escribieron">
        {productPerformance.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Todavía no publicaste productos.</p>
        ) : (
          <>
            {hasProductActivity && (
              <div style={{ height: Math.max(200, productChart.length * 64) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productChart} layout="vertical" margin={{ left: 8, right: 16 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                    <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={190}
                      tick={AXIS_TICK}
                      tickFormatter={(name) => shorten(name, 26)}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value, name) => [value, SERIES_LABELS[name] ?? name]}
                      cursor={{ fill: "var(--color-muted)" }}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Legend formatter={(name) => SERIES_LABELS[name] ?? name} itemSorter={sortLegend} iconType="circle" />
                    <Bar dataKey="views" fill={COLOR_VIEWS} radius={[0, 4, 4, 0]} barSize={14} />
                    <Bar dataKey="clicks" fill={COLOR_CLICKS} radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Producto</th>
                    <th className="py-2 pr-3 text-right font-medium">Visitas</th>
                    <th className="py-2 pr-3 text-right font-medium">Contactos</th>
                    <th
                      className="py-2 text-right font-medium"
                      title="Porcentaje de visitas que terminaron en un contacto por WhatsApp"
                    >
                      Conversión
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productPerformance.map((p) => {
                    const rate = conversion(p.views, p.clicks);
                    return (
                      <tr key={p.productId}>
                        <td className="py-2 pr-3">
                          {p.title}
                          {!p.available && <span className="ml-2 text-xs text-muted-foreground">(pausado)</span>}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">{p.views}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{p.clicks}</td>
                        <td className="py-2 text-right font-semibold tabular-nums">
                          {rate !== null ? `${rate}%` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Section>

      {hasActivity && (
        <Section
          title="Qué días te buscan más"
          description={`Visitas y contactos sumados por día de la semana · te buscan más los ${busiestDays}`}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayChart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="day" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value, name) => [value, SERIES_LABELS[name] ?? name]}
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Legend formatter={(name) => SERIES_LABELS[name] ?? name} itemSorter={sortLegend} iconType="circle" />
                <Bar dataKey="views" fill={COLOR_VIEWS} radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="clicks" fill={COLOR_CLICKS} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

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
        <Section
          title="Lo más buscado de tu rubro"
          description="Lo naranja son búsquedas que no encontraron nada: gente que quiere comprar y no encuentra quién venda"
        >
          <div style={{ height: Math.max(180, termsChart.length * 40) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={termsChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={AXIS_TICK}
                  tickFormatter={(name) => shorten(name, 18)}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value, name) => [value, SERIES_LABELS[name] ?? name]}
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Legend formatter={(name) => SERIES_LABELS[name] ?? name} itemSorter={sortLegend} iconType="circle" />
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
