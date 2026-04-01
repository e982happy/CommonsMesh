/**
 * Community Graph Matcher
 *
 * Analyzes the local community graph and uses the LLM to identify:
 *  1. Mutual aid opportunities (need ↔ resource matches)
 *  2. Aggregated demand (multiple users need the same thing → bulk purchase)
 *  3. Project formation opportunities (complementary skills/interests)
 *  4. Skill exchange pairs
 *  5. Community events that could address shared needs
 *
 * The matcher runs entirely on-device. No community data leaves the device
 * unless the user explicitly publishes a project.motion or similar event.
 */

import type { LLMEngine } from "./llm-engine.js";
import type { AppState, GraphNode } from "@commonsmesh/protocol";

export interface MatchSuggestion {
  id: string;
  type: "mutual_aid" | "project" | "bulk_purchase" | "skill_exchange" | "community_event";
  title: string;
  description: string;
  confidence: number;
  participants: string[];
  projectId?: string;
  suggestedAction?: string;
  rawLLMOutput?: string;
}

export interface MatcherContext {
  /** The current user's ID */
  myUserId: string;
  /** The full app state (read-only) */
  state: AppState;
  /** The LLM engine */
  llm: LLMEngine;
  /** Maximum number of suggestions to return */
  maxSuggestions?: number;
}

/**
 * Run the full matching pipeline and return suggestions.
 */
export async function runMatcher(ctx: MatcherContext): Promise<MatchSuggestion[]> {
  const { myUserId, state, llm, maxSuggestions = 10 } = ctx;

  // 1. Extract relevant graph data
  const graphSummary = buildGraphSummary(state, myUserId);

  if (graphSummary.totalNodes === 0) {
    return [];
  }

  // 2. Run rule-based pre-matching (fast, no LLM)
  const ruleBasedMatches = runRuleBasedMatching(state, myUserId);

  // 3. Use LLM to find deeper patterns and generate human-readable suggestions
  const llmSuggestions = await runLLMMatching(llm, graphSummary, myUserId);

  // 4. Merge and deduplicate
  const all = [...ruleBasedMatches, ...llmSuggestions];
  const deduped = deduplicateSuggestions(all);

  // 5. Sort by confidence and return top N
  return deduped
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxSuggestions);
}

// ---------------------------------------------------------------------------
// Graph summary builder
// ---------------------------------------------------------------------------

interface GraphSummary {
  totalNodes: number;
  myNeeds: string[];
  myResources: string[];
  communityNeeds: Array<{ userId: string; need: string }>;
  communityResources: Array<{ userId: string; resource: string }>;
  activeProjects: Array<{ id: string; title: string; status: string; participantCount: number }>;
  aggregatedNeeds: Array<{ need: string; count: number; users: string[] }>;
}

function buildGraphSummary(state: AppState, myUserId: string): GraphSummary {
  const myNeeds: string[] = [];
  const myResources: string[] = [];
  const communityNeeds: Array<{ userId: string; need: string }> = [];
  const communityResources: Array<{ userId: string; resource: string }> = [];
  const needCounts = new Map<string, string[]>();

  // Traverse graph edges
  for (const [edgeKey, edge] of state.graph.edges) {
    const [from, edgeType, to] = edgeKey.split("::");
    const targetNode = state.graph.nodes.get(to);
    if (!targetNode) continue;

    const label =
      (targetNode.attrs as any)?.title ??
      (targetNode.attrs as any)?.label ??
      to;

    if (edgeType === "needs") {
      if (from === myUserId) {
        myNeeds.push(label);
      } else {
        communityNeeds.push({ userId: from, need: label });
        const existing = needCounts.get(label) ?? [];
        existing.push(from);
        needCounts.set(label, existing);
      }
    } else if (edgeType === "offers") {
      if (from === myUserId) {
        myResources.push(label);
      } else {
        communityResources.push({ userId: from, resource: label });
      }
    }
  }

  // Find aggregated needs (3+ people need the same thing)
  const aggregatedNeeds = Array.from(needCounts.entries())
    .filter(([, users]) => users.length >= 2)
    .map(([need, users]) => ({ need, count: users.length, users }));

  // Active projects
  const activeProjects = Array.from(state.projects.values())
    .filter((p) => ["recruiting", "assigned", "active"].includes(p.status))
    .map((p) => ({
      id: p.project_id,
      title: (p.motion as any)?.title ?? p.project_id,
      status: p.status,
      participantCount: p.intents.size
    }));

  return {
    totalNodes: state.graph.nodes.size,
    myNeeds,
    myResources,
    communityNeeds,
    communityResources,
    activeProjects,
    aggregatedNeeds
  };
}

// ---------------------------------------------------------------------------
// Rule-based matching (fast, deterministic)
// ---------------------------------------------------------------------------

