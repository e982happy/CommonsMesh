import type { AppState } from "./types.js";

export function createInitialState(): AppState {
  return {
    eventLog: [],
    nonceCache: new Map(),
    graph: {
      nodes: new Map(),
      edges: new Map()
    },
    projects: new Map(),
    elections: new Map(),
    disputes: new Map(),
    capabilities: new Map(),
    trust: new Map(),
    capabilityUsage: new Map(),
    revokedCapabilities: new Set()
  };
}
