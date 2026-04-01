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
import { verifyCapabilityToken } from "./capability.js";

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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function validateEnvelope(msg: unknown): ValidationResult {
  if (!isObject(msg)) return { ok: false, reason: "message_not_object" };

  const m = msg as Record<string, unknown>;
  if (!isNonEmptyString(m.msg_id)) return { ok: false, reason: "missing_msg_id" };
  if (m.protocol_version !== "1.0") return { ok: false, reason: "unsupported_protocol_version" };
  if (!isNonEmptyString(m.kind) || !ALLOWED_KINDS.has(m.kind as MessageKind)) {
    return { ok: false, reason: "invalid_kind" };
  }
  if (typeof m.created_at !== "number") return { ok: false, reason: "invalid_created_at" };

  if (!isObject(m.sender)) return { ok: false, reason: "invalid_sender" };
  for (const key of ["user_id", "device_id", "agent_id", "app_id", "user_pubkey", "device_pubkey", "agent_pubkey"]) {
    if (!isNonEmptyString(m.sender[key])) return { ok: false, reason: `invalid_sender_${key}` };
  }

  if (!isObject(m.attestation)) return { ok: false, reason: "invalid_attestation" };
  if (!isObject(m.authz)) return { ok: false, reason: "invalid_authz" };
  if (!isObject(m.integrity)) return { ok: false, reason: "invalid_integrity" };
  if (!isObject(m.payload)) return { ok: false, reason: "invalid_payload" };

  const attestationType = m.attestation.attestation_type;
  const allowedAttestations: AttestationType[] = ["none", "software", "hardware", "social", "quorum"];
  if (!allowedAttestations.includes(attestationType as AttestationType)) {
    return { ok: false, reason: "invalid_attestation_type" };
  }

  return { ok: true };
}

export function isReplay(state: AppState, userId: string, nonce: string): boolean {
  const set = state.nonceCache.get(userId) ?? new Set<string>();
  if (set.has(nonce)) return true;
  set.add(nonce);
  state.nonceCache.set(userId, set);
  return false;
}

export function verifyTemporalWindow(msg: MessageEnvelope): boolean {
  const now = Math.floor(Date.now() / 1000);
  return msg.authz.valid_from <= now && now <= msg.authz.valid_to;
}

export function verifyChainLink(msg: MessageEnvelope, state: AppState): boolean {
  if (state.eventLog.length === 0) return true;
  const last = state.eventLog[state.eventLog.length - 1];
  return msg.authz.prev_event_hash === last.integrity.chain_hash || msg.authz.prev_event_hash === last.integrity.payload_hash;
}

export function verifyIntegrity(msg: MessageEnvelope): boolean {
  const payloadHash = sha256Hex(canonicalJson(msg.payload));
  if (payloadHash !== msg.integrity.payload_hash) return false;

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

export function verifyAuthz(msg: MessageEnvelope): boolean {
  if (!msg.authz.capability_token) return false;
  return verifyCapabilityToken(msg.authz.capability_token, msg.kind, msg.authz.scope);
}

export function policyOk(_msg: MessageEnvelope, _state: AppState): boolean {
  return true;
}

export function validateAndAuthorize(msg: MessageEnvelope, state: AppState): ProcessResult {
  const base = validateEnvelope(msg);
  if (!base.ok) return { accepted: false, reason: base.reason ?? "invalid_message" };

  if (!verifyIntegrity(msg)) return { accepted: false, reason: "bad_integrity" };
  if (!verifyTemporalWindow(msg)) return { accepted: false, reason: "expired_or_not_yet_valid" };
  if (isReplay(state, msg.sender.user_id, msg.authz.nonce)) return { accepted: false, reason: "replay_detected" };
  if (!verifyChainLink(msg, state)) return { accepted: false, reason: "causal_break" };
  if (!verifyAuthz(msg)) return { accepted: false, reason: "unauthorized" };
  if (!policyOk(msg, state)) return { accepted: false, reason: "policy_flag" };

  return { accepted: true, reason: "ok" };
}
