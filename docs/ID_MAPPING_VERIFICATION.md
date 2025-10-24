# Verificación de Mapeo de IDs - Equipos y Partidos

## ✅ Verificación Completa

### 1. Estructura de IDs en `Match`

**Definición** (`src/types/competition.ts:30-31`):
```typescript
export interface Match {
  homeTeamId: { id: string; name: string }
  awayTeamId: { id: string; name: string }
  // ...otros campos
}
```

**Ejemplo de documento en Firestore**:
```typescript
// tournaments/T97S5C/matches/HY98HDY-T97S5C
{
  id: "HY98HDY-T97S5C",
  tournamentId: "T97S5C",
  homeTeamId: {
    id: "AbC123XyZ456",    // ← ID del documento en collection 'teams'
    name: "Colo Colo"
  },
  awayTeamId: {
    id: "DeF789GhI012",    // ← ID del documento en collection 'teams'
    name: "Ind Valle"
  },
  date: 1705334400000,
  status: "terminado",
  score: { home: 2, away: 1 }
}
```

---

### 2. Estructura de IDs en `PlayerParticipation`

**Definición** (`src/types/auth.d.ts:54`):
```typescript
export interface PlayerParticipation {
  playerId: string        // ID del jugador
  tournamentId: string    // ID del torneo
  teamId: string          // ← ID del equipo (string simple)
  // ...otros campos
}
```

**Ejemplo de documento en Firestore**:
```typescript
// playerParticipations/{docId}
{
  id: "participation123",
  playerId: "player456",
  tournamentId: "T97S5C",
  teamId: "AbC123XyZ456",    // ← Mismo ID que Match.homeTeamId.id
  jersey: 10,
  position: "Delantero",
  active: true
}
```

---

## 🎯 Mapeo de IDs

### Coincidencia Confirmada

```
PlayerParticipation.teamId  ===  Match.homeTeamId.id
      (string)                        (string)

                  ó

PlayerParticipation.teamId  ===  Match.awayTeamId.id
      (string)                        (string)
```

### Diagrama del Mapeo

```
┌─────────────────────────────────────────────────────────┐
│ PlayerParticipation                                     │
│ ─────────────────────────────────────────────────────── │
│ playerId: "player456"                                   │
│ teamId: "AbC123XyZ456" ─────────┐                       │
└─────────────────────────────────┼───────────────────────┘
                                  │
                                  │ COINCIDE
                                  │
┌─────────────────────────────────┼───────────────────────┐
│ Match                           │                       │
│ ─────────────────────────────── ▼                       │
│ homeTeamId: {                                           │
│   id: "AbC123XyZ456",  ← MISMO ID                       │
│   name: "Colo Colo"                                     │
│ }                                                        │
│ awayTeamId: {                                           │
│   id: "DeF789GhI012",                                   │
│   name: "Ind Valle"                                     │
│ }                                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Lógica de Comparación

### Código de Verificación

```typescript
// 1. Obtener metadata del partido
const matchMetadata = await getMatchMetadata(tournamentId, matchId)
// matchMetadata.homeTeamId = { id: "AbC123XyZ456", name: "Colo Colo" }
// matchMetadata.awayTeamId = { id: "DeF789GhI012", name: "Ind Valle" }

// 2. Obtener participación del jugador
const participation = await getPlayerParticipation(playerId, tournamentId)
// participation.teamId = "AbC123XyZ456"

// 3. Comparar (CORRECTO)
if (participation.teamId === matchMetadata.homeTeamId.id) {
  return 'home'  // ✅ Coincide
}

if (participation.teamId === matchMetadata.awayTeamId.id) {
  return 'away'
}

return null  // El jugador no participó en este partido
```

### ⚠️ Error Común (INCORRECTO)

```typescript
// ❌ ESTO NO FUNCIONARÍA
if (participation.teamId === matchMetadata.homeTeamId) {
  // NO FUNCIONA: Compara string con objeto
}

// ✅ CORRECTO
if (participation.teamId === matchMetadata.homeTeamId.id) {
  // FUNCIONA: Compara string con string
}
```

---

## 📝 Implementación Final

### `matchMetadataService.ts`

```typescript
import { db } from '@/boot/firebase'
import { doc, getDoc } from 'firebase/firestore'

