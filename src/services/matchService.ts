import { db } from '@/boot/firebase'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  type DocumentData,
  type FirestoreDataConverter
} from 'firebase/firestore'
import type { Match, MatchStatus, MatchPhase } from '@/types/competition'
import { genMatchId } from '@/utils/id'
import { cleanUndefined } from '@/utils/sanitize'

/** Converter: tipa la colección como Match y elimina undefineds al escribir */
const matchConverter: FirestoreDataConverter<Match> = {
  toFirestore(m: Match): DocumentData {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return cleanUndefined(m as any) as DocumentData
  },
  fromFirestore(snap, options): Match {
    const data = snap.data(options) as Omit<Match, 'id'>
    return { id: snap.id, ...data }
  }
}

// Colección y helper de doc con converter
const col = collection(db, 'matches').withConverter(matchConverter)
const coll = (id: string) => doc(col, id)

/** Actualiza marcador (solo score) */
export async function setMatchScore(id: string, score: { home: number; away: number }): Promise<void> {
  await updateDoc(coll(id), { score })
}

/** Lista partidos por torneo con filtros (Paquete 1/2: Match.date:number) */
export async function listMatchesByTournament(
  tournamentId: string,
  opts?: { status?: MatchStatus; phase?: MatchPhase; round?: string | number }
): Promise<Match[]> {
  const clauses = [where('tournamentId', '==', tournamentId)]
  if (opts?.status) clauses.push(where('status', '==', opts.status))
  if (opts?.phase)  clauses.push(where('phase', '==', opts.phase))
  if (opts?.round !== undefined) clauses.push(where('round', '==', opts.round))

  const q = query(col, ...clauses, orderBy('date', 'asc'))
  const snap = await getDocs(q) // QuerySnapshot<Match>
  return snap.docs.map(d => d.data())
}

/** Crea partido (recibe dateISO, guarda date:number) */
export async function createMatch(
  payload: Omit<Match, 'id' | 'createdAt' | 'createdBy' | 'status' | 'score' | 'confirmedBy'> & { dateISO: string },
  ctx: { uid: string }
): Promise<string> {
  const dateMs = new Date(payload.dateISO).getTime()
  const id = genMatchId(payload.homeTeamId, payload.awayTeamId, dateMs)
  const ref = coll(id)

  const ex = await getDoc(ref)
  if (ex.exists()) {
    // reintento simple en caso de colisión
    return createMatch(payload, ctx)
  }

  const data: Match = {
    id,
    tournamentId: payload.tournamentId,
    round: payload.round,
    phase: payload.phase,
    date: dateMs, // Paquete 1/2 usa 'date' (ms)
    field: payload.field ?? '',
    homeTeamId: payload.homeTeamId,
    awayTeamId: payload.awayTeamId,
    referee: payload.referee ?? '',
    status: 'scheduled',
    score: { home: 0, away: 0 },
    confirmedBy: null,
    notes: payload.notes ?? '',
    createdBy: ctx.uid,
    createdAt: Date.now()
  }

  await setDoc(ref, data) // gracias al converter, acepta Match directo
  return id
}

/** Update parcial; omite undefined y hace merge */
export async function updateMatch(id: string, patch: Partial<Match>): Promise<void> {
  const payload = cleanUndefined(patch)
  // Con converter + merge, evitamos choques con opcionales (exactOptionalPropertyTypes)
  await setDoc(coll(id), payload as Match, { merge: true })
}

/** Elimina partido */
export async function removeMatch(id: string): Promise<void> {
  await deleteDoc(coll(id))
}

/** Cambia estado del partido */
export async function setMatchStatus(id: string, status: MatchStatus): Promise<void> {
  await updateDoc(coll(id), { status })
}

/** Marca como finalizado y quién confirma (opcionalmente con score) */
export async function confirmResult(
  id: string,
  by: 'manager' | 'admin',
  score?: { home: number; away: number }
): Promise<void> {
  const patch: Partial<Match> = { status: 'finished', confirmedBy: by }
  if (score) patch.score = score
  await updateMatch(id, patch)
}
