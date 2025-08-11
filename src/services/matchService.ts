import { db } from '@/boot/firebase'
import {
  collection, query, where, orderBy, getDocs,
  doc, setDoc, updateDoc, deleteDoc, getDoc
} from 'firebase/firestore'
import type { Match, MatchStatus, MatchPhase } from '@/types/competition'
import { genMatchId } from '@/utils/id'
import { cleanUndefined } from '@/utils/sanitize'

const col = collection(db, 'matches')

export async function listMatchesByTournament(
  tournamentId: string,
  opts?: { status?: MatchStatus; phase?: MatchPhase; round?: string|number }
): Promise<Match[]> {
  const clauses = [ where('tournamentId','==',tournamentId) ]
  if (opts?.status) clauses.push(where('status','==',opts.status))
  if (opts?.phase)  clauses.push(where('phase','==',opts.phase))
  if (opts?.round !== undefined) clauses.push(where('round','==',opts.round))
  const q = query(col, ...clauses, orderBy('date','asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...data } = d.data() as Match
    return { id: d.id, ...data }
  })
}

export async function createMatch(payload: Omit<Match,'id'|'createdAt'|'createdBy'|'status'|'score'|'confirmedBy'> & { dateISO: string }, ctx: { uid: string }) {
  const dateMs = new Date(payload.dateISO).getTime()
  const id = genMatchId(payload.homeTeamId, payload.awayTeamId, dateMs)
  const ref = doc(col, id)

  const ex = await getDoc(ref)
  if (ex.exists()) return createMatch(payload, ctx) // reintento simple

  const data: Match = {
    id,
    tournamentId: payload.tournamentId,
    round: payload.round,
    phase: payload.phase,
    date: dateMs,
    field: payload.field,
    homeTeamId: payload.homeTeamId,
    awayTeamId: payload.awayTeamId,
    referee: payload.referee ?? '',
    status: 'scheduled',
    score: { home: 0, away: 0 },
    confirmedBy: null,
    notes: payload.notes ?? '',
    createdBy: ctx.uid,
    createdAt: Date.now(),
  }

  await setDoc(ref, cleanUndefined(data as unknown as Record<string, unknown>))
  return id
}

export async function updateMatch(id: string, patch: Partial<Match>) {
  const ref = doc(col, id)
  await updateDoc(ref, cleanUndefined(patch))
}

export async function removeMatch(id: string) {
  await deleteDoc(doc(col, id))
}

export async function setMatchStatus(id: string, status: MatchStatus) {
  await updateMatch(id, { status })
}
