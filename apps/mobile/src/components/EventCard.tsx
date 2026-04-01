import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { MessageEnvelope } from "@commonsmesh/protocol";

interface Props {
  event: MessageEnvelope;
  onPress?: () => void;
}

const KIND_LABELS: Record<string, string> = {
  "graph.delta": "图谱更新",
  "project.motion": "发起项目",
  "project.intent": "参与项目",
  "project.update": "项目更新",
  "task.propose": "提议任务",
  "task.assign": "分配任务",
  "task.commit": "接受任务",
  "task.deliver": "完成任务",
  "election.motion": "发起投票",
  "election.vote": "参与投票",
  "capability.grant": "授权",
  "capability.revoke": "撤销授权",
  "dispute.report": "争议报告",
  "dispute.response": "争议回应"
};

const KIND_ICONS: Record<string, string> = {
  "graph.delta": "🔗",
  "project.motion": "🚀",
  "project.intent": "🙋",
  "project.update": "📊",
  "task.propose": "📋",
  "task.assign": "👤",
  "task.commit": "✅",
  "task.deliver": "🎉",
  "election.motion": "🗳️",
  "election.vote": "✔️",
  "capability.grant": "🔑",
  "capability.revoke": "🚫",
  "dispute.report": "⚠️",
  "dispute.response": "💬"
};

function formatTime(unixSec: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixSec;
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
}

export function EventCard({ event, onPress }: Props) {
  const label = KIND_LABELS[event.kind] ?? event.kind;
  const icon = KIND_ICONS[event.kind] ?? "📌";
  const payload = event.payload as any;

  const summary =
    payload?.title ??
    payload?.goal ??
    payload?.intent ??
    payload?.summary ??
    payload?.subject ??
    "";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.kind}>{label}</Text>
          <Text style={styles.time}>{formatTime(event.created_at)}</Text>
        </View>
        {!!summary && (
          <Text style={styles.summary} numberOfLines={2}>
            {summary}
          </Text>
        )}
        <Text style={styles.sender}>
          {event.sender.user_id.slice(0, 20)}…
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    gap: 12
  },
  icon: { fontSize: 20, marginTop: 2 },
  body: { flex: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  kind: { fontSize: 13, fontWeight: "600", color: "#e2e8f0" },
  time: { fontSize: 12, color: "#475569" },
  summary: { fontSize: 13, color: "#94a3b8", lineHeight: 20, marginBottom: 4 },
  sender: { fontSize: 11, color: "#334155", fontFamily: "monospace" }
});
