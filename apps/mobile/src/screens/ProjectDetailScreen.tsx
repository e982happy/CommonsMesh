import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useEngineStore } from "../store/engineStore";

type Props = NativeStackScreenProps<RootStackParamList, "ProjectDetail">;

export function ProjectDetailScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const { getState } = useEngineStore();
  const state = getState();
  const project = state?.projects.get(projectId);

  if (!project) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>项目未找到</Text>
      </View>
    );
  }

  const tasks = Array.from(project.tasks.values());
  const intents = Array.from(project.intents.entries());

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{(project.motion as any)?.title ?? projectId}</Text>
      <Text style={styles.goal}>{(project.motion as any)?.goal ?? ""}</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{intents.length}</Text>
          <Text style={styles.statLabel}>参与者</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{tasks.length}</Text>
          <Text style={styles.statLabel}>任务</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Math.round(project.progress * 100)}%</Text>
          <Text style={styles.statLabel}>进度</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>任务列表</Text>
      {tasks.length === 0 ? (
        <Text style={styles.emptyText}>还没有任务。AI 可以根据项目目标自动建议分工。</Text>
      ) : (
        tasks.map((task) => (
          <TouchableOpacity
            key={task.task_id}
            style={styles.taskCard}
            onPress={() => navigation.navigate("Task", { taskId: task.task_id, projectId })}
          >
            <Text style={styles.taskTitle}>
              {(task.proposal as any)?.title ?? task.task_id}
            </Text>
            <Text style={styles.taskStatus}>{task.status}</Text>
          </TouchableOpacity>
        ))
      )}

      <Text style={styles.sectionTitle}>参与者</Text>
      {intents.map(([userId, intent]) => (
        <View key={userId} style={styles.intentRow}>
          <Text style={styles.intentUser}>{userId.slice(0, 20)}…</Text>
          <Text style={styles.intentType}>{(intent as any).intent}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20, paddingBottom: 60 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" },
  errorText: { color: "#f87171" },
  title: { fontSize: 22, fontWeight: "700", color: "#f1f5f9", marginBottom: 8 },
  goal: { fontSize: 15, color: "#94a3b8", lineHeight: 24, marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  stat: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    alignItems: "center"
  },
  statValue: { fontSize: 22, fontWeight: "700", color: "#6366f1" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#64748b", marginBottom: 12, textTransform: "uppercase" },
  emptyText: { fontSize: 14, color: "#475569", fontStyle: "italic" },
  taskCard: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  taskTitle: { fontSize: 15, color: "#e2e8f0", flex: 1 },
  taskStatus: { fontSize: 12, color: "#6366f1", marginLeft: 8 },
  intentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b"
  },
  intentUser: { fontSize: 13, color: "#94a3b8" },
  intentType: { fontSize: 13, color: "#6366f1" }
});
