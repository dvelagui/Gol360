
export type AppRole = 'admin' | 'manager' | 'team' | 'player'

/**
 * Returns the home path for a given role.
 */
export function roleHome(role?: string) {
  switch (role as AppRole) {
    case 'admin':   return '/admin'
    case 'manager': return '/manager'
    case 'team':    return '/team'
    case 'player':  return '/player'
    default:        return '/'
  }
}

/**
 * Permission helpers (UI-level checks)
 * owner: whether the user owns/was assigned the target resource (e.g., their own tournament)
 * isCaptain: whether the current 'team' user is acting as captain in context
 */

export const canCreateTournament = (role: AppRole) =>
  role === 'admin'

export const canManageTournament = (role: AppRole, owner = false) =>
  role === 'admin' || (role === 'manager' && owner)

export const canCreateTeam = (role: AppRole, owner = false) =>
  role === 'admin' || (role === 'manager' && owner)

export const canCreatePlayer = (role: AppRole, isCaptain = false, owner = false) =>
  role === 'admin'
  || (role === 'manager' && owner)
  || (role === 'team' && isCaptain)

/**
 * Optional labels (ES) if you need them in UI quickly.
 * Keep internal keys stable and translate only on presentation layer.
 */
export const ROLE_LABEL_ES: Record<AppRole, string> = {
  admin: 'Administrador',
  manager: 'Organizador',
  team: 'Capitán',
  player: 'Jugador'
}
