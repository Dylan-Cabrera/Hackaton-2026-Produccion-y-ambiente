export const EVENT_TYPES = ['SEARCH_HIT', 'SEARCH_FAIL', 'WHATSAPP_CLICK', 'PRODUCT_VIEW'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

// Eventos atados a un producto concreto: se valida que exista y que sea del productor indicado
export const PRODUCT_EVENT_TYPES: readonly EventType[] = ['WHATSAPP_CLICK', 'PRODUCT_VIEW'];
