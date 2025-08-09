export type AppRole = 'admin' | 'manager' | 'team' | 'player'

export function roleHome(role?: string) {
  switch (role as AppRole) {
    case 'admin':     return '/admin'
    case 'manager': return '/manager'
    case 'team':   return '/team'
    case 'player':    return '/player'
    default:          return '/'
  }
}
