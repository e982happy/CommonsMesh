/**
 * Projects Screen — lists all community projects the user is aware of.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useEngineStore } from "../store/engineStore";
import { buildAndSignMessage } from "../services/keychain";
import type { ProjectRecord } from "@commonsmesh/protocol";

type Props = NativeStackScreenProps<RootStackParamList, "Projects">;

const STATUS_LABELS: Record<string, string> = {
  draft: "草稿",
  recruiting: "招募中",
  assigned: "已分工",
  active: "进行中",
  blocked: "受阻",
  completed: "已完成",
  archived: "已归档"
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#475569",
  recruiting: "#0ea5e9",
  assigned: "#8b5cf6",
  active: "#10b981",
  blocked: "#ef4444",
  completed: "#6366f1",
  archived: "#334155"
};

export function ProjectsScreen({ navigation }: Props) {
  const { getState, processMessage } = useEngineStore();
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const state = getState();
  const projects = state ? Array.from(state.projects.values()) : [];

  const handleCreateProject = async () => {
    if (!newTitle.trim() || !newGoal.trim()) {
      Alert.alert("请填写项目标题和目标");
      return;
    }
    setSubmitting(true);
    try {
      const motionId = `proj_${Date.now()}`;
      const msg = await buildAndSignMessage("project.motion", {
        motion_id: motionId,
        title: newTitle.trim(),
        goal: newGoal.trim(),
        scope: { community_tags: [] },
        requested_roles: [{ role: "coordinator", count: 1 }],
        decision_deadline: Math.floor(Date.now() / 1000) + 7 * 86400
      });
      const result = processMessage(msg);
      if (result?.accepted) {
        setShowNewModal(false);
        setNewTitle("");
        setNewGoal("");
        navigation.navigate("ProjectDetail", { projectId: motionId });
      } else {
        Alert.alert("创建失败", result?.reason ?? "未知错误");
      }
    } catch (err) {
      Alert.alert("错误", String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(p) => p.project_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.projectCard}
            onPress={() => navigation.navigate("ProjectDetail", { projectId: item.project_id })}
          >
            <View style={styles.projectHeader}>
              <Text style={styles.projectTitle}>
                {(item.motion as any)?.title ?? item.project_id}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_COLORS[item.status] + "33" }
                ]}
              >
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.projectGoal} numberOfLines={2}>
              {(item.motion as any)?.goal ?? ""}
            </Text>
            <View style={styles.projectMeta}>
              <Text style={styles.metaText}>
                {item.intents.size} 人参与 · {item.tasks.size} 个任务 · 进度 {Math.round(item.progress * 100)}%
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>还没有社区项目</Text>
            <Text style={styles.emptyBody}>发起一个动议，开始组织社区行动。</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowNewModal(true)}
      >
        <Text style={styles.fabText}>+ 发起项目</Text>
      </TouchableOpacity>

      <Modal visible={showNewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>发起新项目动议</Text>
            <TextInput
              style={styles.modalInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="项目名称"
              placeholderTextColor="#475569"
            />
            <TextInput
              style={[styles.modalInput, { minHeight: 80, textAlignVertical: "top" }]}
              value={newGoal}
              onChangeText={setNewGoal}
              placeholder="项目目标（你想实现什么？）"
              placeholderTextColor="#475569"
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowNewModal(false)}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleCreateProject}
                disabled={submitting}
              >
                <Text style={styles.modalSubmitText}>
                  {submitting ? "发布中…" : "发布动议"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  listContent: { padding: 16, paddingBottom: 100 },
  projectCard: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155"
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8
  },
  projectTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: "#f1f5f9", marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "600" },
  projectGoal: { fontSize: 14, color: "#94a3b8", lineHeight: 20, marginBottom: 10 },
  projectMeta: {},
  metaText: { fontSize: 12, color: "#475569" },
  emptyState: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#e2e8f0", marginBottom: 8 },
  emptyBody: { fontSize: 14, color: "#64748b" },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 20,
    backgroundColor: "#4f46e5",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    elevation: 4
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 48
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#f1f5f9", marginBottom: 16 },
  modalInput: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 14,
    color: "#f1f5f9",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 12
  },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#0f172a",
    alignItems: "center"
  },
  modalCancelText: { color: "#94a3b8", fontWeight: "600" },
  modalSubmitBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center"
  },
  modalSubmitText: { color: "#fff", fontWeight: "700" }
});
