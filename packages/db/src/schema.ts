/**
 * Database schema constants and helper types.
 * Mirrors the SQL schema in migrations/001_initial.sql.
 */

export const TABLES = {
  events: "events",
  graphNodes: "graph_nodes",
  graphEdges: "graph_edges",
  projects: "projects",
  tasks: "tasks",
  elections: "elections",
  electionVotes: "election_votes",
  disputes: "disputes",
  disputeResponses: "dispute_responses",
  capabilities: "capabilities",
  trust: "trust",
  nonces: "nonces",
  syncState: "sync_state"
} as const;

export interface EventRow {
  id: number;
  event_hash: string;
  chain_hash: string;
  msg_id: string;
  kind: string;
  created_at: number;
  sender_id: string;
  topic_ref: string;
  raw_json: string;
  inserted_at: number;
}

export interface GraphNodeRow {
  node_id: string;
  node_type: string;
  attrs_json: string;
  updated_at: number;
}

export interface GraphEdgeRow {
  edge_key: string;
  from_id: string;
  to_id: string;
  edge_type: string;
  attrs_json: string;
  updated_at: number;
}

export interface TrustRow {
  user_id: string;
  score: number;
  positive_count: number;
  negative_count: number;
  last_updated: number;
}

export interface CapabilityRow {
  capability_id: string;
  issuer_id: string;
  holder_id: string;
  token_json: string;
  expires_at: number;
  revoked: number;
  usage_count: number;
  updated_at: number;
}
