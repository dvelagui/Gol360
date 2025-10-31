/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
  increment,
  type Query
} from 'firebase/firestore'
import { colMatchVideos } from './firestore/collections'

export type VideoType = 'highlights' | 'full-match' | 'goals' | 'analysis'

export interface MatchVideo {
  id?: string
  matchId: string
  tournamentId: string
  youtubeUrl: string
  videoType: VideoType
  title: string
  description?: string
  duration?: string
  thumbnailUrl?: string
  uploadedBy: string
  views?: number
  featured?: boolean
  createdAt: string
  updatedAt?: string

  // Datos desnormalizados para búsqueda
  homeTeamName: string
  awayTeamName: string
  matchDate: string
  round?: string
  phase?: string
}

/**
 * Extrae el ID de YouTube de una URL
 */
export function extractYouTubeId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[7] && match[7].length === 11) ? match[7] : null
}

/**
 * Obtiene la URL del thumbnail de YouTube
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  return `https://img.youtube.com/vi/${videoId}/${quality === 'default' ? 'default' : quality === 'medium' ? 'mqdefault' : quality === 'high' ? 'hqdefault' : 'maxresdefault'}.jpg`
}

/**
 * Crea un nuevo video
 */
export async function createMatchVideo(
  payload: Omit<MatchVideo, 'id' | 'createdAt' | 'views'>
): Promise<string> {
  const ref = doc(colMatchVideos)
  const videoId = extractYouTubeId(payload.youtubeUrl)

  const data: any = {
    id: ref.id,
    matchId: payload.matchId,
    tournamentId: payload.tournamentId,
    youtubeUrl: payload.youtubeUrl,
    videoType: payload.videoType,
    title: payload.title,
    uploadedBy: payload.uploadedBy,
    homeTeamName: payload.homeTeamName,
    awayTeamName: payload.awayTeamName,
    matchDate: payload.matchDate,
    views: 0,
    featured: payload.featured || false,
    createdAt: serverTimestamp()
  }

  // Auto-generar thumbnail si no se proporciona
  if (!payload.thumbnailUrl && videoId) {
    data.thumbnailUrl = getYouTubeThumbnail(videoId)
  } else if (payload.thumbnailUrl) {
    data.thumbnailUrl = payload.thumbnailUrl
  }

  // Campos opcionales
  if (payload.description) data.description = payload.description
  if (payload.duration) data.duration = payload.duration
  if (payload.round) data.round = payload.round
  if (payload.phase) data.phase = payload.phase

  await setDoc(ref, data)
  return ref.id
}

/**
 * Obtiene un video por id
 */
export async function getMatchVideo(id: string): Promise<MatchVideo | null> {
  const snap = await getDoc(doc(colMatchVideos, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as MatchVideo) : null
}

/**
 * Lista videos por torneo
 */
export async function listVideosByTournament(tournamentId: string): Promise<MatchVideo[]> {
  const q: Query = query(
    colMatchVideos,
    where('tournamentId', '==', tournamentId),
    orderBy('matchDate', 'desc')
  )
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as MatchVideo))
}

/**
 * Lista videos por partido
 */
export async function listVideosByMatch(matchId: string): Promise<MatchVideo[]> {
  const q: Query = query(
    colMatchVideos,
    where('matchId', '==', matchId),
    orderBy('createdAt', 'desc')
  )
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as MatchVideo))
}

/**
 * Lista videos destacados por torneo
 */
export async function listFeaturedVideos(tournamentId: string): Promise<MatchVideo[]> {
  const q: Query = query(
    colMatchVideos,
    where('tournamentId', '==', tournamentId),
    where('featured', '==', true),
    orderBy('matchDate', 'desc')
  )
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as MatchVideo))
}

/**
 * Lista videos por tipo
 */
export async function listVideosByType(tournamentId: string, videoType: VideoType): Promise<MatchVideo[]> {
  const q: Query = query(
    colMatchVideos,
    where('tournamentId', '==', tournamentId),
    where('videoType', '==', videoType),
    orderBy('matchDate', 'desc')
  )
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as MatchVideo))
}

/**
 * Busca videos por nombre de equipo
 */
export async function searchVideosByTeam(tournamentId: string, teamName: string): Promise<MatchVideo[]> {
  const allVideos = await listVideosByTournament(tournamentId)
  const searchTerm = teamName.toLowerCase()

  return allVideos.filter(video =>
    video.homeTeamName.toLowerCase().includes(searchTerm) ||
    video.awayTeamName.toLowerCase().includes(searchTerm)
  )
}

/**
 * Actualiza un video
 */
export async function updateMatchVideo(id: string, data: Partial<MatchVideo>): Promise<void> {
  const patch = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  )
  await updateDoc(doc(colMatchVideos, id), {
    ...patch,
    updatedAt: serverTimestamp()
  } as any)
}

/**
 * Incrementa el contador de vistas
 */
export async function incrementVideoViews(id: string): Promise<void> {
  await updateDoc(doc(colMatchVideos, id), {
    views: increment(1)
  } as any)
}

/**
 * Marca/desmarca un video como destacado
 */
export async function toggleFeaturedVideo(id: string, featured: boolean): Promise<void> {
  await updateDoc(doc(colMatchVideos, id), {
    featured,
    updatedAt: serverTimestamp()
  } as any)
}

/**
 * Elimina un video
 */
export async function deleteMatchVideo(id: string): Promise<void> {
  await deleteDoc(doc(colMatchVideos, id))
}

// Export default service object
export default {
  createMatchVideo,
  getMatchVideo,
  listVideosByTournament,
  listVideosByMatch,
  listFeaturedVideos,
  listVideosByType,
  searchVideosByTeam,
  updateMatchVideo,
  incrementVideoViews,
  toggleFeaturedVideo,
  deleteMatchVideo,
  extractYouTubeId,
  getYouTubeThumbnail
}
