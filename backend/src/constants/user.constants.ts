export const ROLES = ['CONSUMER', 'PRODUCER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

// Solo aplica a cuentas CONSUMER
export const ACCOUNT_TYPES = ['PERSONA', 'INSTITUCION'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

// Solo aplica cuando accountType = 'INSTITUCION'
export const INSTITUTION_TYPES = ['Comedor', 'Escuela', 'ONG', 'Municipio', 'Comercio', 'Otro'] as const;
export type InstitutionType = (typeof INSTITUTION_TYPES)[number];
