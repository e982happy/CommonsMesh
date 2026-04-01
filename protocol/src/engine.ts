/**
 * Core state-transition engine.
 *
 * CHANGES vs. original scaffold:
 *  1. bumpTrust now operates on TrustRecord objects (not bare numbers).
 *  2. capability.revoke adds the capability ID to revokedCapabilities set
 *     and broadcasts a revocation event — the local state is updated atomically.
 *  3. applyMessage uses typed payload interfaces where available.
 *  4. project.motion uses motion_id as the canonical project key.
 */

import { appendEvent, addEdge, ensureNode } from "./graph.js";
import { sha256Hex } from "./crypto.js";
import { canonicalJson } from "./canonical.js";
import { validateAndAuthorize } from "./validator.js";
import { createInitialState } from "./state.js";
import type {
  AppState,
  GraphNode,
  MessageEnvelope,
  ProcessResult,
  ProjectRecord,
  ElectionRecord,
  TaskRecord,
  TrustRecord
} from "./types.js";

const TRUST_DECAY_RATE = 0.001; // per event processed
const TRUST_MAX = 1.0;
const TRUST_MIN = -1.0;

function ensureProject(state: AppState, projectId: string): ProjectRecord {
  let project = state.projects.get(projectId);
  if (!project) {
    project = {
      project_id: projectId,
      status: "draft",
      intents: new Map(),
      tasks: new Map(),
      progress: 0,
      updates: []
    };
    state.projects.set(projectId, project);
  }
  return project;
}

function ensureElection(state: AppState, electionId: string): ElectionRecord {
  let election = state.elections.get(electionId);
  if (!election) {
    election = {
      election_id: electionId,
      status: "proposed",
      votes: new Map(),
      nullifiers: new Set()
    };
    state.elections.set(electionId, election);
  }
  return election;
}

function ensureTask(project: ProjectRecord, taskId: string): TaskRecord {
  let task = project.tasks.get(taskId);
  if (!task) {
    task = {
      task_id: taskId,
      status: "proposed"
    };
    project.tasks.set(taskId, task);
  }
  return task;
}

function ensureTrust(state: AppState, userId: string): TrustRecord {
  let record = state.trust.get(userId);
  if (!record) {
    record = {
      user_id: userId,
      score: 0,
      positive_count: 0,
      negative_count: 0,
      last_updated: Math.floor(Date.now() / 1000)
    };
    state.trust.set(userId, record);
  }
  return record;
}

function bumpTrust(state: AppState, userId: string, delta: number): void {
  const record = ensureTrust(state, userId);
  record.score = Math.max(TRUST_MIN, Math.min(TRUST_MAX, record.score + delta));
  if (delta > 0) record.positive_count++;
  if (delta < 0) record.negative_count++;
  record.last_updated = Math.floor(Date.now() / 1000);
}

export function createEngine(state: AppState = createInitialState()) {
  return {
    state,

    process(msg: MessageEnvelope): ProcessResult {
      const verdict = validateAndAuthorize(msg, state);
      if (!verdict.accepted) return verdict;

      appendEvent(state, msg);
      applyMessage(state, msg);

      // Use canonical JSON for deterministic event hash
      const eventHash = sha256Hex(canonicalJson(msg));
      return { accepted: true, reason: "ok", eventHash };
    }
  };
}

