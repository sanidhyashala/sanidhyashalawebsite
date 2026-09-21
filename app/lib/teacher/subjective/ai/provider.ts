import type {
  SubjectiveAiProvider,
  SubjectiveAiProviderName,
} from "./types";

import { geminiSubjectiveAiProvider } from "./providers/gemini.provider";

function getConfiguredProviderName(): SubjectiveAiProviderName {
  const value = process.env.SUBJECTIVE_AI_PROVIDER?.trim().toLowerCase();

  if (!value) {
    return "gemini";
  }

  if (value === "gemini" || value === "openai") {
    return value;
  }

  throw new Error(
    `Unsupported SUBJECTIVE_AI_PROVIDER: "${value}". Supported providers are "gemini" and "openai".`
  );
}

export function getSubjectiveAiProvider(): SubjectiveAiProvider {
  const providerName = getConfiguredProviderName();

  switch (providerName) {
    case "gemini":
      return geminiSubjectiveAiProvider;

    case "openai":
      throw new Error(
        "OpenAI provider is not implemented yet. Set SUBJECTIVE_AI_PROVIDER=gemini."
      );

    default: {
      const exhaustiveCheck: never = providerName;
      throw new Error(
        `Unsupported subjective AI provider: ${String(exhaustiveCheck)}`
      );
    }
  }
}