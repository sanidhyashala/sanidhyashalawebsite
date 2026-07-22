import { reflectionPrompts } from "./promptRepository";
import type { ReflectionPrompt } from "./types";

export function getActivePrompt(): ReflectionPrompt {
  const prompt = reflectionPrompts.find(
    (item) => item.active
  );

  if (!prompt) {
    throw new Error(
      "No active reflection prompt found."
    );
  }

  return prompt;
}