# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gol360 App is a sports analytics and streaming platform built with Quasar (Vue 3) that provides live transmissions and local tournament management. The application features role-based access control with four user roles: admin, manager, team, and player.

## Common Development Commands

### Development
```bash
npm install          # Install dependencies
quasar dev           # Start dev server (opens browser automatically)
npm run dev          # Alternative dev command
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run format       # Run Prettier formatting
```

### Production
```bash
quasar build         # Build for production (outputs to dist/spa/)
npm run build        # Alternative build command
```

### Firebase
```bash
firebase deploy                    # Deploy all Firebase services
firebase emulators:start          # Start local emulators
firebase deploy --only functions  # Deploy only cloud functions
firebase deploy --only hosting    # Deploy only hosting
```

### Firebase Functions (from functions/ directory)
```bash
cd functions/
npm run lint         # Lint TypeScript
npm run build        # Compile TypeScript to lib/
npm run serve        # Build and start emulators
npm run deploy       # Deploy functions
```

### Testing
```bash
npm test             # Currently returns exit 0 (no tests configured)
```

## Architecture

### Role-Based Access Control (RBAC)

The application implements strict role-based routing with four user roles:
- **admin**: Full access including user registration, tournament management, and scraping
- **manager**: Tournament management and viewing
- **team**: View tournaments and team-specific data
- **player**: View tournaments and player-specific data

**Critical routing logic** (`src/router/guards.ts`):
- Authentication is checked via `userStore.user`
- User roles are fetched from Firestore and stored in `database.userData.role`
- The router waits up to 1500ms for role data before redirecting
- Each role has a designated home route determined by `roleHome()` utility
- Route guards use `meta.requiresAuth`, `meta.requiresRole`, or `meta.allowedRoles`
- The router automatically redirects users to their role-specific home routes

### Firebase Integration

**Boot file** (`src/boot/firebase.ts`):
- Initializes primary Firebase app with environment variables (VITE_FIREBASE_*)
- Exports: `auth`, `db`, `storage`, `analytics`
- Provides `getSecondaryAuth()` for secondary Firebase app instance (used in admin user creation)

**Firestore Setup**:
- Database: `(default)` in region `nam5`
- Primary collection: `users` with fields: `uid`, `email`, `displayName`, `photoURL`, `role`
- User lookup queries by `uid` field (not document ID)

**Emulators** (configured in `firebase.json`):
- Auth: port 9099
- Functions: port 5001
- Firestore: port 8099
- Hosting: port 5000
- Storage: port 9199

### State Management (Pinia)

**Store modules** (`src/stores/`):
- `database.ts`: User profile data with Firestore listeners
- `user.ts`: Firebase authentication state
- `tournaments.ts`: Tournament data
- `teams.ts`: Team data
- `players.ts`: Player data
- `matches.ts`: Match data
- `events.ts`: Event data
- `standings.ts`: Standings data

**Key pattern**: The `database` store fetches user profile data from Firestore using the UID from the `user` store's auth state.

### Component Organization

Components are organized by feature domain (`src/components/`):
- `base/`: Reusable base components
- `common/`: Shared common components
- `players/`: Player-specific components
- `teams/`: Team-specific components
- `tournaments/`: Tournament components with sub-organization:
  - `cards/`: Display cards
  - `dialogs/`: Modal dialogs
  - `forms/`: Form components
  - `panels/`: Content panels
  - `composables/`: Tournament-specific composables

### Services Layer

**Service pattern** (`src/services/`):
- Each service module handles API calls for a specific domain
- Services use the configured Axios instance from `src/boot/axios.ts`
- Main services: `accountService`, `eventService`, `matchService`, `playerService`, `teamService`, `tournamentService`, `uploadService`, `veoScrapeService`

**VEO API Integration** (`veoScrapeService.ts`):
- Manages scraping jobs for match analytics from Veo.co
- Key methods: `triggerScrapeJob()`, `getJobStatus()`, `getMatchAnalytics()`, `getMatchHighlights()`
- Proxied through Firebase Cloud Functions

**Firebase services** (`src/services/firebase/`, `src/services/firestore/`):
- Wrapper utilities for Firebase operations

### API Proxy Configuration

**Dev server proxy** (`quasar.config.ts`):
- `/gol360-api/*` routes proxy to `https://gol360-api-947700853040.us-central1.run.app`
- Proxy logs all requests and responses for debugging
- Used for accessing the external GOL360 API during development

### Firebase Cloud Functions

**Functions architecture** (`functions/src/`):
- Express app with CORS and cookie parser
- Routes split into `auth` and `api` modules for VEO integration
- Deployed as single Cloud Function named `api`
- Node.js 22 runtime

### Build Configuration

**Important settings** (`quasar.config.ts`):
- **Router mode**: `history` (requires server rewrites for SPA)
- **Boot files**: `['axios', 'firebase']` (executed in order during app initialization)
- **TypeScript**: Strict mode enabled with Vue shims
- **Vite plugins**: `vite-plugin-checker` runs TypeScript and ESLint checks during dev
- **Browser targets**: ES2022, Firefox 115+, Chrome 115+, Safari 14+
- **Node target**: Node 20
- **Quasar plugins**: Dialog, Notify
- **Icon sets**: FontAwesome v6, Material Icons
- **Dev server**: Opens browser automatically
- **Hosting output**: `dist/spa/` (configured in firebase.json)

### TypeScript Configuration

**ESLint setup** (`eslint.config.js`):
- Flat config format (ESLint 9+)
- Vue recommended rules with TypeScript support
- Enforces `type` imports: `@typescript-eslint/consistent-type-imports`
- Type-checked rules enabled via `vueTsConfigs.recommendedTypeChecked`
- Import paths use `@/` alias for `src/`

## Key Development Patterns

### Route Definition Pattern

Routes are organized by role with duplicate paths but different meta requirements:
```typescript
// Admin route
{
  path: '/admin/tournaments/schedule',
  meta: { requiresAuth: true, requiresRole: 'admin' }
}

// Manager route (same component, different role)
{
  path: '/manager/tournaments/schedule',
  meta: { requiresAuth: true, requiresRole: 'manager' }
}
```

### User Data Fetching Pattern

Two-store approach for auth and profile data:
1. `userStore` maintains Firebase Auth state
2. `databaseStore` fetches Firestore user profile data using the auth UID
3. Router guards wait for both stores to be ready before making routing decisions

### Component Export Pattern

Components use barrel exports with named re-exports (see `src/components/tournaments/index.ts`):
```typescript
export { default as TournamentCard } from './cards/TournamentCard.vue'
export { default as MatchFormDialog } from './dialogs/MatchFormDialog.vue'
```

### Service Singleton Pattern

Services are exported as singleton instances:
```typescript
class VeoScrapeService {
  async triggerScrapeJob(request: ScrapeJobRequest) { ... }
}
export default new VeoScrapeService()
```

## Environment Variables

Required Firebase environment variables (prefix: `VITE_FIREBASE_`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## Deployment Notes

### Pre-deployment Checklist
1. Run `npm run lint` and `npm run format` to ensure code quality
2. Run `quasar build` to verify production build succeeds
3. Firebase functions have pre-deploy hooks that automatically run lint and build

### Hosting Configuration
- **Public directory**: `dist/spa/`
- **Rewrites**: All routes (`**`) fallback to `/index.html` for SPA routing
- History mode requires this rewrite configuration

### Functions Deployment
- Functions are automatically linted and built before deployment
- TypeScript source in `functions/src/` compiles to `functions/lib/`
- Main entry point: `functions/lib/index.js`
