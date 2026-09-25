// Tarjeta con título, bajada opcional y una acción a la derecha (leyenda, filtro…)
export default function DashboardSection({ title, description, action, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-border bg-card p-4 sm:p-5 ${className}`}>
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
