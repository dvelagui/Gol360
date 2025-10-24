export const req = (v?: string) => (!!v && String(v).trim().length > 0) || 'Requerido'
export const positiveInt = (n?: number) => (n && n > 0) || 'Debe ser > 0'
export const emailRule = (val: string) => !!val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Ingrese un email válido'
export const passwordRule = (val: string) => (!!val && val.length >= 6) || 'Mínimo 6 caracteres'
