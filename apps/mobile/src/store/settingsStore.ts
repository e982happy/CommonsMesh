/**
 * Settings store — user preferences, identity, and onboarding state.
 * Uses Zustand with persist middleware for AsyncStorage.
 *
 * Install: pnpm add zustand @react-native-async-storage/async-storage
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UserProfile {
  userId: string;
  displayName: string;
  bio: string;
  communityTags: string[];
  locationLabel: string;
}

interface SettingsStore {
  hasCompletedOnboarding: boolean;
  theme: "light" | "dark";
  profile: UserProfile | null;
  /** PEM-encoded Ed25519 public key (private key stored in Keychain) */
  publicKeyPem: string | null;

  completeOnboarding(profile: UserProfile, publicKeyPem: string): void;
  updateProfile(updates: Partial<UserProfile>): void;
  setTheme(theme: "light" | "dark"): void;
  reset(): void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      theme: "dark",
      profile: null,
      publicKeyPem: null,

      completeOnboarding(profile: UserProfile, publicKeyPem: string) {
        set({ hasCompletedOnboarding: true, profile, publicKeyPem });
      },

      updateProfile(updates: Partial<UserProfile>) {
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null
        }));
      },

      setTheme(theme: "light" | "dark") {
        set({ theme });
      },

      reset() {
        set({
          hasCompletedOnboarding: false,
          profile: null,
          publicKeyPem: null
        });
      }
    }),
    {
      name: "commonsmesh-settings",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
