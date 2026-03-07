# EmergeTrust MVP - Technical Specification

**Target:** EmergeTrust, a decentralized, community-governed micro-disaster insurance platform. Mobile-first Progressive Web App (PWA) with offline capabilities.
**Reference API & Architecture Patterns:** Use the Interledger Protocol (ILP) and Open Payments exactly as implemented in `/Reference-Repo`.

## Core Mechanics (The EmergeTrust Pipeline)

### 1. The Engine (Funding)
- **Concept:** The fund is fueled by failed social wagers.
- **The "Wager-to-Pool" Flow:** Users lock money for personal goals via Open Payments. On failure, funds enter the Community Pool. 
- **The Yield:** While waiting for a disaster, the pool earns interest, which pays for the Bounty Hunter rewards and server costs.

### 2. The Two-Phase Verification (The "Filter")
**Phase 1: The Bot Layer (Instant 20%)**
- **The Trigger:** News API + IoT Oracles (NEA/PUB/OpenWeather) confirm a disaster.
- **The Matching:** The bot processes claims using a Unified Scoring System, checking the user's category against the data.
- **The Verdict:**
  - *Score >= 80:* Instant 20% payout. Moves to Phase 2 for the rest.
  - *Score 50-79:* No instant payout. Flagged for "Priority Human Review."
  - *Score < 50:* Instant rejection (or Bounty Hunter alert).

**Phase 2: The Human Layer (The Remaining 80% + Grey Areas)**
- **Community Voting:** Users use their daily voting limit to review the Claim Post (News link + Geotagged Media).
- **Impact Allocation:** Humans decide if the impact is severe enough for a full payout or just a partial one.
- **Volunteer Proxy:** Verified volunteers can "Boost" a claim for an elderly neighbor, giving it higher visibility in the voting queue.

### 3. Category-Specific Logic
| Category | Primary Verification Signal (Bot) | Human Review Focus (Phase 2) |
| :--- | :--- | :--- |
| **Property** | Satellite/Map data + HDB/Ownership records. | Does the photo evidence show temporary or structural damage? |
| **Presence** | GPS/Telecom pings within the impact window. | Is the user a tourist who needs urgent help or a local who is just nearby? |
| **Livelihood** | Business registry + sector impact (e.g., Farm/Delivery). | Does the income loss justify a high-tier payout? |

### 4. Security & Guardrails
- **The "Staked" Claim:** Users must stake $5 to file a claim.
- **The Bounty Hunter:** If a Hunter proves a claim used a fake photo, the $5 stake is slashed. (50% to Hunter, 50% back to Community Pool).
- **The "Similarity" Problem:** Phase 2 (Humans) can see all claims on a map. If two claims use the exact same photo, the system flags it for "Plagiarism Review" by Bounty Hunters.
- **The "Low Priority" Backlog:** Tiered Payout Rules. Medical/Presence claims are pushed to the top of the Voting Feed. Property claims have a longer "Waiting Room" period.
- **Volunteer Misconduct:** Trust Scores. A volunteer's "Bond" (staked money) must be equal to or higher than the amount they are collecting for others in an aggregated payout.

## Simulation Portal (Admin)
Admin dashboard allowing manual override for demos:
- **Inject Synthetic Oracles:** Trigger "Flood Alert" for specific geofence.
- **Simulate Wager Fails:** Single button simulating 50 users failing wagers, triggering ILP streams.
- **Time Travel:** Accelerate 24-hour voting window immediately resolving Tier 2 payouts.

## UI/UX & Design System ("Dichotomy of State")

You MUST use Vanilla CSS or Tailwind based on these strict states.

### State A: Peacetime (Wager & Funder UX)
- **Vibe:** Dynamic, gamified, polished fintech.
- **Colors:** Dark mode default (#0A0A0A) background. Dark grey panels. Vibrant electric cyan (#00F0FF) for pool and progress bars.
- **Interactions:** "Breathing" 3D/vector element representing Vault that pulses. Tactile locking animations with haptic feedback. Skeleton loaders (no spinners).

### State B: Crisis Mode (Claim UX)
- **Vibe:** Utilitarian, stark, zero cognitive load. Emergency broadcast.
- **Colors:** Strip gamification. Neon orange (#FF4D00) or red for alerts, borders, primary actions.
- **Layout:** Massive tap targets (one-thumb tapping). Clear universal icons, minimalist Inter font typography. Fixed bottom navigation bar (Submit Claim, Vote).
- **Offline-First:** If offline, cache claim form locally and show a persistent visible banner: "Connection lost. Claim saved securely offline. Auto-submit upon reconnection."
