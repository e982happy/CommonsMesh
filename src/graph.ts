import type { AppState, GraphEdge, GraphNode, MessageEnvelope } from "./types.js";

export function ensureNode(state: AppState, node: GraphNode): void {
  state.graph.nodes.set(node.node_id, node);
}

export function addEdge(state: AppState, edge: GraphEdge): void {
  const key = `${edge.from}::${edge.edge_type}::${edge.to}`;
  state.graph.edges.set(key, edge);
}

export function removeEdge(state: AppState, from: string, to: string, edgeType: GraphEdge["edge_type"]): void {
  const key = `${from}::${edgeType}::${to}`;
  state.graph.edges.delete(key);
}

export function appendEvent(state: AppState, msg: MessageEnvelope): void {
  state.eventLog.push(msg);
}
