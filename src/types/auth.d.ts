import type { Timestamp, FieldValue } from 'firebase/firestore';

export type Role = 'admin' | 'manager' | 'team' | 'player'



export interface Tournament {
  id: string;
  tournamentId: string;
  displayName: string;
  city: string;
  type?: 'league' | 'league_playoff' | 'playoff' | '';
  startDate: string;
  numTeams: number;
  managerId: string;
  managerName: string;
  season?: string;
  category?: string;
  description?: string;
  rulesUrl?: string;
  createdAt: Timestamp | FieldValue;
  photoURL?: string | null;
  status: string;
  award?: {
    first_place?: number;
    second_place?: number;
    top_scorer?: number;
    defeat_net?: number;
  };
}

export interface Team {
  id: string;
  tournamentId: string;
  displayName: string;
  city: string;
  group?: string;
  colors?: string;
  crestUrl?: string;
  captainId?: string;
  createdBy: string;
  createdAt: Timestamp | FieldValue;
  photoURL?: string | null;
}

/**
 * Participación de un jugador en un torneo/equipo específico
 * Colección separada: playerParticipations
 */
export interface PlayerParticipation {
  id: string;
  playerId: string;          // Referencia al documento en collection 'players'
  tournamentId: string;       // Torneo donde juega
  teamId: string;             // Equipo donde juega
  jersey?: number;            // Número de camiseta (puede variar por equipo)
  position?: string;          // Posición (puede variar por equipo)
  role: 'player' | 'team';    // 'team' = capitán
  active: boolean;            // Si está activo en este torneo/equipo
  joinedAt: Timestamp | FieldValue;
  createdBy: string;
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

/**
 * Jugador - Información básica y personal
 * Colección: players
 * Un jugador puede participar en múltiples torneos/equipos (ver PlayerParticipation)
 */
export interface Player {
  id: string;
  email?: string;             // Email único del jugador (opcional para identificarlo)
  displayName: string;
  photoURL?: string | null;
  createdBy: string;
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;

  // DEPRECATED: Estos campos se mantienen por compatibilidad pero deberían migrar a PlayerParticipation
  tournamentId?: string;
  teamId?: string;
  position?: string;
  jersey?: number;
  role?: 'player' | 'team';
  active?: boolean;
}

export interface Manager {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  role: 'manager';
  createdAt: Timestamp;
  photoURL?: string | null;
}

export interface Admin {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  role: 'admin';
  createdAt: Timestamp;
  photoURL?: string | null;
}

