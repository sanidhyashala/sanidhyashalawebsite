import type { ReflectionPrompt } from "../prompt-types";

export interface PromptRepository {
  getActive(): Promise<ReflectionPrompt>;

  getAll(): Promise<ReflectionPrompt[]>;

  getPromptPosition(
  id: string
): Promise<{
  current: number;
  total: number;
}>;

  create(
    title: string,
    description: string
  ): Promise<void>;

  activate(
    id: string
  ): Promise<void>;

  markNotificationSent(
  id: string,
  recipients: number,
  delivered: number,
  failed: number
): Promise<void>;

  getById(
  id: string
): Promise<ReflectionPrompt | null>;

getPreviousPrompt(
  id: string
): Promise<ReflectionPrompt | null>;

getNextPrompt(
  id: string
): Promise<ReflectionPrompt | null>;

}

