import React, { useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useLLM } from "../hooks/useLLM";
import { MatchCard } from "../components/MatchCard";

type Props = NativeStackScreenProps<RootStackParamList, "MatchSuggestions">;

export function MatchSuggestionsScreen({ navigation }: Props) {
  const { suggestions, isAnalyzing, analyze } = useLLM();

  useEffect(() => {
    analyze();
  }, []);

  return (
    <View style={styles.container}>
      {isAnalyzing && (
        <View style={styles.analyzingBanner}>
          <ActivityIndicator color="#6366f1" size="small" />
          <Text style={styles.analyzingText}>AI 正在分析社区图谱，寻找合作机会…</Text>
        </View>
      )}
      <FlatList
        data={suggestions}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <MatchCard
            suggestion={item}
            onPress={() => {
              if (item.projectId) {
                navigation.navigate("ProjectDetail", { projectId: item.projectId });
              }
            }}
            expanded
          />
        )}
        ListEmptyComponent={
          !isAnalyzing ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>暂无匹配建议</Text>
              <Text style={styles.emptyBody}>
                添加更多需求和资源后，AI 会发现更多合作机会。
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  analyzingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1e293b",
    padding: 12,
    paddingHorizontal: 20
  },
  analyzingText: { fontSize: 13, color: "#94a3b8" },
  listContent: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#e2e8f0", marginBottom: 8 },
  emptyBody: { fontSize: 14, color: "#64748b", textAlign: "center", paddingHorizontal: 32 }
});
