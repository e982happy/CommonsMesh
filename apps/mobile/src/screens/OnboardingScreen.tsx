/**
 * Onboarding Screen
 *
 * Guides new users through:
 *  1. Understanding what CommonsMesh does (privacy-first framing)
 *  2. Creating a local Ed25519 keypair (stored in device Keychain)
 *  3. Setting up a display name and community tags
 *  4. Optionally entering a first need or resource
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
import { useSettingsStore } from "../store/settingsStore";
import { generateKeypairAndStore } from "../services/keychain";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

const STEPS = ["欢迎", "隐私说明", "创建身份", "你的社区"] as const;

export function OnboardingScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { completeOnboarding } = useSettingsStore();

  const COMMUNITY_TAGS = [
    "互助搬家", "技能交换", "共同购买", "教育学习",
    "环保行动", "社区修缮", "食物共享", "托育互助",
    "老人关怀", "文化活动", "本地生产", "应急救助"
  ];

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleComplete = async () => {
    if (!displayName.trim()) {
      Alert.alert("请输入昵称");
      return;
    }
    try {
      const { userId, publicKeyPem } = await generateKeypairAndStore();
      completeOnboarding(
        {
          userId,
          displayName: displayName.trim(),
          bio: "",
          communityTags: selectedTags,
          locationLabel: locationLabel.trim()
        },
        publicKeyPem
      );
      navigation.replace("CommunityMap");
    } catch (err) {
      Alert.alert("创建身份失败", String(err));
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[styles.progressDot, i <= step && styles.progressDotActive]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 && (
          <View>
            <Text style={styles.title}>欢迎来到 CommonsMesh</Text>
            <Text style={styles.body}>
              CommonsMesh 是一个完全去中心化的社区互助网络。它帮助你发现：
              {"\n\n"}• 谁能帮助你{"\n"}• 谁需要你的帮助{"\n"}• 哪些人想一起做同一件事{"\n"}• 如何高效地组织小型社区项目
              {"\n\n"}没有中央服务器。你的数据存储在你的设备上。
            </Text>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.title}>隐私设计</Text>
            <Text style={styles.body}>
              CommonsMesh 在设计上保护你的隐私：
              {"\n\n"}
              <Text style={styles.bold}>你的数据存在哪里？</Text>
              {"\n"}仅存储在你的设备上。网络上只传播你主动分享的增量信息。
              {"\n\n"}
              <Text style={styles.bold}>谁能看到我的需求？</Text>
              {"\n"}你可以选择公开（社区可见）、话题可见或仅项目成员可见。
              {"\n\n"}
              <Text style={styles.bold}>我的密钥安全吗？</Text>
              {"\n"}你的私钥存储在设备的安全硬件中（iOS Keychain / Android Keystore），从不离开设备。
            </Text>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.title}>创建你的身份</Text>
            <Text style={styles.label}>昵称（不需要真实姓名）</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="例如：老王、小李、社区志愿者"
              placeholderTextColor="#475569"
              maxLength={32}
            />
            <Text style={styles.label}>所在地区（可选，模糊描述即可）</Text>
            <TextInput
              style={styles.input}
              value={locationLabel}
              onChangeText={setLocationLabel}
              placeholder="例如：北京朝阳、上海徐汇、成都武侯"
              placeholderTextColor="#475569"
              maxLength={32}
            />
            <Text style={styles.hint}>
              你的身份由设备上生成的密钥对标识，不需要手机号或邮箱。
            </Text>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.title}>你关注哪些社区议题？</Text>
            <Text style={styles.hint}>选择你感兴趣的领域，帮助 AI 为你匹配合适的合作机会。</Text>
            <View style={styles.tagGrid}>
              {COMMUNITY_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    selectedTags.includes(tag) && styles.tagSelected
                  ]}
                  onPress={() => handleTagToggle(tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedTags.includes(tag) && styles.tagTextSelected
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonRow}>
        {step > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep((s) => s - 1)}
          >
            <Text style={styles.backButtonText}>上一步</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={step < STEPS.length - 1 ? () => setStep((s) => s + 1) : handleComplete}
        >
          <Text style={styles.nextButtonText}>
            {step < STEPS.length - 1 ? "下一步" : "开始使用"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 16,
    gap: 8
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#334155"
  },
  progressDotActive: { backgroundColor: "#6366f1" },
  content: { padding: 24, paddingBottom: 40 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: 16
  },
  body: { fontSize: 16, color: "#94a3b8", lineHeight: 26 },
  bold: { fontWeight: "700", color: "#e2e8f0" },
  label: { fontSize: 14, color: "#94a3b8", marginTop: 20, marginBottom: 8 },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 14,
    color: "#f1f5f9",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#334155"
  },
  hint: { fontSize: 13, color: "#64748b", marginTop: 12, lineHeight: 20 },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155"
  },
  tagSelected: { backgroundColor: "#4f46e5", borderColor: "#6366f1" },
  tagText: { color: "#94a3b8", fontSize: 14 },
  tagTextSelected: { color: "#fff" },
  buttonRow: {
    flexDirection: "row",
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#1e293b"
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    alignItems: "center"
  },
  backButtonText: { color: "#94a3b8", fontSize: 16, fontWeight: "600" },
  nextButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#4f46e5",
    alignItems: "center"
  },
  nextButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" }
});
