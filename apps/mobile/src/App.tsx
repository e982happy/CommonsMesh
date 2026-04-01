/**
 * CommonsMesh Mobile App — Root Component
 *
 * Tech stack:
 *   - React Native (Expo)
 *   - React Navigation v6 (native stack)
 *   - Zustand for local state management
 *   - op-sqlite (or expo-sqlite) for local SQLite
 *   - @commonsmesh/protocol for core engine
 */

import React, { useEffect } from "react";
import { StatusBar, View, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { RootNavigator } from "./navigation/RootNavigator";
import { useEngineStore } from "./store/engineStore";
import { useSettingsStore } from "./store/settingsStore";

export default function App() {
  const { initialize, isReady, error } = useEngineStore();
  const { theme } = useSettingsStore();

  useEffect(() => {
    initialize();
  }, []);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>启动失败: {error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>CommonsMesh 正在启动…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a"
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 16
  },
  errorText: {
    color: "#f87171",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24
  }
});
