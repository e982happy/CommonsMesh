// CommonsMesh Protocol Types v1.0
// This file is the canonical source of truth for all protocol types.

export type ProtocolVersion = "1.0";

export type Visibility = "public" | "topic" | "project" | "direct" | "private";
export type TargetMode = "broadcast" | "topic" | "peer" | "group" | "selector";
export type AttestationType = "none" | "software" | "hardware" | "social" | "quorum";

export type MessageKind =
  | "graph.delta"
  | "project.motion"
  | "project.intent"
  | "project.update"
  | "task.propose"
  | "task.assign"
  | "task.commit"
  | "task.deliver"
  | "election.motion"
  | "election.vote"
  | "capability.grant"
  | "capability.revoke"
  | "dispute.report"
  | "dispute.response"
  | "ack"
  | "sync.request"
  | "sync.snapshot";

export interface SenderIdentity {
  user_id: string;
  device_id: string;
  agent_id: string;
  app_id: string;
  user_pubkey: string;
  device_pubkey: string;
  agent_pubkey: string;
}

export interface Attestation {
  app_build_hash: string;
  manifest_hash: string;
  attestation_type: AttestationType;
  attestation_proof: string;
}

export interface Scope {
  visibility: Visibility;
  target_mode: TargetMode;
  target_ref: string;
}

export interface Authorization {
  capability_token: CapabilityToken | null;
  scope: Scope;
  valid_from: number;
  valid_to: number;
  nonce: string;
  prev_event_hash: string;
}

export interface Integrity {
  payload_hash: string;
  signature: string;
  chain_hash: string;
}

export interface MessageEnvelope<TPayload = Record<string, unknown>> {
  msg_id: string;
  protocol_version: ProtocolVersion;
  kind: MessageKind;
  created_at: number;
  sender: SenderIdentity;
  attestation: Attestation;
  authz: Authorization;
  integrity: Integrity;
  payload: TPayload;
}

export type NodeType =
  | "person"
  | "agent"
  | "resource"
  | "need"
  | "project"
  | "motion"
  | "task"
  | "vote"
  | "evidence"
  | "reputation"
  | "organization"
  | "location"
  | "topic";

export interface GraphNode {
  node_id: string;
  node_type: NodeType;
  attrs: Record<string, unknown>;
  updated_at?: number;
}

export type EdgeType =
  | "offers"
  | "needs"
  | "participates_in"
  | "proposed_by"
  | "assigned_to"
  | "voted_for"
  | "trusts"
  | "verified_by"
  | "depends_on"
  | "supports"
  | "conflicts_with"
  | "supersedes"
  | "endorsed_by"
  | "located_in"
  | "member_of";

export interface GraphEdge {
  from: string;
  to: string;
  edge_type: EdgeType;
  attrs: Record<string, unknown>;
  updated_at?: number;
}

export interface CapabilityToken {
  capability_id: string;
  issuer: string;
  /** PEM-encoded Ed25519 public key of the issuer — required for signature verification */
  issuer_pubkey: string;
  holder: string;
  scope: {
    project_id?: string;
    topic?: string;
    object_id?: string;
  };
  rights: string[];
  constraints: {
    max_count: number;
    expires_at: number;
    requires_ack: boolean;
  };
  valid_from: number;
  valid_to: number;
  nonce: string;
  signature: string;
}

export interface ProjectRecord {
  project_id: string;
  status: "draft" | "recruiting" | "assigned" | "active" | "blocked" | "completed" | "archived";
  motion?: Record<string, unknown>;
  intents: Map<string, Record<string, unknown>>;
  tasks: Map<string, TaskRecord>;
  progress: number;
  updates: string[];
}

export interface TaskRecord {
  task_id: string;
  status: "proposed" | "assigned" | "committed" | "delivering" | "delivered" | "verified" | "disputed" | "resolved" | "closed";
  proposal?: Record<string, unknown>;
  assignment?: Record<string, unknown>;
  commitment?: Record<string, unknown>;
  delivery?: Record<string, unknown>;
}

export interface ElectionRecord {
  election_id: string;
  status: "proposed" | "open" | "voting" | "tallying" | "finalized" | "archived";
  motion?: Record<string, unknown>;
  votes: Map<string, Record<string, unknown>>;
  nullifiers: Set<string>;
}

export interface DisputeRecord {
  dispute_id: string;
  report: Record<string, unknown>;
  responses: Record<string, unknown>[];
  status: "open" | "under_review" | "resolved" | "closed";
}

export interface TrustRecord {
  user_id: string;
  score: number;
  positive_count: number;
  negative_count: number;
  last_updated: number;
}

export interface GraphState {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
}

export interface AppState {
  eventLog: MessageEnvelope[];
  /** Map<userId, Map<nonce, recordedAtUnixSec>> — bounded by TTL eviction */
  nonceCache: Map<string, Map<string, number>>;
  graph: GraphState;
  projects: Map<string, ProjectRecord>;
  elections: Map<string, ElectionRecord>;
  disputes: Map<string, DisputeRecord>;
  capabilities: Map<string, CapabilityToken>;
  trust: Map<string, TrustRecord>;
  /** Map<capabilityId, usageCount> */
  capabilityUsage: Map<string, number>;
  /** Set of revoked capability IDs */
  revokedCapabilities: Set<string>;
}

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

export interface ProcessResult {
  accepted: boolean;
  reason: string;
  eventHash?: string;
}

export interface SyncRequestPayload {
  topics: string[];
  bloom_filter?: string;
  latest_hashes: Record<string, string>;
  sync_version: "1.0";
}

export interface SyncSnapshotPayload {
  topic: string;
  events: string[];
  has_more: boolean;
  chunk_index: number;
}
