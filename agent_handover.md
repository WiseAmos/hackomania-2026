# EmergeTrust Swarm Handover Document

**Top-Level Goal:** Build the complete EmergeTrust MVP architecture and application mechanics.

**Division of Labor:**
- **Antigravity Generator:** State initialization, task monitoring, conflict resolution. 
- **Planner Agent (`/plan`):** Scaffold project framework, draft system architecture, backend schema.
- **Implementer (`/tdd`):** Build individual mechanic modules safely (Wager Engine, Oracle).
- **Reviewer (`/security-scan`):** Continuous check of the repository vulnerabilities.

**Current Task Status:**
- [Done] TASK_1: Setup Project Tracking Files (Task, Tech Spec, Handover).
- [Done] TASK_2: Planner Agent initializes application structure and plans architecture.
- [Pending] TASK_3: TDD Agents process core mechanics sequentially into src/.

**Shared Constraints:**
- Must strictly implement requirements from `tech_spec.md`.
- Mobile-first PWA architecture with offline capacities (Service Workers, IndexedDB).
- Rely on reference code located in `Reference-Repo/` for ILP streams.
- Output log as JSON formatted. 
- You MUST automatically fix dependencies or typing issues during `tdd` without human intervention.
- The UI MUST dynamically toggle between "Peacetime" and "Crisis Mode".

**Update Instructions:**
As an agent finishes its delegated command, it MUST edit THIS document (`agent_handover.md`), updating its task to [Done] under `Current Task Status`, and exit. Add specific technical decisions directly appended to this file. **DO NOT** clear old histories unless instructed. Let the file act as a log of system evolution.

---

## TASK_2 Log — Planner Agent (Completed 2026-03-07)

### Scaffold Output
Project created at: `emerge-trust/` (Vite + React PWA)

### Architecture Decisions

```json
{
  "framework": "Vite 5 + React 18 + TypeScript",
  "bundler": "Vite with vite-plugin-pwa (Workbox)",
  "styling": "Tailwind CSS 3 with CSS custom properties for mode switching",
  "state": "Zustand 4 with persist middleware",
  "routing": "React Router v6",
  "offline_storage": "IndexedDB via idb library",
  "backend": "Express 4 server (port 3001) — required for server-side ILP crypto",
  "database": "Firebase Firestore (client) + Firebase Admin (server)",
  "payments": "@interledger/open-payments ^6.13.2 (matches Reference-Repo exactly)",
  "pwa": "Service Worker via Workbox (auto-update), PWA manifest with shortcuts"
}
```

### Key Technical Decisions

1. **Mode Toggle**: CSS custom properties on `[data-mode]` attribute on `<html>` drive Peacetime/Crisis visual switch. Zustand `disasterStore` auto-switches mode when active disaster zones are detected via Firestore real-time listener.

2. **ILP Flow** (mirrored from Reference-Repo):
   - Step 1: `GET /api/transaction` → request outgoing grant + quote grant → redirect user to ILP auth
   - Step 2: `GET /api/transaction/incominggrant` → create incoming payment
   - Step 3: `GET /api/transaction/finaltransfer` → continue grant with interact_ref → create outgoing payment

3. **Claim Pipeline**:
   - `POST /api/claims` → verifies active zone, creates claim doc, triggers Tier 1 (20%) payout, sets 24h voting deadline
   - `POST /api/claims/:id/resolve` → tallies weighted votes (by TrustScore), releases Tier 2 (80%) or rejects

4. **Offline-First Claims**: `src/lib/indexedDB.ts` caches unsubmitted claims using idb. `useOffline` hook auto-syncs on reconnection via `window.online` event.

5. **Oracle**: Server polls NewsAPI every 5 minutes. Dual condition (keyword match + sensor threshold) auto-activates disaster zones. Admin `/api/oracle/inject` allows manual override for demos.

6. **Admin Simulation Portal** (`/admin` page):
   - Oracle Injector → `POST /api/oracle/inject`
   - Wager Simulator → `POST /api/admin/simulate-wager-fails`
   - Time Travel → `POST /api/admin/time-travel` (proxies to `/api/claims/:id/resolve`)

### Directory Structure
```
emerge-trust/
├── src/
│   ├── components/
│   │   ├── ui/           — Button, Card, SkeletonLoader
│   │   ├── peacetime/    — VaultPulse, WagerCard, FundingPool, CommitmentLock
│   │   ├── crisis/       — ClaimForm, VotingPanel, OfflineBanner, BottomNavBar
│   │   └── admin/        — AdminDashboard, OracleInjector, WagerSimulator, TimeTravel
│   ├── pages/            — Login, Home, Wager, Claim, Vote, Profile, Admin
│   ├── store/            — appState, disasterStore, userStore
│   ├── hooks/            — useOffline, useDisasterState, useOpenPayments
│   ├── lib/              — firebase.ts, indexedDB.ts
│   └── types/            — index.ts (all shared types)
├── server/
│   ├── routes/           — transaction.ts, oracle.ts, claim.ts
│   └── lib/              — firebaseAdmin.ts, openPaymentsClient.ts
└── public/
    ├── icons/            — SVG favicon placeholder
    └── manifest.webmanifest
```

### Next Steps for TASK_3 (TDD Agent)
- Implement Firebase Auth listener in `App.tsx` (currently uses stored user state)
- Add photo upload to Firebase Storage in `ClaimForm.tsx`
- Wire `CommitmentLock` → wager Firestore document creation post-grant
- Implement quote creation step (`/api/transaction/quote`)
- Add `setref` route to handle ILP redirect callback and store `interactref`
- Seed Firestore with initial `communityVault/main` document and sample `disasterZones`
- Run `npm install` in `emerge-trust/` to install dependencies
