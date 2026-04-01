# CommonsMesh

CommonsMesh is a **local-first, privacy-preserving, distributed coordination layer** for community mutual aid, resource matching, small project collaboration, elections, and dispute handling.

It is designed to help underserved or time-constrained people discover:
- who can help,
- who needs help,
- who wants to join,
- who can coordinate,
- and how a project can move from motion → intent → assignment → delivery.

The project is built around three ideas:

1. **Structured events instead of free-form chat**  
   Resources, needs, roles, tasks, motions, votes, and disputes are represented as signed, append-only events.

2. **User-controlled sharing**  
   Data is local-first and opt-in. The user decides what can be shared and with whom.

3. **Distributed transport**  
   The protocol is designed to run over P2P transport (libp2p + QUIC + DHT + pubsub) without a central server as the source of truth.

---

## Status

This repository is a **working protocol scaffold** and core engine starter, not a finished mobile app.

It includes:
- message schema
- event envelope
- signature and capability primitives
- in-memory graph/state materialization
- project / task / election / dispute event handling
- JSON Schema for the wire format
- a roadmap and security notes

It does **not** yet include:
- full mobile UI
- production-grade relay network
- final anti-Sybil mechanisms
- a released cryptographic attestation system
- a polished UX

---

## Why this is different from a chat app

Discord / WhatsApp / forum software are good at discussion. CommonsMesh is for **actionable coordination**.

The protocol treats a message as a **candidate state change**:
- a new resource,
- a new need,
- a motion,
- a role assignment,
- a task commitment,
- a vote,
- a dispute,
- or a capability grant/revocation.

That makes the system useful for mutual aid and small-scale self-organization without turning everything into a noisy chat feed.

---

## Repository layout

```text
.
├── README.md
├── ROADMAP.md
├── SECURITY.md
├── CONTRIBUTING.md
├── LICENSE
├── package.json
├── tsconfig.json
├── protocol/
│   └── message-v1.schema.json
├── docs/
│   └── ARCHITECTURE.md
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── state.ts
│   ├── canonical.ts
│   ├── crypto.ts
│   ├── capability.ts
│   ├── validator.ts
│   ├── engine.ts
│   ├── graph.ts
│   └── transport/
│       └── libp2p-node.ts
└── examples/
    └── demo-node.ts
```

---

## Quick start

```bash
npm install
npm run build
npm run demo
```

---

## Core protocol concepts

### Envelope

All messages use a common envelope:

- `msg_id`
- `protocol_version`
- `kind`
- `created_at`
- `sender`
- `attestation`
- `authz`
- `integrity`
- `payload`

### Message kinds

The first version supports:

- `graph.delta`
- `project.motion`
- `project.intent`
- `project.update`
- `task.propose`
- `task.assign`
- `task.commit`
- `task.deliver`
- `election.motion`
- `election.vote`
- `capability.grant`
- `capability.revoke`
- `dispute.report`
- `dispute.response`
- `ack`
- `sync.request`
- `sync.snapshot`

---

## Implementation notes

- The core engine is dependency-light and uses Node’s built-in `crypto` for hashing and Ed25519 signatures.
- The transport adapter is intentionally separate so you can swap in libp2p or any other P2P layer later.
- The repository is written in TypeScript and targets ESM.

For the transport layer, the current js-libp2p documentation recommends ESM-only usage and shows `createLibp2p(...)`-based configuration; the DHT service also relies on `identify` to discover peers that support the protocol. That is why the transport code is isolated in `src/transport/libp2p-node.ts`. See the official js-libp2p docs for current configuration patterns. citeturn735353search2turn735353search5

---

## Security model

The protocol is built around:

- signed messages
- capability tokens
- replay protection
- append-only history
- explicit scope
- attestation hooks
- dispute handling
- trust scoring

See `SECURITY.md` for the current threat model and missing hardening work.

---

## License

MIT. See `LICENSE`.
