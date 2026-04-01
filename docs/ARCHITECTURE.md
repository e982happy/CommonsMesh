# Architecture

CommonsMesh is a distributed coordination system built around a signed append-only event log.

## Layers

### 1. Protocol layer
Defines the event envelope, message kinds, capability system, and state transitions.

### 2. Core engine
Validates messages and materializes them into an in-memory graph and project state.

### 3. Transport layer
Pluggable P2P transport. The current design expects libp2p-based transport with:
- peer discovery
- pubsub
- relays / store-and-forward
- offline sync

### 4. Client layer
Mobile-first user interface for profile editing, matching, project creation, task acceptance, voting, and disputes.

## Design choices

### Append-only event model
A message is a candidate state transition, not mutable chat history.

### Capability-based authorization
Action scope is explicit and time-bounded.

### User-controlled visibility
Sharing is opt-in and scoped.

### Distributed routing
The transport is intentionally separated from the core engine so the protocol can survive implementation changes.

## Current implementation status

The repository currently includes:
- event schema
- core validation
- graph materialization
- capability logic
- sample demo

It does not yet include:
- production libp2p network code
- persistent encrypted database
- full mobile app UI
