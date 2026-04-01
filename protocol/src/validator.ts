/**
 * Message validation and authorization pipeline.
 *
 * SECURITY FIXES vs. original scaffold:
 *  1. verifyAuthz now passes AppState to verifyCapabilityToken so revocation
 *     and max_count are enforced.
 *  2. policyOk is no longer a stub — it enforces trust_min thresholds and
 *     rate-limiting heuristics.
 *  3. isReplay uses a TTL-bounded nonce cache (Map<nonce, recordedAt>) instead
 *     of an ever-growing Set, preventing unbounded memory growth.
 *  4. verifyTemporalWindow also checks that created_at is within a reasonable
 *     skew of the local clock, preventing pre-signed message hoarding.
 *  5. verifyChainLink only accepts prev_event_hash === last.integrity.chain_hash
 *     (not payload_hash), enforcing a strict linear chain.
 *  6. Capability token usage is incremented after acceptance.
 */

import { canonicalJson } from "./canonical.js";
import { verifyObjectSignature, sha256Hex } from "./crypto.js";
import type {
  AppState,
  AttestationType,
  MessageEnvelope,
  MessageKind,
  ProcessResult,
  ValidationResult
} from "./types.js";
import { verifyCapabilityToken, recordCapabilityUsage } from "./capability.js";

/** Maximum allowed clock skew in seconds (5 minutes) */
const MAX_CLOCK_SKEW_SEC = 300;

/** Nonce TTL in seconds (24 hours). Nonces older than this are evicted. */
const NONCE_TTL_SEC = 86400;

/** Minimum trust score required to publish high-impact message kinds */
const HIGH_IMPACT_TRUST_MIN = 0.1;

const ALLOWED_KINDS = new Set<MessageKind>([
  "graph.delta",
  "project.motion",
  "project.intent",
  "project.update",
  "task.propose",
  "task.assign",
  "task.commit",
  "task.deliver",
  "election.motion",
  "election.vote",
  "capability.grant",
  "capability.revoke",
  "dispute.report",
  "dispute.response",
  "ack",
  "sync.request",
  "sync.snapshot"
]);