export interface MatchMetadata {
  id: string
  tournamentId: string
  homeTeamId: { id: string; name: string }  // ← Objeto
  awayTeamId: { id: string; name: string }  // ← Objeto
  date?: number
  status?: string
  score?: { home: number; away: number }
}

export async function getMatchMetadata(
  tournamentId: string,
  matchId: string
): Promise<MatchMetadata | null> {
  try {
    const matchRef = doc(db, 'tournaments', tournamentId, 'matches', matchId)
    const matchSnap = await getDoc(matchRef)

    if (!matchSnap.exists()) {
      return null
    }

    return { id: matchSnap.id, ...matchSnap.data() } as MatchMetadata
  } catch (error) {
    console.error('[getMatchMetadata] Error:', error)
    throw error
  }
}

export function determineTeamSide(
  matchMetadata: MatchMetadata,
  teamId: string  // ← String del PlayerParticipation
): 'home' | 'away' | null {
  // Comparar con .id del objeto
  if (matchMetadata.homeTeamId.id === teamId) return 'home'  // ← .id
  if (matchMetadata.awayTeamId.id === teamId) return 'away'  // ← .id
  return null
}
```

---

## ✅ Casos de Prueba

### Caso 1: Jugador del equipo local

```typescript
const matchMetadata = {
  homeTeamId: { id: "team123", name: "Colo Colo" },
  awayTeamId: { id: "team456", name: "Ind Valle" }
}

const participation = { teamId: "team123" }

const side = determineTeamSide(matchMetadata, participation.teamId)
// Resultado: "home" ✅
```

### Caso 2: Jugador del equipo visitante

```typescript
const matchMetadata = {
  homeTeamId: { id: "team123", name: "Colo Colo" },
  awayTeamId: { id: "team456", name: "Ind Valle" }
}

const participation = { teamId: "team456" }

const side = determineTeamSide(matchMetadata, participation.teamId)
// Resultado: "away" ✅
```

### Caso 3: Jugador de otro equipo (no participó)

```typescript
const matchMetadata = {
  homeTeamId: { id: "team123", name: "Colo Colo" },
  awayTeamId: { id: "team456", name: "Ind Valle" }
}

const participation = { teamId: "team789" }  // ← Otro equipo

const side = determineTeamSide(matchMetadata, participation.teamId)
// Resultado: null ✅
```

---

## 🚨 Validaciones Necesarias

### 1. Verificar que el jugador esté en el torneo

```typescript
const participation = await getPlayerParticipation(playerId, tournamentId)

if (!participation) {
  throw new Error('PLAYER_NOT_IN_TOURNAMENT')
}
```

### 2. Verificar que el partido exista

```typescript
const matchMetadata = await getMatchMetadata(tournamentId, matchId)

if (!matchMetadata) {
  throw new Error('MATCH_NOT_FOUND')
}
```

### 3. Verificar que el equipo del jugador participó

```typescript
const side = determineTeamSide(matchMetadata, participation.teamId)

if (!side) {
  throw new Error('TEAM_NOT_IN_MATCH')
}
```

---

## 📊 Resumen de Tipos

| Campo | Tipo | Ubicación | Ejemplo |
|-------|------|-----------|---------|
| `Match.homeTeamId` | `{ id: string; name: string }` | `tournaments/{tid}/matches/{mid}` | `{ id: "team123", name: "Colo Colo" }` |
| `Match.awayTeamId` | `{ id: string; name: string }` | `tournaments/{tid}/matches/{mid}` | `{ id: "team456", name: "Ind Valle" }` |
| `PlayerParticipation.teamId` | `string` | `playerParticipations/{pid}` | `"team123"` |
| `Team.id` | `string` | `teams/{tid}` | `"team123"` |

### Relaciones

```
Team.id (string)
    ↓
PlayerParticipation.teamId (string)
    ↓
Match.homeTeamId.id (string)  ← COMPARACIÓN AQUÍ
Match.awayTeamId.id (string)  ← COMPARACIÓN AQUÍ
```

---

## ✅ Conclusión

**¿Coinciden los IDs?** ✅ **SÍ**

- `PlayerParticipation.teamId` (string) coincide con `Match.homeTeamId.id` (string)
- O coincide con `Match.awayTeamId.id` (string)
- La comparación debe hacerse con `.id` del objeto, no con el objeto completo

**Implementación verificada y lista para usar.**

---

**Última actualización**: 2025-01-23
**Status**: ✅ Verificado
