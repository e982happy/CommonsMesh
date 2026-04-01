import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useSettingsStore } from "../store/settingsStore";
import { useEngineStore } from "../store/engineStore";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export function ProfileScreen({ navigation }: Props) {
  const { profile, updateProfile, publicKeyPem } = useSettingsStore();
  const { getState } = useEngineStore();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [locationLabel, setLocationLabel] = useState(profile?.locationLabel ?? "");

  const state = getState();
  const trustRecord = profile ? state?.trust.get(profile.userId) : null;

  const handleSave = () => {
    updateProfile({ displayName, bio, locationLabel });
    Alert.alert("已保存");
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.slice(0, 1) || "?"}</Text>
        </View>
        <View>
          <Text style={styles.userId}>
            {profile?.userId?.slice(0, 24) ?? ""}…
          </Text>
          <Text style={styles.trustScore}>
            信任分: {trustRecord ? trustRecord.score.toFixed(2) : "0.00"}
          </Text>
        </View>
      </View>

      <Text style={styles.label}>昵称</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="你的昵称"
        placeholderTextColor="#475569"
        maxLength={32}
      />

      <Text style={styles.label}>个人简介</Text>
      <TextInput
        style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
        value={bio}
        onChangeText={setBio}
        placeholder="介绍一下你自己…"
        placeholderTextColor="#475569"
        multiline
        maxLength={200}
      />

      <Text style={styles.label}>所在地区</Text>
      <TextInput
        style={styles.input}
        value={locationLabel}
        onChangeText={setLocationLabel}
        placeholder="模糊描述即可，如：北京朝阳"
        placeholderTextColor="#475569"
        maxLength={32}
      />

      <Text style={styles.sectionTitle}>公钥（身份标识）</Text>
      <Text style={styles.pubkeyText} numberOfLines={3}>
        {publicKeyPem ?? "未生成"}
      </Text>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>保存</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20, paddingBottom: 60 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  userId: { fontSize: 12, color: "#475569", fontFamily: "monospace" },
  trustScore: { fontSize: 14, color: "#6366f1", marginTop: 4 },
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
  sectionTitle: { fontSize: 13, color: "#64748b", marginTop: 24, marginBottom: 8, textTransform: "uppercase" },
  pubkeyText: { fontSize: 11, color: "#334155", fontFamily: "monospace", lineHeight: 18 },
  saveButton: {
    marginTop: 32,
    backgroundColor: "#4f46e5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center"
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" }
});
