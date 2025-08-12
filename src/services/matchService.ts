/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/boot/firebase'
import {
  collection, query, where, orderBy, getDocs,
  doc, setDoc, updateDoc, deleteDoc, getDoc
} from 'firebase/firestore'
import type { Match, MatchStatus, MatchPhase } from '@/types/competition'
import { genMatchId } from '@/utils/id'
import { cleanUndefined } from '@/utils/sanitize'

const col = collection(db, 'matches')
const coll = (id: string) => doc(db, 'matches', id)

export async function setMatchScore(id: string, score: { home: number; away: number }) {
  await updateDoc(coll(id), { score })
}


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
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
}

export async function createMatch(payload: Omit<Match,'id'|'createdAt'|'createdBy'|'status'|'score'|'confirmedBy'> & { dateISO: string }, ctx: { uid: string }) {
  const dateMs = new Date(payload.dateISO).getTime()
  const id = genMatchId(payload.homeTeamId, payload.awayTeamId, dateMs)
  const ref = doc(col, id)

  // evita colisión
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

  await setDoc(ref, { ...cleanUndefined(data) })
  return id
}

export async function updateMatch(id: string, patch: Partial<Match>) {
  const ref = doc(col, id)
  await updateDoc(ref, cleanUndefined(patch as any))
}

export async function removeMatch(id: string) {
  await deleteDoc(doc(col, id))
}

export async function setMatchStatus(id: string, status: MatchStatus) {
  await updateMatch(id, { status })
  await updateDoc(coll(id), { status })
}

/** Marca como finalizado y quién confirma */
export async function confirmResult(id: string, by: 'manager' | 'admin', score?: { home: number; away: number }) {
  const patch: any = { status: 'finished', confirmedBy: by }
  if (score) patch.score = score
  await updateDoc(coll(id), patch)
}
