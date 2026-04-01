# Security

## Threat model

CommonsMesh is designed for community coordination in environments where:
- users may not know each other well,
- some participants may be malicious,
- some devices may be compromised,
- network connectivity may be intermittent,
- and the app may be targeted by spam or identity abuse.

## Security goals

- Preserve user control over sensitive data
- Prevent unauthenticated state changes
- Prevent replay of old messages
- Make event history append-only
- Make permissions explicit and scope-bound
- Make fake device / fake app / low-effort abuse harder
- Support dispute and revocation workflows

## Current controls in the scaffold

- Canonical JSON hashing
- Ed25519 signatures
- Capability tokens
- Nonce-based replay protection
- Scope validation
- Temporal validity windows
- Basic trust scoring hooks
- Dispute reporting and response hooks

## Missing controls before production

Before real deployment, this repository still needs:
- persistent encrypted storage
- production-grade key management
- full mobile attestation
- real libp2p transport hardening
- secure backup/restore
- rate limiting
- abuse dashboards
- formal security review

## Reporting vulnerabilities

Please report security issues privately to the maintainer before public disclosure.
