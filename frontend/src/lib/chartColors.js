// Colores de los gráficos, validados con el validador de paleta (dataviz) sobre fondo claro.
// Cada color significa siempre lo mismo en toda la app: verde = visitas, azul = búsquedas,
// ámbar = contactos por WhatsApp. Verde/ámbar quedan cerca en protanopía (ΔE 6.6),
// por eso los gráficos siempre llevan leyenda, tooltip y números.
export const COLOR_VIEWS = "#2e7d32";
export const COLOR_SEARCHES = "#2563eb";
export const COLOR_CLICKS = "#d97706";

export const AXIS_TICK = { fontSize: 12, fill: "var(--color-muted-foreground)" };
export const TOOLTIP_STYLE = { borderRadius: 8, borderColor: "var(--color-border)", fontSize: 13 };
