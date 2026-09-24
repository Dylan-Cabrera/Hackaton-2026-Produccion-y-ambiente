export const ROLES = ['CONSUMER', 'PRODUCER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

// Solo aplica a cuentas CONSUMER
export const ACCOUNT_TYPES = ['PERSONA', 'INSTITUCION'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];
