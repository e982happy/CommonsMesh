/**
 * Graph node and edge persistence layer.
 * Provides CRUD operations and common graph traversal queries.
 */

import type { DB } from "./index.js";
import type { GraphNode, GraphEdge, NodeType, EdgeType } from "@commonsmesh/protocol";

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

export function upsertNode(db: DB, node: GraphNode): void {
  const nowSec = Math.floor(Date.now() / 1000);
  db.prepare(`
    INSERT INTO graph_nodes (node_id, node_type, attrs_json, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(node_id) DO UPDATE SET
      node_type  = excluded.node_type,
      attrs_json = excluded.attrs_json,
      updated_at = excluded.updated_at
  `).run(node.node_id, node.node_type, JSON.stringify(node.attrs), nowSec);
}

export function deleteNode(db: DB, nodeId: string): void {
  db.prepare("DELETE FROM graph_nodes WHERE node_id = ?").run(nodeId);
}

export function getNode(db: DB, nodeId: string): GraphNode | null {
  const row = db
    .prepare("SELECT * FROM graph_nodes WHERE node_id = ?")
    .get(nodeId) as { node_id: string; node_type: string; attrs_json: string } | undefined;
  if (!row) return null;
  return {
    node_id: row.node_id,
    node_type: row.node_type as NodeType,
    attrs: JSON.parse(row.attrs_json)
  };
}

export function getNodesByType(db: DB, nodeType: NodeType): GraphNode[] {
  const rows = db
    .prepare("SELECT * FROM graph_nodes WHERE node_type = ?")
    .all(nodeType) as { node_id: string; node_type: string; attrs_json: string }[];
  return rows.map((r) => ({
    node_id: r.node_id,
    node_type: r.node_type as NodeType,
    attrs: JSON.parse(r.attrs_json)
  }));
}

// ---------------------------------------------------------------------------
// Edges
// ---------------------------------------------------------------------------

export function upsertEdge(db: DB, edge: GraphEdge): void {
  const nowSec = Math.floor(Date.now() / 1000);
  const edgeKey = `${edge.from}::${edge.edge_type}::${edge.to}`;
  db.prepare(`
    INSERT INTO graph_edges (edge_key, from_id, to_id, edge_type, attrs_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(edge_key) DO UPDATE SET
      attrs_json = excluded.attrs_json,
      updated_at = excluded.updated_at
  `).run(edgeKey, edge.from, edge.to, edge.edge_type, JSON.stringify(edge.attrs), nowSec);
}

export function deleteEdge(db: DB, from: string, edgeType: EdgeType, to: string): void {
  const edgeKey = `${from}::${edgeType}::${to}`;
  db.prepare("DELETE FROM graph_edges WHERE edge_key = ?").run(edgeKey);
}

export function getEdgesFrom(db: DB, fromId: string, edgeType?: EdgeType): GraphEdge[] {
  let rows: any[];
  if (edgeType) {
    rows = db
      .prepare("SELECT * FROM graph_edges WHERE from_id = ? AND edge_type = ?")
      .all(fromId, edgeType);
  } else {
    rows = db
      .prepare("SELECT * FROM graph_edges WHERE from_id = ?")
      .all(fromId);
  }
  return rows.map(rowToEdge);
}

export function getEdgesTo(db: DB, toId: string, edgeType?: EdgeType): GraphEdge[] {
  let rows: any[];
  if (edgeType) {
    rows = db
      .prepare("SELECT * FROM graph_edges WHERE to_id = ? AND edge_type = ?")
      .all(toId, edgeType);
  } else {
    rows = db
      .prepare("SELECT * FROM graph_edges WHERE to_id = ?")
      .all(toId);
  }
  return rows.map(rowToEdge);
}

function rowToEdge(r: any): GraphEdge {
  return {
    from: r.from_id,
    to: r.to_id,
    edge_type: r.edge_type as EdgeType,
    attrs: JSON.parse(r.attrs_json)
  };
}

// ---------------------------------------------------------------------------
// Graph queries
// ---------------------------------------------------------------------------

/**
 * Find all nodes that a given user offers resources to.
 */
export function getOffersBy(db: DB, userId: string): GraphNode[] {
  const edges = getEdgesFrom(db, userId, "offers");
  return edges
    .map((e) => getNode(db, e.to))
    .filter((n): n is GraphNode => n !== null);
}

/**
 * Find all nodes that a given user needs.
 */
export function getNeedsOf(db: DB, userId: string): GraphNode[] {
  const edges = getEdgesFrom(db, userId, "needs");
  return edges
    .map((e) => getNode(db, e.to))
    .filter((n): n is GraphNode => n !== null);
}

/**
 * Find potential matches: users whose offers overlap with a given user's needs.
 * Returns pairs of (offeror, need_node).
 */
export function findPotentialMatches(
  db: DB,
  userId: string
): Array<{ offeror: string; needNode: GraphNode }> {
  const myNeeds = getNeedsOf(db, userId);
  const results: Array<{ offeror: string; needNode: GraphNode }> = [];

  for (const needNode of myNeeds) {
    // Find who offers this resource
    const offerEdges = getEdgesTo(db, needNode.node_id, "offers");
    for (const edge of offerEdges) {
      if (edge.from !== userId) {
        results.push({ offeror: edge.from, needNode });
      }
    }
  }

  return results;
}

/**
 * Get all projects a user participates in.
 */
export function getProjectsForUser(db: DB, userId: string): string[] {
  const edges = getEdgesFrom(db, userId, "participates_in");
  return edges.map((e) => e.to);
}

/**
 * Get trust score for a user.
 */
export function getTrustScore(db: DB, userId: string): number {
  const row = db
    .prepare("SELECT score FROM trust WHERE user_id = ?")
    .get(userId) as { score: number } | undefined;
  return row?.score ?? 0;
}

/**
 * Upsert trust record.
 */
export function upsertTrust(
  db: DB,
  userId: string,
  score: number,
  positiveCount: number,
  negativeCount: number
): void {
  const nowSec = Math.floor(Date.now() / 1000);
  db.prepare(`
    INSERT INTO trust (user_id, score, positive_count, negative_count, last_updated)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      score          = excluded.score,
      positive_count = excluded.positive_count,
      negative_count = excluded.negative_count,
      last_updated   = excluded.last_updated
  `).run(userId, score, positiveCount, negativeCount, nowSec);
}
