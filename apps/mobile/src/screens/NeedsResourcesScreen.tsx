/**
 * Needs & Resources Screen
 *
 * Allows users to declare:
 *  - Their current needs (things they need help with)
 *  - Their available resources (skills, tools, time, space, etc.)
 *
 * Each declaration is published as a graph.delta event with op=upsert_node,
 * creating a "need" or "resource" node linked to the user via "needs"/"offers" edges.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useEngineStore } from "../store/engineStore";
import { useSettingsStore } from "../store/settingsStore";
import { buildAndSignMessage } from "../services/keychain";

type Props = NativeStackScreenProps<RootStackParamList, "NeedsResources">;

type EntryType = "need" | "resource";

interface Entry {
  id: string;
  type: EntryType;
  title: string;
  description: string;
  tags: string[];
}

export function NeedsResourcesScreen({ navigation }: Props) {
  const { processMessage, getState } = useEngineStore();
  const { profile } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<EntryType>("need");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const state = getState();
  const userId = profile?.userId ?? "";

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("请输入标题");
      return;
    }
    setSubmitting(true);
    try {
      const nodeId = `${activeTab}_${userId}_${Date.now()}`;
      const msg = await buildAndSignMessage("graph.delta", {
        op: "upsert_node",
        node: {
          node_id: nodeId,
          node_type: activeTab,
          attrs: {
            title: title.trim(),
            description: description.trim(),
            owner: userId
          }
        }
      });
      const result = processMessage(msg);
      if (result?.accepted) {
        setTitle("");
        setDescription("");
        Alert.alert("已发布", `你的${activeTab === "need" ? "需求" : "资源"}已广播到社区网络。`);
      } else {
        Alert.alert("发布失败", result?.reason ?? "未知错误");
      }
    } catch (err) {
      Alert.alert("错误", String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tab selector */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "need" && styles.tabActive]}
          onPress={() => setActiveTab("need")}
        >
          <Text style={[styles.tabText, activeTab === "need" && styles.tabTextActive]}>
            我的需求
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "resource" && styles.tabActive]}
          onPress={() => setActiveTab("resource")}
        >
          <Text style={[styles.tabText, activeTab === "resource" && styles.tabTextActive]}>
            我能提供
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        {activeTab === "need"
          ? "描述你需要帮助的事情。AI 会在社区中寻找能帮助你的人。"
          : "描述你能提供的技能、工具、时间或空间。AI 会匹配有需要的人。"}
      </Text>

      <Text style={styles.label}>标题</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder={activeTab === "need" ? "例如：需要搬家帮手" : "例如：有面包车可以帮忙运输"}
        placeholderTextColor="#475569"
        maxLength={80}
      />

      <Text style={styles.label}>详细描述（可选）</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="更多细节有助于 AI 做出更精准的匹配…"
        placeholderTextColor="#475569"
        multiline
        numberOfLines={4}
        maxLength={500}
      />

      <Text style={styles.privacyNote}>
        🔒 你的信息将以加密签名的方式广播到社区网络，可见范围由你的隐私设置决定。
      </Text>

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? "发布中…" : "发布到社区"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20, paddingBottom: 60 },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center"
  },
  tabActive: { backgroundColor: "#4f46e5" },
  tabText: { color: "#64748b", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  hint: { fontSize: 14, color: "#64748b", marginBottom: 20, lineHeight: 22 },
  label: { fontSize: 13, color: "#94a3b8", marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 14,
    color: "#f1f5f9",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#334155"
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  privacyNote: {
    fontSize: 12,
    color: "#475569",
    marginTop: 20,
    lineHeight: 20
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: "#4f46e5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center"
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" }
});
