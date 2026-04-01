import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSettingsStore } from "../store/settingsStore";

// Screens
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { NeedsResourcesScreen } from "../screens/NeedsResourcesScreen";
import { CommunityMapScreen } from "../screens/CommunityMapScreen";
import { ProjectsScreen } from "../screens/ProjectsScreen";
import { ProjectDetailScreen } from "../screens/ProjectDetailScreen";
import { TaskScreen } from "../screens/TaskScreen";
import { MatchSuggestionsScreen } from "../screens/MatchSuggestionsScreen";
import { DisputeScreen } from "../screens/DisputeScreen";

export type RootStackParamList = {
  Onboarding: undefined;
  Profile: undefined;
  NeedsResources: undefined;
  CommunityMap: undefined;
  Projects: undefined;
  ProjectDetail: { projectId: string };
  Task: { taskId: string; projectId: string };
  MatchSuggestions: undefined;
  Dispute: { disputeId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { hasCompletedOnboarding } = useSettingsStore();

  return (
    <Stack.Navigator
      initialRouteName={hasCompletedOnboarding ? "CommunityMap" : "Onboarding"}
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#e2e8f0",
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: "#0f172a" }
      }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "我的档案" }}
      />
      <Stack.Screen
        name="NeedsResources"
        component={NeedsResourcesScreen}
        options={{ title: "我的需求与资源" }}
      />
      <Stack.Screen
        name="CommunityMap"
        component={CommunityMapScreen}
        options={{ title: "社区图谱" }}
      />
      <Stack.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{ title: "社区项目" }}
      />
      <Stack.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{ title: "项目详情" }}
      />
      <Stack.Screen
        name="Task"
        component={TaskScreen}
        options={{ title: "任务" }}
      />
      <Stack.Screen
        name="MatchSuggestions"
        component={MatchSuggestionsScreen}
        options={{ title: "AI 匹配建议" }}
      />
      <Stack.Screen
        name="Dispute"
        component={DisputeScreen}
        options={{ title: "争议处理" }}
      />
    </Stack.Navigator>
  );
}
