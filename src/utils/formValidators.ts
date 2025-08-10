export const req = (v?: string) => (!!v && String(v).trim().length > 0) || 'Requerido'
export const positiveInt = (n?: number) => (n && n > 0) || 'Debe ser > 0'
