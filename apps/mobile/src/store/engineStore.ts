/**
 * Engine store — manages the CommonsMesh protocol engine and database lifecycle.
 *
 * Uses Zustand for lightweight, reactive state management.
 * Install: pnpm add zustand
 */

import { create } from "zustand";
import { createEngine } from "@commonsmesh/protocol";
import type { AppState, MessageEnvelope, ProcessResult } from "@commonsmesh/protocol";

interface EngineStore {
  isReady: boolean;
  error: string | null;
  engine: ReturnType<typeof createEngine> | null;

  initialize(): Promise<void>;
  processMessage(msg: MessageEnvelope): ProcessResult | null;
  getState(): AppState | null;
}

export const useEngineStore = create<EngineStore>((set, get) => ({
  isReady: false,
  error: null,
  engine: null,

  async initialize() {
    try {
      // In production, load persisted state from SQLite
      // For now, start with a fresh in-memory state
      const engine = createEngine();
      set({ engine, isReady: true, error: null });
    } catch (err) {
      set({ error: String(err), isReady: false });
    }
  },

  processMessage(msg: MessageEnvelope): ProcessResult | null {
    const { engine } = get();
    if (!engine) return null;
    return engine.process(msg);
  },

  getState(): AppState | null {
    const { engine } = get();
    return engine?.state ?? null;
  }
}));
