import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useEngineStore } from "../store/engineStore";
import { useSettingsStore } from "../store/settingsStore";
import { buildAndSignMessage } from "../services/keychain";

type Props = NativeStackScreenProps<RootStackParamList, "Task">;

export function TaskScreen({ route }: Props) {
  const { taskId, projectId } = route.params;
  const { getState, processMessage } = useEngineStore();
  const { profile } = useSettingsStore();

  const state = getState();
  const project = state?.projects.get(projectId);
  const task = project?.tasks.get(taskId);

  const handleCommit = async (accepted: boolean) => {
    try {
      const msg = await buildAndSignMessage("task.commit", {
        task_id: taskId,
        project_id: projectId,
        accepted,
        notes: accepted ? "我接受这个任务" : "我无法完成这个任务"
      });
      const result = processMessage(msg);
      Alert.alert(
        result?.accepted ? "成功" : "失败",
        result?.accepted
          ? accepted ? "你已接受任务" : "你已拒绝任务"
          : result?.reason
      );
    } catch (err) {
      Alert.alert("错误", String(err));
    }
  };

  if (!task) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>任务未找到</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{(task.proposal as any)?.title ?? taskId}</Text>
      <Text style={styles.description}>{(task.proposal as any)?.description ?? ""}</Text>

      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>状态: {task.status}</Text>
      </View>

      {task.status === "assigned" && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => handleCommit(true)}
          >
            <Text style={styles.actionBtnText}>接受任务</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={() => handleCommit(false)}
          >
            <Text style={styles.actionBtnText}>拒绝</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20, paddingBottom: 60 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" },
  errorText: { color: "#f87171" },
  title: { fontSize: 20, fontWeight: "700", color: "#f1f5f9", marginBottom: 12 },
  description: { fontSize: 15, color: "#94a3b8", lineHeight: 24, marginBottom: 20 },
  statusBadge: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24
  },
  statusText: { color: "#6366f1", fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: "center" },
  acceptBtn: { backgroundColor: "#059669" },
  declineBtn: { backgroundColor: "#dc2626" },
  actionBtnText: { color: "#fff", fontWeight: "700" }
});
