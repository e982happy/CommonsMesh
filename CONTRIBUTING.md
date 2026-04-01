# Contributing

Thanks for helping improve CommonsMesh.

## Suggested workflow

1. Open an issue for a bug, feature, or protocol change.
2. Describe the user problem and the expected state transition.
3. Keep changes small and reviewable.
4. Add tests for protocol validation or state transitions.
5. Update docs when behavior changes.

## Coding style

- TypeScript
- ESM modules
- Small pure functions where possible
- Prefer explicit types over implicit behavior
- Keep protocol changes backward-compatible when possible

## Protocol changes

Any change to:
- the envelope
- message kinds
- signature format
- capability rules
- graph semantics

should be versioned and documented in `docs/ARCHITECTURE.md` and `protocol/message-v1.schema.json`.
