// Server-only helpers for calling configured AI providers.

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type Provider = "openai" | "gemini" | "gateway";

type AIConfig = {
  provider: Provider;
  apiKey: string;
  url: string;
  model: string;
};

type TextOptions = {
  model?: string;
  temperature?: number;
};

const REQUEST_TIMEOUT_MS = 20000;

function resolveProvider(): Provider {
  const configured = process.env.LECTUREFLOW_AI_PROVIDER?.toLowerCase();
  if (configured === "openai" || configured === "gemini" || configured === "gateway") return configured;

  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.LECTUREFLOW_AI_API_KEY && process.env.LECTUREFLOW_AI_GATEWAY_URL) return "gateway";

  throw new Error(
    "No AI provider configured. Set LECTUREFLOW_AI_PROVIDER=openai|gemini|gateway and required API key env vars.",
  );
}

function getConfig(): AIConfig {
  const provider = resolveProvider();

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
    return {
      provider,
      apiKey,
      url: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1/chat/completions",
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
    };
  }

  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
    return {
      provider,
      apiKey,
      url: process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-pro",
    };
  }

  const apiKey = process.env.LECTUREFLOW_AI_API_KEY;
  if (!apiKey) throw new Error("LECTUREFLOW_AI_API_KEY is not configured");
  const url = process.env.LECTUREFLOW_AI_GATEWAY_URL;
  if (!url) throw new Error("LECTUREFLOW_AI_GATEWAY_URL is not configured");
  return {
    provider,
    apiKey,
    url,
    model: process.env.LECTUREFLOW_AI_MODEL ?? "google/gemini-2.5-flash",
  };
}

function getErrorMessage(status: number): string {
  if (status === 401) return "AI authentication failed. Check your API key.";
  if (status === 429) return "Too many requests right now. Please wait a moment and try again.";
  if (status === 402) return "AI usage limit reached. Please add credits/billing to your provider account.";
  return `AI provider error (${status})`;
}

function extractText(data: any): string {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }
  return "";
}

async function postChatCompletion(cfg: AIConfig, body: Record<string, unknown>): Promise<any> {
  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(getErrorMessage(res.status));
    }

    return await res.json();
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("AI request timed out. Check network connectivity and provider endpoint settings.");
    }
    if (error instanceof Error && error.message.includes("fetch failed")) {
      throw new Error("Could not reach AI provider. Check internet access and API base URL settings.");
    }
    throw error;
  }
}

export async function callGatewayJSON<T>(
  messages: ChatMessage[],
  toolName: string,
  parameters: Record<string, unknown>,
): Promise<T> {
  const cfg = getConfig();
  const data = await postChatCompletion(cfg, {
      model: cfg.model,
      messages,
      tools: [
        {
          type: "function",
          function: {
            name: toolName,
            description: `Return structured ${toolName}`,
            parameters,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: toolName } },
  });
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error("AI did not return structured output");
  }
  return JSON.parse(toolCall.function.arguments) as T;
}

export async function callGatewayText(messages: ChatMessage[], options?: TextOptions): Promise<string> {
  const cfg = getConfig();
  const data = await postChatCompletion(cfg, {
    model: options?.model ?? cfg.model,
    messages,
    temperature: options?.temperature ?? 0.3,
  });
  return extractText(data);
}
