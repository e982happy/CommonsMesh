/**
 * Community Map Screen — the main hub of the app.
 *
 * Shows:
 *  - Active AI match suggestions (from LLM engine)
 *  - Recent community events (project motions, needs, resources)
 *  - Quick actions: add need, add resource, start project
 *  - Network status (connected peers)
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useEngineStore } from "../store/engineStore";
import { useSettingsStore } from "../store/settingsStore";
import { MatchCard } from "../components/MatchCard";
import { EventCard } from "../components/EventCard";
import type { MatchSuggestion } from "../hooks/useLLM";
import { useLLM } from "../hooks/useLLM";

type Props = NativeStackScreenProps<RootStackParamList, "CommunityMap">;

export function CommunityMapScreen({ navigation }: Props) {
  const { getState } = useEngineStore();
  const { profile } = useSettingsStore();
  const { suggestions, isAnalyzing, analyze } = useLLM();
  const [refreshing, setRefreshing] = useState(false);

  const appState = getState();
  const recentEvents = appState?.eventLog.slice(-20).reverse() ?? [];
  const peerCount = 0; // TODO: wire up network layer

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await analyze();
    setRefreshing(false);
  }, [analyze]);

  useEffect(() => {
    analyze();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            你好，{profile?.displayName ?? "社区成员"}
          </Text>
          <Text style={styles.subtitle}>
            {peerCount > 0 ? `已连接 ${peerCount} 个邻居节点` : "正在寻找附近节点…"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text style={styles.profileButtonText}>
            {profile?.displayName?.slice(0, 1) ?? "?"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("NeedsResources")}
        >
          <Text style={styles.actionIcon}>🙋</Text>
          <Text style={styles.actionLabel}>我的需求</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("NeedsResources")}
        >
          <Text style={styles.actionIcon}>🎁</Text>
          <Text style={styles.actionLabel}>我能提供</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("Projects")}
        >
          <Text style={styles.actionIcon}>🚀</Text>
          <Text style={styles.actionLabel}>社区项目</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("MatchSuggestions")}
        >
          <Text style={styles.actionIcon}>✨</Text>
          <Text style={styles.actionLabel}>AI 匹配</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={recentEvents}
        keyExtractor={(item) => item.msg_id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        ListHeaderComponent={
          <>
            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  ✨ AI 发现的合作机会 {isAnalyzing && "（分析中…）"}
                </Text>
                {suggestions.slice(0, 3).map((s) => (
                  <MatchCard
                    key={s.id}
                    suggestion={s}
                    onPress={() => navigation.navigate("MatchSuggestions")}
                  />
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>社区动态</Text>
          </>
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => {
              if (item.kind.startsWith("project.")) {
                const projectId = (item.payload as any).motion_id ?? (item.payload as any).project_id;
                if (projectId) navigation.navigate("ProjectDetail", { projectId });
              }
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>社区图谱还是空的</Text>
            <Text style={styles.emptyBody}>
              添加你的第一个需求或资源，开始与社区连接。
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate("NeedsResources")}
            >
              <Text style={styles.emptyButtonText}>添加需求或资源</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16
  },
  greeting: { fontSize: 20, fontWeight: "700", color: "#f1f5f9" },
  subtitle: { fontSize: 13, color: "#64748b", marginTop: 2 },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center"
  },
  profileButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155"
  },
  actionIcon: { fontSize: 22, marginBottom: 4 },
  actionLabel: { fontSize: 11, color: "#94a3b8", textAlign: "center" },
  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    paddingHorizontal: 20,
    paddingVertical: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  listContent: { paddingBottom: 40 },
  emptyState: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#e2e8f0", marginBottom: 8 },
  emptyBody: { fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 22 },
  emptyButton: {
    marginTop: 24,
    backgroundColor: "#4f46e5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10
  },
  emptyButtonText: { color: "#fff", fontWeight: "600" }
});