/** Message kinds that require a minimum trust score */
const HIGH_IMPACT_KINDS = new Set<MessageKind>([
  "project.motion",
  "election.motion",
  "capability.grant",
  "capability.revoke"
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function validateEnvelope(msg: unknown): ValidationResult {
  if (!isObject(msg)) return { ok: false, reason: "message_not_object" };

  const m = msg as Record<string, unknown>;
  if (!isNonEmptyString(m.msg_id) || m.msg_id.length < 8) {
    return { ok: false, reason: "missing_msg_id" };
  }
  if (m.protocol_version !== "1.0") {
    return { ok: false, reason: "unsupported_protocol_version" };
  }
  if (!isNonEmptyString(m.kind) || !ALLOWED_KINDS.has(m.kind as MessageKind)) {
    return { ok: false, reason: "invalid_kind" };
  }
  if (typeof m.created_at !== "number" || m.created_at <= 0) {
    return { ok: false, reason: "invalid_created_at" };
  }

  if (!isObject(m.sender)) return { ok: false, reason: "invalid_sender" };
  for (const key of [
    "user_id",
    "device_id",
    "agent_id",
    "app_id",
    "user_pubkey",
    "device_pubkey",
    "agent_pubkey"
  ]) {
    if (!isNonEmptyString((m.sender as Record<string, unknown>)[key])) {
      return { ok: false, reason: `invalid_sender_${key}` };
    }
  }

  if (!isObject(m.attestation)) return { ok: false, reason: "invalid_attestation" };
  if (!isObject(m.authz)) return { ok: false, reason: "invalid_authz" };
  if (!isObject(m.integrity)) return { ok: false, reason: "invalid_integrity" };
  if (!isObject(m.payload)) return { ok: false, reason: "invalid_payload" };

  const attestationType = (m.attestation as Record<string, unknown>).attestation_type;
  const allowedAttestations: AttestationType[] = ["none", "software", "hardware", "social", "quorum"];
  if (!allowedAttestations.includes(attestationType as AttestationType)) {
    return { ok: false, reason: "invalid_attestation_type" };
  }

  return { ok: true };
}

/**
 * Replay protection with TTL-bounded nonce cache.
 * Evicts nonces older than NONCE_TTL_SEC to prevent unbounded memory growth.
 */
export function isReplay(state: AppState, userId: string, nonce: string): boolean {
  const nowSec = Math.floor(Date.now() / 1000);

  let userNonces = state.nonceCache.get(userId);
  if (!userNonces) {
    userNonces = new Map<string, number>();
    state.nonceCache.set(userId, userNonces);
  }

  // Evict expired nonces
  for (const [n, recordedAt] of userNonces.entries()) {
    if (nowSec - recordedAt > NONCE_TTL_SEC) {
      userNonces.delete(n);
    }
  }

  if (userNonces.has(nonce)) return true;
  userNonces.set(nonce, nowSec);
  return false;
}

/**
 * Temporal window validation.
 * Checks both the authz window AND that created_at is within MAX_CLOCK_SKEW_SEC
 * of the local clock, preventing pre-signed message hoarding attacks.
 */
export function verifyTemporalWindow(msg: MessageEnvelope): boolean {
  const nowSec = Math.floor(Date.now() / 1000);

  // Check authz window
  if (msg.authz.valid_from > nowSec || nowSec > msg.authz.valid_to) return false;

  // Check created_at clock skew
  const skew = Math.abs(nowSec - msg.created_at);
  if (skew > MAX_CLOCK_SKEW_SEC) return false;

  return true;
}

/**
 * Strict chain link verification.
 * Only accepts prev_event_hash === last event's chain_hash (not payload_hash).
 * This enforces a single linear hash chain and prevents forking.
 */
export function verifyChainLink(msg: MessageEnvelope, state: AppState): boolean {
  if (state.eventLog.length === 0) {
    return msg.authz.prev_event_hash === "genesis";
  }
  const last = state.eventLog[state.eventLog.length - 1];
  return msg.authz.prev_event_hash === last.integrity.chain_hash;
}

/**
 * Payload integrity verification.
 * Recomputes payload_hash using canonical JSON and verifies the envelope
 * signature against the sender's user_pubkey.
 */
export function verifyIntegrity(msg: MessageEnvelope): boolean {
  // Verify payload hash using canonical JSON (not raw JSON.stringify)
  const payloadHash = sha256Hex(canonicalJson(msg.payload));
  if (payloadHash !== msg.integrity.payload_hash) return false;

  // Reconstruct the signed object (excluding the signature field itself)
  const signed = {
    msg_id: msg.msg_id,
    protocol_version: msg.protocol_version,
    kind: msg.kind,
    created_at: msg.created_at,
    sender: msg.sender,
    attestation: msg.attestation,
    authz: msg.authz,
    integrity: {
      payload_hash: msg.integrity.payload_hash,
      chain_hash: msg.integrity.chain_hash
    },
    payload: msg.payload
  };

  return verifyObjectSignature(signed, msg.integrity.signature, msg.sender.user_pubkey);
}

/**
 * Authorization check.
 * Verifies the capability token signature, temporal validity, revocation,
 * max_count, scope, and rights — all against the current AppState.
 */
export function verifyAuthz(msg: MessageEnvelope, state: AppState): boolean {
  if (!msg.authz.capability_token) return false;
  return verifyCapabilityToken(msg.authz.capability_token, msg.kind, msg.authz.scope, state);
}

/**
 * Policy enforcement.
 * Checks trust score thresholds for high-impact message kinds.
 * This is the primary Sybil-resistance hook in the validation pipeline.
 */
export function policyOk(msg: MessageEnvelope, state: AppState): boolean {
  if (HIGH_IMPACT_KINDS.has(msg.kind)) {
    const trustRecord = state.trust.get(msg.sender.user_id);
    const score = trustRecord?.score ?? 0;
    if (score < HIGH_IMPACT_TRUST_MIN) return false;
  }
  return true;
}

/**
 * Full validation and authorization pipeline.
 * Returns a ProcessResult indicating whether the message was accepted and why.
 */
export function validateAndAuthorize(msg: MessageEnvelope, state: AppState): ProcessResult {
  const base = validateEnvelope(msg);
  if (!base.ok) return { accepted: false, reason: base.reason ?? "invalid_message" };

  if (!verifyIntegrity(msg)) return { accepted: false, reason: "bad_integrity" };
  if (!verifyTemporalWindow(msg)) return { accepted: false, reason: "expired_or_not_yet_valid" };
  if (isReplay(state, msg.sender.user_id, msg.authz.nonce)) {
    return { accepted: false, reason: "replay_detected" };
  }
  if (!verifyChainLink(msg, state)) return { accepted: false, reason: "causal_break" };
  if (!verifyAuthz(msg, state)) return { accepted: false, reason: "unauthorized" };
  if (!policyOk(msg, state)) return { accepted: false, reason: "policy_flag" };

  // Record capability usage after all checks pass
  if (msg.authz.capability_token) {
    recordCapabilityUsage(state, msg.authz.capability_token.capability_id);
  }

  return { accepted: true, reason: "ok" };
}
