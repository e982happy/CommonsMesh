import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useEngineStore } from "../store/engineStore";
import { buildAndSignMessage } from "../services/keychain";

type Props = NativeStackScreenProps<RootStackParamList, "Dispute">;

export function DisputeScreen({ route }: Props) {
  const { disputeId } = route.params;
  const { getState, processMessage } = useEngineStore();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [accused, setAccused] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const state = getState();
  const existingDispute = disputeId ? state?.disputes.get(disputeId) : null;

  const handleReport = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert("请填写争议主题和描述");
      return;
    }
    setSubmitting(true);
    try {
      const msg = await buildAndSignMessage("dispute.report", {
        dispute_id: `dispute_${Date.now()}`,
        subject: subject.trim(),
        description: description.trim(),
        accused: accused.trim() || undefined
      });
      const result = processMessage(msg);
      if (result?.accepted) {
        Alert.alert("已提交", "争议报告已提交到社区网络。");
        setSubject("");
        setDescription("");
        setAccused("");
      } else {
        Alert.alert("提交失败", result?.reason ?? "未知错误");
      }
    } catch (err) {
      Alert.alert("错误", String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {existingDispute ? (
        <View>
          <Text style={styles.title}>争议详情</Text>
          <View style={styles.disputeCard}>
            <Text style={styles.disputeSubject}>
              {(existingDispute.report as any)?.subject ?? disputeId}
            </Text>
            <Text style={styles.disputeStatus}>状态: {existingDispute.status}</Text>
            <Text style={styles.disputeDesc}>
              {(existingDispute.report as any)?.description ?? ""}
            </Text>
          </View>
          <Text style={styles.sectionTitle}>回应 ({existingDispute.responses.length})</Text>
          {existingDispute.responses.map((r, i) => (
            <View key={i} style={styles.responseCard}>
              <Text style={styles.responseText}>{(r as any)?.content ?? JSON.stringify(r)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View>
          <Text style={styles.title}>提交争议报告</Text>
          <Text style={styles.hint}>
            如果你在社区协作中遇到了问题或纠纷，可以在这里提交报告。社区成员将共同参与调解。
          </Text>
          <Text style={styles.label}>争议主题</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="简短描述争议内容"
            placeholderTextColor="#475569"
            maxLength={80}
          />
          <Text style={styles.label}>详细描述</Text>
          <TextInput
            style={[styles.input, { minHeight: 100, textAlignVertical: "top" }]}
            value={description}
            onChangeText={setDescription}
            placeholder="详细说明发生了什么…"
            placeholderTextColor="#475569"
            multiline
            maxLength={500}
          />
          <Text style={styles.label}>被举报方 ID（可选）</Text>
          <TextInput
            style={styles.input}
            value={accused}
            onChangeText={setAccused}
            placeholder="对方的用户 ID"
            placeholderTextColor="#475569"
          />
          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.6 }]}
            onPress={handleReport}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? "提交中…" : "提交争议报告"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 20, fontWeight: "700", color: "#f1f5f9", marginBottom: 12 },
  hint: { fontSize: 14, color: "#64748b", lineHeight: 22, marginBottom: 20 },
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
  submitButton: {
    marginTop: 24,
    backgroundColor: "#dc2626",
    padding: 16,
    borderRadius: 12,
    alignItems: "center"
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  disputeCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  disputeSubject: { fontSize: 16, fontWeight: "700", color: "#f1f5f9", marginBottom: 8 },
  disputeStatus: { fontSize: 13, color: "#f59e0b", marginBottom: 8 },
  disputeDesc: { fontSize: 14, color: "#94a3b8", lineHeight: 22 },
  sectionTitle: { fontSize: 13, color: "#64748b", marginBottom: 12, textTransform: "uppercase" },
  responseCard: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8
  },
  responseText: { fontSize: 14, color: "#94a3b8" }
});
