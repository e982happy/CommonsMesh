/**
 * CommonsMesh LLM Engine
 *
 * This module provides a unified interface for running inference with an
 * on-device LLM. It supports two backends:
 *
 *  1. llama.cpp via llama-rn (React Native) — for on-device inference with
 *     quantized GGUF models (~1B params, e.g. Qwen2.5-1.5B-Instruct-Q4_K_M)
 *  2. OpenAI-compatible HTTP API — for development/testing or cloud fallback
 *
 * The engine is stateless: it receives a prompt and returns a completion.
 * All community graph reasoning is done in the matcher layer above this.
 *
 * Install (React Native):
 *   pnpm add llama.rn
 *
 * Recommended models (GGUF, ~1B):
 *   - Qwen2.5-1.5B-Instruct-Q4_K_M.gguf  (~1.0 GB)
 *   - SmolLM2-1.7B-Instruct-Q4_K_M.gguf  (~1.1 GB)
 *   - Phi-3.5-mini-instruct-Q4_K_M.gguf  (~2.2 GB, higher quality)
 */

export interface LLMConfig {
  /** Backend to use */
  backend: "llama-rn" | "openai-compat";
  /** Path to GGUF model file (llama-rn backend only) */
  modelPath?: string;
  /** Context window size in tokens */
  contextSize?: number;
  /** Number of threads for inference */
  threads?: number;
  /** OpenAI-compatible API base URL (openai-compat backend only) */
  apiBaseUrl?: string;
  /** API key (openai-compat backend only) */
  apiKey?: string;
  /** Model name (openai-compat backend only) */
  modelName?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMEngine {
  /** Run a chat completion and return the assistant's reply */
  chat(messages: ChatMessage[], maxTokens?: number): Promise<string>;
  /** Check if the model is loaded and ready */
  isReady(): boolean;
  /** Release model resources */
  dispose(): Promise<void>;
}

/**
 * Create an LLM engine with the given configuration.
 */
export async function createLLMEngine(config: LLMConfig): Promise<LLMEngine> {
  if (config.backend === "llama-rn") {
    return createLlamaRnEngine(config);
  } else {
    return createOpenAICompatEngine(config);
  }
}

// ---------------------------------------------------------------------------
// llama.rn backend (on-device inference)
// ---------------------------------------------------------------------------

async function createLlamaRnEngine(config: LLMConfig): Promise<LLMEngine> {
  if (!config.modelPath) throw new Error("modelPath is required for llama-rn backend");

  // Dynamic import to allow tree-shaking in non-RN environments
  const { initLlama } = await import("llama.rn");

  let context: any = null;
  let ready = false;

  // Initialize the model
  context = await initLlama({
    model: config.modelPath,
    use_mlock: true,
    n_ctx: config.contextSize ?? 2048,
    n_threads: config.threads ?? 4
  });
  ready = true;

  return {
    isReady: () => ready,

    async chat(messages: ChatMessage[], maxTokens = 512): Promise<string> {
      if (!context) throw new Error("Model not initialized");

      // Format messages as a chat template string
      // llama.rn handles the template internally via the model's chat template
      const result = await context.completion(
        {
          messages,
          n_predict: maxTokens,
          temperature: 0.7,
          top_p: 0.9,
          stop: ["</s>", "<|im_end|>", "<|end|>"]
        },
        (token: any) => {
          // Streaming token callback (optional)
        }
      );

      return result.text?.trim() ?? "";
    },

    async dispose(): Promise<void> {
      if (context) {
        await context.release();
        context = null;
        ready = false;
      }
    }
  };
}

// ---------------------------------------------------------------------------
// OpenAI-compatible HTTP API backend (dev / cloud fallback)
// ---------------------------------------------------------------------------

function createOpenAICompatEngine(config: LLMConfig): LLMEngine {
  const baseUrl = config.apiBaseUrl ?? "https://api.openai.com/v1";
  const apiKey = config.apiKey ?? "";
  const modelName = config.modelName ?? "gpt-4o-mini";
  let ready = true;

  return {
    isReady: () => ready,

    async chat(messages: ChatMessage[], maxTokens = 512): Promise<string> {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          max_tokens: maxTokens,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`LLM API error ${response.status}: ${err}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() ?? "";
    },

    async dispose(): Promise<void> {
      ready = false;
    }
  };
}
