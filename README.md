# CommonsMesh

> **A Fully Decentralized Community Mutual Aid Network** — Open-source application powered by libp2p, on-device LLMs, and cryptographic verification.
> The project is still underdevelopment. 
[**[中文版 README (Chinese)]**](README.zh.md)

CommonsMesh helps communities worldwide (whether geographical or digital) achieve efficient mutual aid, resource matching, community motions, and project collaboration. It operates without any central servers—your data is stored exclusively on your own device.

---

## Core Philosophy

Users declare their **needs** and **available resources** within the app. This information is propagated across community nodes via the libp2p network in the form of cryptographically signed incremental messages. Every app maintains a **local community graph database** and embeds a **lightweight LLM (~1B parameters)** that continuously analyzes the graph to proactively discover:

- Direct matches between needs and resources (e.g., moving assistance, skill exchange)
- Aggregated multi-person needs (e.g., group purchasing and bargaining opportunities)
- Complementary skill combinations (e.g., project collaboration opportunities)
- Community events and collective actions

The AI proactively proposes **motions**, assisting users with matching, role division, task assignment, and progress tracking.

---

## Monorepo Structure

```text
CommonsMesh/
├── protocol/                    # Protocol Layer (Message format, validation engine, cryptography)
│   ├── src/
│   │   ├── types.ts             # Complete type definitions
│   │   ├── validator.ts         # Message validation pipeline (Anti-Sybil, Anti-Replay)
│   │   ├── engine.ts            # State transition engine
│   │   ├── capability.ts        # Capability tokens (Authorization system)
│   │   ├── crypto.ts            # Ed25519 signatures + SHA-256
│   │   ├── canonical.ts         # Canonical JSON (Deterministic serialization)
│   │   ├── graph.ts             # In-memory graph operations
│   │   └── state.ts             # Initial state factory
│   ├── message-v1.schema.json   # JSON Schema (Message format specification)
│   ├── SYBIL-RESISTANCE.md      # Anti-Sybil attack design document
│   ├── SYNC.md                  # Incremental sync protocol design document
│   └── examples/
│       └── demo-node.ts         # Protocol layer demonstration
│
├── packages/
│   ├── network/                 # libp2p Network Layer
│   │   └── src/
│   │       ├── node.ts          # libp2p node factory (TCP+WS+mDNS+DHT+GossipSub)
│   │       ├── sync.ts          # Incremental sync protocol implementation (Bloom filter)
│   │       ├── types.ts         # Network layer types and Topic naming conventions
│   │       └── index.ts
│   │
│   ├── db/                      # Local Graph Database Layer
│   │   └── src/
│   │       ├── db.ts            # SQLite connection management and migration runner
│   │       ├── schema.ts        # Database schema types
│   │       ├── event-store.ts   # Event log persistence
│   │       ├── graph-store.ts   # Graph node/edge CRUD + queries
│   │       ├── nonce-store.ts   # Persistent nonce cache (Anti-Replay)
│   │       ├── index.ts
│   │       └── migrations/
│   │           └── 001_initial.sql
│   │
│   └── llm/                     # On-device LLM Integration Layer
│       └── src/
│           ├── llm-engine.ts    # LLM engine (llama.rn or OpenAI-compatible API)
│           ├── matcher.ts       # Community graph matching engine (Rules + LLM)
│           └── index.ts
│
├── apps/
│   └── mobile/                  # React Native Mobile App (Expo)
│       └── src/
│           ├── App.tsx          # Root component
│           ├── navigation/      # React Navigation routing
│           ├── screens/         # All screens
│           │   ├── OnboardingScreen.tsx      # New user onboarding (Key generation)
│           │   ├── CommunityMapScreen.tsx    # Community graph main interface
│           │   ├── NeedsResourcesScreen.tsx  # Need/Resource declaration
│           │   ├── ProjectsScreen.tsx        # Community projects list
│           │   ├── ProjectDetailScreen.tsx   # Project details
│           │   ├── TaskScreen.tsx            # Task details
│           │   ├── MatchSuggestionsScreen.tsx # AI match suggestions
│           │   ├── ProfileScreen.tsx         # User profile
│           │   └── DisputeScreen.tsx         # Dispute handling
│           ├── components/      # Shared components (MatchCard, EventCard)
│           ├── hooks/           # useLLM hook
│           ├── services/        # Keychain service (Key generation and signing)
│           └── store/           # Zustand state management
│
├── docs/
│   └── ARCHITECTURE.md          # System architecture documentation
│
├── legacy-src/                  # Original src/ directory (Historical reference)
├── tsconfig.base.json           # Shared TypeScript configuration
└── package.json                 # pnpm workspace configuration
```

---

## Security Design

| Threat | Defense Mechanism |
|--------|-------------------|
| **Sybil Attacks** | Trust score thresholds (high-impact actions require score ≥ 0.1) + Social proofs + Hardware attestation |
| **Message Replay** | TTL-bounded nonce cache (24h automatic expiration) + Time window validation |
| **Message Tampering** | Ed25519 signatures + SHA-256 payload hash of canonical JSON |
| **Chain Forking** | Strict linear `chain_hash` chain (only accepts `prev_event_hash` = previous event's `chain_hash`) |
| **Clock Attacks** | Message `created_at` must be within ±5 minutes of local clock |
| **Capability Abuse** | Capability token `max_count` enforcement + Instant revocation (`revokedCapabilities` set) |
| **Vote Double-Spending**| Election nullifier sets (each nullifier can only be used once) |

For more details, see [`protocol/SYBIL-RESISTANCE.md`](protocol/SYBIL-RESISTANCE.md).

---


---

## Recommended On-device LLM Models

| Model | Size | Quality | Notes |
|-------|------|---------|-------|
| Qwen2.5-1.5B-Instruct-Q4_K_M | ~1.0 GB | ★★★★ | Recommended default, excellent multilingual support |
| SmolLM2-1.7B-Instruct-Q4_K_M | ~1.1 GB | ★★★☆ | English-focused |
| Phi-3.5-mini-instruct-Q4_K_M | ~2.2 GB | ★★★★★ | Highest quality, requires more memory |

Model files (GGUF format) should be placed in:
- iOS: `Documents/models/`
- Android: `files/models/`

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md).

## Security Vulnerabilities

Please read [SECURITY.md](SECURITY.md).

## Roadmap

Please read [ROADMAP.md](ROADMAP.md).

## License

[AGPL-3.0-only](LICENSE) — Any modified versions of this project must be open-sourced under the same license.
