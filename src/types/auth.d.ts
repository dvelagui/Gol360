import type { Timestamp } from 'firebase/firestore';

export type Role = 'admin' | 'manager' | 'team' | 'player'



export interface Tournament {
  id: string;
  tournamentId: string;
  displayName: string;
  city: string;
  type: string;
  startDate: string;
  numTeams: number;
  managerId: string;
  season?: string;
  category?: string;
  description?: string;
  rulesUrl?: string;
  createdBy: string;
  createdAt?: Timestamp;
  photoURL?: string | null;
}

export interface Team {
  id: string;
  tournamentId: string;
  displayName: string;
  city: string;
  group?: string;
  colors?: { primary?: string; secondary?: string };
  crestUrl?: string;
  captainId?: string;
  createdBy: string;
  createdAt: Timestamp;
  photoURL?: string | null;
}

export interface Player {
  id: string;
  teamId: string;
  displayName: string;
  position?: string;
  jersey?: number;
  role: 'player' | 'team';
  createdAt: Timestamp;
  photoURL?: string | null;
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

