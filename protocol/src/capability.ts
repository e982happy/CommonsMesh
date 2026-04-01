/**
 * Capability token utilities.
 *
 * SECURITY FIXES vs. original scaffold:
 *  1. verifyCapabilityToken now calls verifyCapabilitySignature — the issuer's
 *     Ed25519 signature over the token body is cryptographically verified.
 *  2. max_count enforcement is wired through the AppState.capabilityUsage map.
 *  3. Revocation is checked against AppState.revokedCapabilities.
 *  4. issuer_pubkey is a required field on CapabilityToken.
 */

import { canonicalJson } from "./canonical.js";
import { sha256Hex, verifyObjectSignature } from "./crypto.js";
import type { AppState, CapabilityToken, MessageKind, Scope } from "./types.js";

export function createCapabilityId(): string {
  return `cap_${sha256Hex(cryptoRandom()).slice(0, 24)}`;
}

function cryptoRandom(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function encodeCapabilityToken(token: CapabilityToken): string {
  return canonicalJson(token);
}

export function decodeCapabilityToken(raw: string): CapabilityToken | null {
  try {
    const parsed = JSON.parse(raw) as CapabilityToken;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Verify the Ed25519 signature on a capability token.
 * The signature covers the token body with the `signature` field excluded.
 */
export function verifyCapabilitySignature(token: CapabilityToken): boolean {
  if (!token.issuer_pubkey) return false;
  const { signature, ...unsigned } = token;
  return verifyObjectSignature(unsigned, signature, token.issuer_pubkey);
}

/**
 * Full capability token validation:
 *   1. Cryptographic signature check (issuer_pubkey)
 *   2. Temporal validity window
 *   3. Revocation check
 *   4. max_count check
 *   5. Scope match
 *   6. Rights check for the requested message kind
 */
export function verifyCapabilityToken(
  token: CapabilityToken | null,
  kind: MessageKind,
  scope: Scope,
  state?: AppState
): boolean {
  if (!token) return false;

  // 1. Cryptographic signature
  if (!verifyCapabilitySignature(token)) return false;

  // 2. Temporal validity
  const nowSec = Date.now() / 1000;
  if (nowSec > token.constraints.expires_at) return false;
  if (nowSec < token.valid_from) return false;
  if (nowSec > token.valid_to) return false;

  // 3. Revocation check
  if (state?.revokedCapabilities.has(token.capability_id)) return false;

  // 4. max_count enforcement (0 = unlimited)
  if (state && token.constraints.max_count > 0) {
    const used = state.capabilityUsage.get(token.capability_id) ?? 0;
    if (used >= token.constraints.max_count) return false;
  }

  // 5. Scope match
  const scopeMatch =
    (!token.scope.project_id || token.scope.project_id === scope.target_ref) ||
    (!token.scope.topic || token.scope.topic === scope.target_ref) ||
    (!token.scope.object_id || token.scope.object_id === scope.target_ref);
  if (!scopeMatch) return false;

  // 6. Rights check
  const rights = new Set(token.rights);
  const kindRightMap: Partial<Record<MessageKind, string>> = {
    "graph.delta": "write",
    "project.motion": "propose",
    "project.intent": "comment",
    "project.update": "comment",
    "task.propose": "propose",
    "task.assign": "assign",
    "task.commit": "comment",
    "task.deliver": "comment",
    "election.motion": "propose",
    "election.vote": "vote",
    "capability.grant": "grant",
    "capability.revoke": "revoke",
    "dispute.report": "report",
    "dispute.response": "comment",
    "ack": "comment",
    "sync.request": "read",
    "sync.snapshot": "read"
  };

  const needed = kindRightMap[kind];
  if (!needed) return false;
  if (!rights.has(needed) && !rights.has("*")) return false;

  return true;
}

/**
 * Record a capability token usage. Call this after a message is accepted.
 */
export function recordCapabilityUsage(state: AppState, capabilityId: string): void {
  const current = state.capabilityUsage.get(capabilityId) ?? 0;
  state.capabilityUsage.set(capabilityId, current + 1);
}
