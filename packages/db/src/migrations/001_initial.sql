-- CommonsMesh Local Database Schema v1
-- SQLite with WAL mode for concurrent read performance

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

-- ============================================================
-- Event Log (append-only, cryptographically chained)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  event_hash    TEXT    NOT NULL UNIQUE,  -- sha256 of canonical JSON
  chain_hash    TEXT    NOT NULL,         -- integrity.chain_hash
  msg_id        TEXT    NOT NULL UNIQUE,
  kind          TEXT    NOT NULL,
  created_at    INTEGER NOT NULL,         -- unix seconds
  sender_id     TEXT    NOT NULL,         -- user_id
  topic_ref     TEXT    NOT NULL DEFAULT '',  -- authz.scope.target_ref
  raw_json      TEXT    NOT NULL,         -- canonical JSON of full envelope
  inserted_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_events_sender    ON events(sender_id);
CREATE INDEX IF NOT EXISTS idx_events_kind      ON events(kind);
CREATE INDEX IF NOT EXISTS idx_events_topic     ON events(topic_ref);
CREATE INDEX IF NOT EXISTS idx_events_created   ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_chain     ON events(chain_hash);

-- ============================================================
-- Graph Nodes
-- ============================================================
CREATE TABLE IF NOT EXISTS graph_nodes (
  node_id     TEXT    PRIMARY KEY,
  node_type   TEXT    NOT NULL,
  attrs_json  TEXT    NOT NULL DEFAULT '{}',
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_nodes_type ON graph_nodes(node_type);

-- ============================================================
-- Graph Edges
-- ============================================================
CREATE TABLE IF NOT EXISTS graph_edges (
  edge_key    TEXT    PRIMARY KEY,  -- "from::edge_type::to"
  from_id     TEXT    NOT NULL,
  to_id       TEXT    NOT NULL,
  edge_type   TEXT    NOT NULL,
  attrs_json  TEXT    NOT NULL DEFAULT '{}',
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (from_id) REFERENCES graph_nodes(node_id) ON DELETE CASCADE,
  FOREIGN KEY (to_id)   REFERENCES graph_nodes(node_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_edges_from      ON graph_edges(from_id);
CREATE INDEX IF NOT EXISTS idx_edges_to        ON graph_edges(to_id);
CREATE INDEX IF NOT EXISTS idx_edges_type      ON graph_edges(edge_type);

-- ============================================================
-- Projects
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  project_id  TEXT    PRIMARY KEY,
  status      TEXT    NOT NULL DEFAULT 'draft',
  motion_json TEXT,
  progress    REAL    NOT NULL DEFAULT 0,
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- Tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  task_id      TEXT    PRIMARY KEY,
  project_id   TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'proposed',
  proposal_json    TEXT,
  assignment_json  TEXT,
  commitment_json  TEXT,
  delivery_json    TEXT,
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status  ON tasks(status);

-- ============================================================
-- Elections
-- ============================================================
CREATE TABLE IF NOT EXISTS elections (
  election_id  TEXT    PRIMARY KEY,
  status       TEXT    NOT NULL DEFAULT 'proposed',
  motion_json  TEXT,
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS election_votes (
  election_id  TEXT    NOT NULL,
  voter_id     TEXT    NOT NULL,
  nullifier    TEXT    NOT NULL UNIQUE,
  vote_json    TEXT    NOT NULL,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (election_id, voter_id),
  FOREIGN KEY (election_id) REFERENCES elections(election_id) ON DELETE CASCADE
);

-- ============================================================
-- Disputes
-- ============================================================
CREATE TABLE IF NOT EXISTS disputes (
  dispute_id   TEXT    PRIMARY KEY,
  status       TEXT    NOT NULL DEFAULT 'open',
  report_json  TEXT    NOT NULL,
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS dispute_responses (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  dispute_id   TEXT    NOT NULL,
  responder_id TEXT    NOT NULL,
  response_json TEXT   NOT NULL,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (dispute_id) REFERENCES disputes(dispute_id) ON DELETE CASCADE
);

-- ============================================================
-- Capability Tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS capabilities (
  capability_id  TEXT    PRIMARY KEY,
  issuer_id      TEXT    NOT NULL,
  holder_id      TEXT    NOT NULL,
  token_json     TEXT    NOT NULL,
  expires_at     INTEGER NOT NULL,
  revoked        INTEGER NOT NULL DEFAULT 0,  -- boolean
  usage_count    INTEGER NOT NULL DEFAULT 0,
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_cap_holder  ON capabilities(holder_id);
CREATE INDEX IF NOT EXISTS idx_cap_issuer  ON capabilities(issuer_id);
CREATE INDEX IF NOT EXISTS idx_cap_revoked ON capabilities(revoked);

-- ============================================================
-- Trust Scores
-- ============================================================
CREATE TABLE IF NOT EXISTS trust (
  user_id         TEXT    PRIMARY KEY,
  score           REAL    NOT NULL DEFAULT 0,
  positive_count  INTEGER NOT NULL DEFAULT 0,
  negative_count  INTEGER NOT NULL DEFAULT 0,
  last_updated    INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- Nonce Cache (replay protection — TTL-bounded)
-- ============================================================
CREATE TABLE IF NOT EXISTS nonces (
  user_id      TEXT    NOT NULL,
  nonce        TEXT    NOT NULL,
  recorded_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, nonce)
);

CREATE INDEX IF NOT EXISTS idx_nonces_recorded ON nonces(recorded_at);

-- ============================================================
-- Sync State (per topic)
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_state (
  topic         TEXT    PRIMARY KEY,
  latest_hash   TEXT    NOT NULL DEFAULT 'genesis',
  last_synced   INTEGER NOT NULL DEFAULT 0
);
