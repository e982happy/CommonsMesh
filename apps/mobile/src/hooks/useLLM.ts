/**
 * useLLM hook — manages the LLM engine lifecycle and exposes match suggestions.
 *
 * The hook:
 *  1. Lazily initializes the LLM engine on first call to analyze()
 *  2. Runs the matcher against the current app state
 *  3. Caches results and exposes loading state
 */

import { useState, useCallback, useRef } from "react";
import type { LLMEngine } from "@commonsmesh/llm";
import { createLLMEngine } from "@commonsmesh/llm";
import type { MatchSuggestion } from "@commonsmesh/llm";
import { runMatcher } from "@commonsmesh/llm";
import { useEngineStore } from "../store/engineStore";
import { useSettingsStore } from "../store/settingsStore";

// Re-export for use in screens
export type { MatchSuggestion };

// Development: use OpenAI-compatible API
// Production: use llama-rn with on-device model
const USE_CLOUD_FALLBACK = __DEV__;

export function useLLM() {
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<LLMEngine | null>(null);

  const { getState } = useEngineStore();
  const { profile } = useSettingsStore();

  const getOrCreateEngine = useCallback(async (): Promise<LLMEngine> => {
    if (engineRef.current?.isReady()) return engineRef.current;

    const engine = await createLLMEngine(
      USE_CLOUD_FALLBACK
        ? {
            backend: "openai-compat",
            apiBaseUrl: "https://api.openai.com/v1",
            apiKey: "", // Set via environment variable in production
            modelName: "gpt-4o-mini"
          }
        : {
            backend: "llama-rn",
            // Model file should be bundled with the app or downloaded on first run
            modelPath: `${require("react-native-fs").DocumentDirectoryPath}/models/qwen2.5-1.5b-instruct-q4_k_m.gguf`,
            contextSize: 2048,
            threads: 4
          }
    );

    engineRef.current = engine;
    return engine;
  }, []);

  const analyze = useCallback(async () => {
    const state = getState();
    const userId = profile?.userId;
    if (!state || !userId) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const llm = await getOrCreateEngine();
      const results = await runMatcher({
        myUserId: userId,
        state,
        llm,
        maxSuggestions: 10
      });
      setSuggestions(results);
    } catch (err) {
      setError(String(err));
      console.warn("[useLLM] Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [getState, profile, getOrCreateEngine]);

  return { suggestions, isAnalyzing, error, analyze };
}
