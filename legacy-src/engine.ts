import { appendEvent, addEdge, ensureNode } from "./graph.js";
import { sha256Hex } from "./crypto.js";
import { validateAndAuthorize } from "./validator.js";
import { createInitialState } from "./state.js";
import type {
  AppState,
  GraphNode,
  MessageEnvelope,
  ProcessResult,
  ProjectRecord,
  ElectionRecord,
  TaskRecord
} from "./types.js";

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

function bumpTrust(state: AppState, userId: string, delta: number): void {
  const current = state.trust.get(userId) ?? 0;
  state.trust.set(userId, current + delta);
}

export function createEngine(state: AppState = createInitialState()) {
  return {
    state,

    process(msg: MessageEnvelope): ProcessResult {
      const verdict = validateAndAuthorize(msg, state);
      if (!verdict.accepted) return verdict;

      appendEvent(state, msg);
      applyMessage(state, msg);

      const eventHash = sha256Hex(JSON.stringify(msg));
      return { accepted: true, reason: "ok", eventHash };
    }
  };
}

export function applyMessage(state: AppState, msg: MessageEnvelope): void {
  switch (msg.kind) {
    case "graph.delta": {
      const payload = msg.payload as any;

      if (payload.op === "upsert_node" || payload.op === "patch_node") {
        const node: GraphNode = payload.node;
        ensureNode(state, node);
      }

      if (payload.op === "add_edge") {
        addEdge(state, payload.edge);
      }

      if (payload.op === "remove_edge") {
        state.graph.edges.delete(`${payload.edge.from}::${payload.edge.edge_type}::${payload.edge.to}`);
      }

      if (payload.op === "delete_node") {
        state.graph.nodes.delete(payload.node?.node_id);
      }

      bumpTrust(state, msg.sender.user_id, 0.01);
      break;
    }

    case "project.motion": {
      const payload = msg.payload as any;
      const project = ensureProject(state, payload.motion_id ?? payload.project_id ?? msg.msg_id);
      project.motion = payload;
      project.status = "recruiting";
      project.updates.push("motion_created");
      ensureNode(state, {
        node_id: project.project_id,
        node_type: "project",
        attrs: {
          title: payload.title,
          goal: payload.goal,
          scope: payload.scope
        }
      });
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
        }
      });
      bumpTrust(state, msg.sender.user_id, 0.02);
      break;
    }

    case "project.update": {
      const payload = msg.payload as any;
      const project = ensureProject(state, payload.project_id);
      project.status = payload.status ?? project.status;
      project.progress = typeof payload.progress === "number" ? payload.progress : project.progress;
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
        attrs: { deadline: payload.deadline ?? null }
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
        }
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
        }
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
        }
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
      const cap = state.capabilities.get(payload.capability_id);
      if (cap) {
        cap.constraints.expires_at = Math.floor(Date.now() / 1000) - 1;
        state.capabilities.set(payload.capability_id, cap);
      }
      break;
    }

    case "dispute.report": {
      const payload = msg.payload as any;
      state.disputes.set(payload.dispute_id ?? `${payload.project_id}:${payload.subject}:${msg.msg_id}`, {
        dispute_id: payload.dispute_id ?? `${payload.project_id}:${payload.subject}:${msg.msg_id}`,
        report: payload,
        responses: [],
        status: "open"
      });
      break;
    }

    case "dispute.response": {
      const payload = msg.payload as any;
      const key = payload.dispute_id ?? `${payload.project_id}:${payload.subject}`;
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
      break;
  }
}