function runRuleBasedMatching(state: AppState, myUserId: string): MatchSuggestion[] {
  const suggestions: MatchSuggestion[] = [];

  // Find direct need ↔ resource matches
  for (const [edgeKey] of state.graph.edges) {
    const [from, edgeType, to] = edgeKey.split("::");
    if (from !== myUserId || edgeType !== "needs") continue;

    // Find who offers this resource
    for (const [offerKey] of state.graph.edges) {
      const [offerFrom, offerType, offerTo] = offerKey.split("::");
      if (offerType !== "offers" || offerTo !== to || offerFrom === myUserId) continue;

      const resourceNode = state.graph.nodes.get(to);
      const resourceLabel = (resourceNode?.attrs as any)?.title ?? to;

      suggestions.push({
        id: `rule_match_${from}_${offerFrom}_${to}`,
        type: "mutual_aid",
        title: `互助机会: ${resourceLabel}`,
        description: `社区成员 ${offerFrom.slice(0, 16)}… 可以提供你需要的「${resourceLabel}」。`,
        confidence: 0.85,
        participants: [myUserId, offerFrom],
        suggestedAction: `向对方发送合作邀请，共同完成「${resourceLabel}」相关事项。`
      });
    }
  }

  // Find aggregated demand opportunities
  const needCounts = new Map<string, string[]>();
  for (const [edgeKey] of state.graph.edges) {
    const [from, edgeType, to] = edgeKey.split("::");
    if (edgeType !== "needs") continue;
    const existing = needCounts.get(to) ?? [];
    existing.push(from);
    needCounts.set(to, existing);
  }

  for (const [nodeId, users] of needCounts) {
    if (users.length < 3) continue;
    const node = state.graph.nodes.get(nodeId);
    const label = (node?.attrs as any)?.title ?? nodeId;

    suggestions.push({
      id: `rule_bulk_${nodeId}`,
      type: "bulk_purchase",
      title: `团购机会: ${label}`,
      description: `${users.length} 位社区成员都需要「${label}」，可以联合议价或团购。`,
      confidence: 0.75,
      participants: users,
      suggestedAction: `发起「${label}」团购动议，邀请 ${users.length} 位成员参与。`
    });
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// LLM-based matching (deeper pattern recognition)
// ---------------------------------------------------------------------------

async function runLLMMatching(
  llm: LLMEngine,
  summary: GraphSummary,
  myUserId: string
): Promise<MatchSuggestion[]> {
  if (!llm.isReady()) return [];
  if (summary.totalNodes < 3) return [];

  const prompt = buildMatchingPrompt(summary, myUserId);

  let rawOutput = "";
  try {
    rawOutput = await llm.chat(
      [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: prompt
        }
      ],
      600
    );
  } catch (err) {
    console.warn("[matcher] LLM inference failed:", err);
    return [];
  }

  return parseLLMOutput(rawOutput, myUserId);
}

const SYSTEM_PROMPT = `你是 CommonsMesh 社区互助 AI 助手。你的任务是分析社区图谱数据，发现潜在的合作互助机会。

你必须以 JSON 数组格式输出建议，每个建议包含以下字段：
- type: "mutual_aid" | "project" | "bulk_purchase" | "skill_exchange" | "community_event"
- title: 简短标题（20字以内）
- description: 详细描述（100字以内）
- confidence: 0.0-1.0 之间的置信度
- participants: 相关用户 ID 数组
- suggestedAction: 建议的下一步行动

只输出 JSON，不要有其他文字。`;

function buildMatchingPrompt(summary: GraphSummary, myUserId: string): string {
  const lines: string[] = [
    `当前用户: ${myUserId.slice(0, 20)}`,
    ``,
    `我的需求: ${summary.myNeeds.slice(0, 5).join(", ") || "（无）"}`,
    `我能提供: ${summary.myResources.slice(0, 5).join(", ") || "（无）"}`,
    ``
  ];

  if (summary.communityNeeds.length > 0) {
    lines.push("社区需求（最近20条）:");
    summary.communityNeeds.slice(0, 20).forEach(({ userId, need }) => {
      lines.push(`  - ${userId.slice(0, 16)}: 需要「${need}」`);
    });
    lines.push("");
  }

  if (summary.communityResources.length > 0) {
    lines.push("社区资源（最近20条）:");
    summary.communityResources.slice(0, 20).forEach(({ userId, resource }) => {
      lines.push(`  - ${userId.slice(0, 16)}: 提供「${resource}」`);
    });
    lines.push("");
  }

  if (summary.aggregatedNeeds.length > 0) {
    lines.push("聚合需求（多人共同需要）:");
    summary.aggregatedNeeds.forEach(({ need, count }) => {
      lines.push(`  - 「${need}」: ${count} 人需要`);
    });
    lines.push("");
  }

  if (summary.activeProjects.length > 0) {
    lines.push("活跃项目:");
    summary.activeProjects.forEach(({ title, status, participantCount }) => {
      lines.push(`  - 「${title}」(${status}, ${participantCount} 人参与)`);
    });
    lines.push("");
  }

  lines.push("请分析以上数据，找出最有价值的合作互助机会，输出 JSON 数组（最多5条）。");

  return lines.join("\n");
}

function parseLLMOutput(raw: string, myUserId: string): MatchSuggestion[] {
  try {
    // Extract JSON array from the output
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item: any) => item.title && item.type)
      .map((item: any, index: number) => ({
        id: `llm_${Date.now()}_${index}`,
        type: item.type ?? "mutual_aid",
        title: String(item.title ?? ""),
        description: String(item.description ?? ""),
        confidence: typeof item.confidence === "number"
          ? Math.max(0, Math.min(1, item.confidence))
          : 0.6,
        participants: Array.isArray(item.participants) ? item.participants : [myUserId],
        suggestedAction: item.suggestedAction ?? undefined,
        rawLLMOutput: raw
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

function deduplicateSuggestions(suggestions: MatchSuggestion[]): MatchSuggestion[] {
  const seen = new Set<string>();
  return suggestions.filter((s) => {
    // Deduplicate by a normalized title key
    const key = `${s.type}:${s.title.toLowerCase().replace(/\s+/g, "_")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
