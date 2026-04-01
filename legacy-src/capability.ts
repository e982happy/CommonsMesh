import { canonicalJson } from "./canonical.js";
import { sha256Hex, verifyObjectSignature } from "./crypto.js";
import type { CapabilityToken, MessageKind, Scope } from "./types.js";

export function createCapabilityId(): string {
  return `cap_${sha256Hex(cryptoRandom()).slice(0, 24)}`;
}

function cryptoRandom(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function encodeCapabilityToken(token: CapabilityToken): string {
  return canonicalJson(token);
}

export function decodeCapabilityToken(token: string): CapabilityToken | null {
  try {
    const parsed = JSON.parse(token) as CapabilityToken;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function verifyCapabilityToken(
  token: CapabilityToken | null,
  kind: MessageKind,
  scope: Scope
): boolean {
  if (!token) return false;

  if (Date.now() / 1000 > token.constraints.expires_at) return false;
  if (Date.now() / 1000 < token.valid_from) return false;
  if (Date.now() / 1000 > token.valid_to) return false;

  const scopeMatch =
    (!token.scope.project_id || token.scope.project_id === scope.target_ref) ||
    (!token.scope.topic || token.scope.topic === scope.target_ref) ||
    (!token.scope.object_id || token.scope.object_id === scope.target_ref);

  if (!scopeMatch) return false;

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

export function verifyCapabilitySignature(
  token: CapabilityToken,
  issuerPublicKeyPem: string
): boolean {
  const { signature, ...unsigned } = token;
  return verifyObjectSignature(unsigned, signature, issuerPublicKeyPem);
}
