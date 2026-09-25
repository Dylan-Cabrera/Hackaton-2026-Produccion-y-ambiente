export const EVENT_TYPES = ['SEARCH_HIT', 'SEARCH_FAIL', 'WHATSAPP_CLICK'] as const;
export type EventType = (typeof EVENT_TYPES)[number];
