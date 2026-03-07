# Pineapple Dog Ledger (PDL)

<div align="center">
  <img src="./logo.png" alt="Pineapple Dog Ledger Logo" width="400" />
</div>

**Pineapple Dog Ledger (PDL)** is a decentralized, community-governed micro-disaster insurance platform that reimagines aid as a transparent, automated ecosystem. Powered by the **Interledger Protocol (ILP)** for friction-less global value transfer and **Multi-Modal AI** (Google Gemini 2.5 Flash) for high-integrity verification, PDL ensures that support reaches those in need at the speed of the internet—eliminating administrative overhead to provide fast, fair, and empathetic payouts during crises.

## The PDL Pipeline: From Wager to Relief

Pineapple Dog Ledger operates as a continuous, automated pipeline that manages the entire lifecycle of disaster relief.

### Phase 1: Decentralized Funding (The Reservoir)

Insurance is powered by community activity rather than traditional premiums:

- **Permission-Based Funding**: PDL never custodies user funds. It utilizes **ILP Grants**—cryptographic permissions that allow the system to pull funds only when specific disaster conditions are met.
- **Wager-to-Pool Flow**: Users commit funds to personal or social goals via **Open Payments**. If a goal is not met, the "Social Wager" is automatically directed toward the Community Emergency Pool.

### Phase 2: Intelligent Triage (The Filter)

When a disaster occurs, claims are instantly analyzed through a Multi-Modal AI engine:

- **Automated Verification**: The system cross-references IoT Oracles and News APIs to confirm event plausibility.
- **Evidence Analysis**: Claims are scrutinized based on implemented verification logic:
  - **Property**: Home address registry matching and structural damage assessment.
  - **Presence**: Location authentication via telecom tower data and GPS logs.
  - **Livelihood**: Economic impact analysis through Business UEN validation.

### Phase 3: Community Consensus (The Guardian)

Verification results determine the triage tier and level of community involvement required:

- **Tier 1 (Instant Enrollment)**: 100% disbursement for high-confidence matches (Score ≥ 85).
- **Tier 2 (Liquidity Injection)**: 20% instant disbursement for plausible claims (Score 60-84) to provide immediate support.
- **Tier 3 (Community Adjudication)**: Claims requiring deeper validation (Score < 60) are flagged for community voting to ensure human empathy and local context.

### Phase 4: Instant Disbursement (The Stream)

Value is moved across borders without friction:

- **One Trigger, Thousands of Streams**: Upon confirmation, the Engine captures micro-contributions from thousands of authorized grants simultaneously.
- **Direct ILP Payouts**: These contributions merge into a single, massive, instant payout delivered directly to the claimant via the Interledger Protocol.

## Technologies Used

- **Framework**: [Next.js 15+](https://next.org/) (React, TypeScript)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend & Auth**: [Firebase](https://firebase.google.com/)
- **Payments**: [Interledger Protocol (ILP)](https://interledger.org/) & [Open Payments](https://openpayments.dev/)
- **AI Governance**: [Google Gemini API](https://ai.google.dev/) (2.5 Flash)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## Getting Started

### Prerequisites

- **Node.js** & **Bun** (recommended)
- **Firebase Project** credentials
- **Google Gemini API Key**
- **Interledger / Open Payments** account

### Setup

1.  **Clone findings**:

    ```bash
    cd hackomania-2026/pineapple-dog
    ```

2.  **Environment Configuration**:
    Create a `.env` file in the `pineapple-dog` directory with your Firebase and Gemini credentials.

3.  **Installation**:

    ```bash
    bun install
    ```

4.  **Development**:
    ```bash
    bun dev
    ```

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
