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
  | "supersedes";

export interface GraphEdge {
  from: string;
  to: string;
  edge_type: EdgeType;
  attrs: Record<string, unknown>;
}

export interface CapabilityToken {
  capability_id: string;
  issuer: string;
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

export interface GraphState {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
}

export interface AppState {
  eventLog: MessageEnvelope[];
  nonceCache: Map<string, Set<string>>;
  graph: GraphState;
  projects: Map<string, ProjectRecord>;
  elections: Map<string, ElectionRecord>;
  disputes: Map<string, DisputeRecord>;
  capabilities: Map<string, CapabilityToken>;
  trust: Map<string, number>;
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