export function applyMessage(state: AppState, msg: MessageEnvelope): void {
  const nowSec = Math.floor(Date.now() / 1000);

  switch (msg.kind) {
    case "graph.delta": {
      const payload = msg.payload as any;

      if (payload.op === "upsert_node" || payload.op === "patch_node") {
        const node: GraphNode = { ...payload.node, updated_at: nowSec };
        ensureNode(state, node);
      }

      if (payload.op === "add_edge") {
        addEdge(state, { ...payload.edge, updated_at: nowSec });
      }

      if (payload.op === "remove_edge") {
        state.graph.edges.delete(
          `${payload.edge.from}::${payload.edge.edge_type}::${payload.edge.to}`
        );
      }

      if (payload.op === "delete_node") {
        state.graph.nodes.delete(payload.node?.node_id);
      }

      bumpTrust(state, msg.sender.user_id, 0.01);
      break;
    }

    case "project.motion": {
      const payload = msg.payload as any;
      // Use motion_id as the canonical project identifier
      const projectId = payload.motion_id ?? msg.msg_id;
      const project = ensureProject(state, projectId);
      project.motion = payload;
      project.status = "recruiting";
      project.updates.push("motion_created");
      ensureNode(state, {
        node_id: projectId,
        node_type: "project",
        attrs: {
          title: payload.title,
          goal: payload.goal,
          scope: payload.scope
        },
        updated_at: nowSec
      });
      bumpTrust(state, msg.sender.user_id, 0.05);
      break;
    }

    case "project.intent": {
      const payload = msg.payload as any;
      const project = ensureProject(state, payload.project_id);
      project.intents.set(msg.sender.user_id, payload);
      if (project.status === "draft") project.status = "recruiting";
      addEdge(state, {
        from: msg.sender.user_id,
        to: payload.project_id,
        edge_type: "participates_in",
        attrs: {
          intent: payload.intent,
          available_roles: payload.available_roles ?? [],
          created_at: msg.created_at
        },
        updated_at: nowSec
      });
      bumpTrust(state, msg.sender.user_id, 0.02);
      break;
    }

    case "project.update": {
      const payload = msg.payload as any;
      const project = ensureProject(state, payload.project_id);
      project.status = payload.status ?? project.status;
      project.progress =
        typeof payload.progress === "number" ? payload.progress : project.progress;
      if (Array.isArray(payload.changes)) {
        project.updates.push(JSON.stringify(payload.changes));
      }
      break;
    }

    case "task.propose": {
      const payload = msg.payload as any;
      const project = ensureProject(state, payload.project_id);
      const task = ensureTask(project, payload.task_id);
      task.proposal = payload;
      task.status = "proposed";
      addEdge(state, {
        from: payload.task_id,
        to: payload.project_id,
        edge_type: "depends_on",
        attrs: { deadline: payload.deadline ?? null },
        updated_at: nowSec
      });
      break;
    }

    case "task.assign": {
      const payload = msg.payload as any;
      const project = ensureProject(state, payload.project_id);
      const task = ensureTask(project, payload.task_id);
      task.assignment = payload;
      task.status = "assigned";
      addEdge(state, {
        from: payload.assignee,
        to: payload.task_id,
        edge_type: "assigned_to",
        attrs: {
          role: payload.role,
          assignment_mode: payload.assignment_mode
        },
        updated_at: nowSec
      });
      break;
    }

    case "task.commit": {
      const payload = msg.payload as any;
      const project = ensureProject(state, payload.project_id);
      const task = ensureTask(project, payload.task_id);
      task.commitment = payload;
      task.status = payload.accepted ? "committed" : "assigned";
      if (payload.accepted) {
        bumpTrust(state, msg.sender.user_id, 0.03);
      }
      break;
    }

    case "task.deliver": {
      const payload = msg.payload as any;
      const project = ensureProject(state, payload.project_id);
      const task = ensureTask(project, payload.task_id);
      task.delivery = payload;
      task.status = "delivered";
      project.updates.push(payload.summary ?? "task_delivered");
      bumpTrust(state, msg.sender.user_id, 0.1);
      break;
    }

    case "election.motion": {
      const payload = msg.payload as any;
      const election = ensureElection(state, payload.election_id);
      election.motion = payload;
      election.status = "open";
      ensureNode(state, {
        node_id: payload.election_id,
        node_type: "vote",
        attrs: {
          office: payload.office,
          candidates: payload.candidates ?? []
        },
        updated_at: nowSec
      });
      break;
    }

    case "election.vote": {
      const payload = msg.payload as any;
      const election = ensureElection(state, payload.election_id);
      if (election.nullifiers.has(payload.nullifier)) break;
      election.nullifiers.add(payload.nullifier);
      election.votes.set(msg.sender.user_id, payload);
      election.status = "voting";
      addEdge(state, {
        from: msg.sender.user_id,
        to: payload.choice,
        edge_type: "voted_for",
        attrs: {
          election_id: payload.election_id,
          weight: payload.vote_weight ?? 1
        },
        updated_at: nowSec
      });
      bumpTrust(state, msg.sender.user_id, 0.01);
      break;
    }

    case "capability.grant": {
      const payload = msg.payload as any;
      state.capabilities.set(payload.capability_id, payload);
      break;
    }

    case "capability.revoke": {
      const payload = msg.payload as any;
      const capId = payload.capability_id as string;
      // Add to revoked set — this is checked in verifyCapabilityToken
      state.revokedCapabilities.add(capId);
      // Also expire the stored token if present
      const cap = state.capabilities.get(capId);
      if (cap) {
        cap.constraints.expires_at = nowSec - 1;
        state.capabilities.set(capId, cap);
      }
      break;
    }

    case "dispute.report": {
      const payload = msg.payload as any;
      const disputeId =
        payload.dispute_id ??
        `${payload.project_id}:${payload.subject}:${msg.msg_id}`;
      state.disputes.set(disputeId, {
        dispute_id: disputeId,
        report: payload,
        responses: [],
        status: "open"
      });
      // Penalize the accused party if named
      if (typeof payload.accused === "string") {
        bumpTrust(state, payload.accused, -0.05);
      }
      break;
    }

    case "dispute.response": {
      const payload = msg.payload as any;
      const key =
        payload.dispute_id ??
        `${payload.project_id}:${payload.subject}`;
      const dispute = state.disputes.get(key);
      if (dispute) {
        dispute.responses.push(payload);
        dispute.status = "under_review";
      }
      break;
    }

    case "ack":
    case "sync.request":
    case "sync.snapshot":
      // These are handled at the transport layer, not the engine layer.
      break;
  }
}
