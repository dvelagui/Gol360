function removeDiacritics(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function firstAlpha(s: string): string {
  const m = removeDiacritics(s).match(/[A-Za-z]/)
  return (m ? m[0] : 'X').toUpperCase()
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function toB36(n: number, len = 2): string {
  return n.toString(36).toUpperCase().padStart(len, '0')
}

export function genTournamentId(name: string, dateISO?: string): string {
  const now = dateISO ? new Date(dateISO) : new Date()
  const N  = firstAlpha(name)
  const Y  = toB36(now.getFullYear() % 36, 1)
  const DD = toB36(dayOfYear(now), 2)
  const RR = toB36(Math.floor(Math.random() * 36 * 36), 2)
  return `${N}${Y}${DD}${RR}`
}
export function genMatchId(homeSlug: string, awaySlug: string, dateMs?: number){
  const d = dateMs ? new Date(dateMs) : new Date()
  const day = toB36(d.getFullYear()%36,1) + toB36(dayOfYear(d),2)
  const ha = firstAlpha(homeSlug) + firstAlpha(awaySlug)
  const r  = toB36(Math.floor(Math.random()*1296),2)
  return `${ha}${day}${r}`
}
