export function cleanUndefined<T extends Record<string, unknown>>(o: T): T {
  const out: Partial<T> = {}
  for (const k in o) if (o[k] !== undefined) out[k] = o[k]
  return out as T
}
