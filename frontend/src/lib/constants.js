// Categorías, unidades de stock, localidades y tipos de institución ya NO
// viven acá: son dinámicas, vienen de GET /api/meta (ver hooks/useMeta.js).
// Acá solo quedan sugerencias libres que el backend no valida contra una lista fija.

export const PAYMENT_METHODS = ["Efectivo", "Transferencia", "Tarjeta"];

export const DELIVERY_OPTIONS = ["Retiro en el local", "Envío a domicilio", "Punto de encuentro"];
