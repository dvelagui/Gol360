/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */
/** Quita tildes/diacríticos de forma segura.
 *  Acepta cualquier valor y lo castea a string.
 *  Si el entorno no soporta String.prototype.normalize, hace fallback.
 */
function removeDiacritics(input: unknown): string {
  const s = `${input ?? ''}` // fuerza a string
  // algunos entornos pueden no tener normalize; protegemos la llamada
  const n = (typeof (s as any).normalize === 'function')
    ? (s as any).normalize('NFD')
    : s
  return n.replace(/[\u0300-\u036f]/g, '')
}

/** Primer carácter alfabético (A-Z); si no hay, devuelve 'X' */
function firstAlpha(value: unknown): string {
  const s = removeDiacritics(value)
  const m = s.match(/[A-Za-z]/)
  return (m ? m[0] : 'X').toUpperCase()
}

/** Día del año (1-366) */
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/** Número a base36 en mayúsculas, con padding */
function toB36(n: number, len = 2): string {
  return Math.max(0, Math.trunc(n)).toString(36).toUpperCase().padStart(len, '0')
}

/** ID corto para torneos: [InicialNombre][AñoBase36][DíaBase36][RandBase36]
 *  Ej: G7AB3X
 */
export function genTournamentId(name: string, dateISO?: string): string {
  const now = dateISO ? new Date(dateISO) : new Date()
  const N  = firstAlpha(name)                          // 1 char
  const Y  = toB36(now.getFullYear() % 36, 1)          // 1 char
  const DD = toB36(dayOfYear(now), 2)                  // 2 chars
  const RR = toB36(Math.floor(Math.random() * 36 * 36), 2) // 2 chars
  return `${N}${Y}${DD}${RR}`
}

/** ID corto para partidos: [InicialLocal][InicialVisita][AñoBase36][DíaBase36][RandBase36]
 *  homeSlug/awaySlug pueden ser nombres o slugs; tomamos la primera letra alfabética.
 */
export function genMatchId(homeSlug: string, awaySlug: string, dateMs?: number): string {
  const d = dateMs ? new Date(dateMs) : new Date()
  const day = toB36(d.getFullYear() % 36, 1) + toB36(dayOfYear(d), 2) // 3 chars
  const ha  = firstAlpha(homeSlug) + firstAlpha(awaySlug)             // 2 chars
  const r   = toB36(Math.floor(Math.random() * 36 * 36), 2)           // 2 chars
  return `${ha}${day}${r}`                                            // total 7 chars
}

export { removeDiacritics, firstAlpha, dayOfYear, toB36 }
