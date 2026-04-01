import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { MatchSuggestion } from "../hooks/useLLM";

interface Props {
  suggestion: MatchSuggestion;
  onPress?: () => void;
  expanded?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  mutual_aid: "#10b981",
  project: "#6366f1",
  bulk_purchase: "#f59e0b",
  skill_exchange: "#0ea5e9",
  community_event: "#ec4899"
};

const TYPE_LABELS: Record<string, string> = {
  mutual_aid: "互助机会",
  project: "项目合作",
  bulk_purchase: "团购议价",
  skill_exchange: "技能交换",
  community_event: "社区活动"
};

export function MatchCard({ suggestion, onPress, expanded }: Props) {
  const color = TYPE_COLORS[suggestion.type] ?? "#6366f1";
  const label = TYPE_LABELS[suggestion.type] ?? suggestion.type;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: color + "22" }]}>
          <Text style={[styles.typeText, { color }]}>{label}</Text>
        </View>
        <Text style={styles.confidence}>
          {Math.round(suggestion.confidence * 100)}% 匹配
        </Text>
      </View>

      <Text style={styles.title}>{suggestion.title}</Text>
      <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
        {suggestion.description}
      </Text>

      {expanded && suggestion.participants.length > 0 && (
        <View style={styles.participantsRow}>
          <Text style={styles.participantsLabel}>相关成员: </Text>
          <Text style={styles.participantsText}>
            {suggestion.participants.slice(0, 3).join(", ")}
            {suggestion.participants.length > 3 ? ` 等 ${suggestion.participants.length} 人` : ""}
          </Text>
        </View>
      )}

      {expanded && suggestion.suggestedAction && (
        <View style={styles.actionHint}>
          <Text style={styles.actionHintText}>💡 {suggestion.suggestedAction}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeText: { fontSize: 12, fontWeight: "600" },
  confidence: { fontSize: 12, color: "#64748b" },
  title: { fontSize: 15, fontWeight: "700", color: "#f1f5f9", marginBottom: 6 },
  description: { fontSize: 13, color: "#94a3b8", lineHeight: 20 },
  participantsRow: { flexDirection: "row", marginTop: 10, flexWrap: "wrap" },
  participantsLabel: { fontSize: 12, color: "#64748b" },
  participantsText: { fontSize: 12, color: "#94a3b8" },
  actionHint: {
    marginTop: 10,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    padding: 10
  },
  actionHintText: { fontSize: 13, color: "#6366f1", lineHeight: 20 }
});
