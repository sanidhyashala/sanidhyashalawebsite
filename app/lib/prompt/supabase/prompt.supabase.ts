import { supabaseServer } from "@/app/lib/reflection/supabase/server";

import type { PromptRepository } from "../repository/prompt.repository";
import type { ReflectionPrompt } from "../prompt-types";

function mapPrompt(
  row: Record<string, unknown>
): ReflectionPrompt {
  return {
    id: row.id as string,

    title: row.title as string,

    description: row.description as string,

    isActive: row.is_active as boolean,

    createdAt: row.created_at as string,

    updatedAt: row.updated_at as string,

    notificationSentAt:
      row.notification_sent_at as string | null,

      notificationRecipients:
  row.notification_recipients as number | null,

notificationDelivered:
  row.notification_delivered as number | null,

notificationFailed:
  row.notification_failed as number | null,
  };
}

export const promptRepository: PromptRepository = {
  async getActive(): Promise<ReflectionPrompt> {
    const { data, error } = await supabaseServer
      .from("reflection_prompts")
      .select("*")
      .eq("is_active", true)
      .single();

    if (error || !data) {
      throw new Error("No active prompt found.");
    }

    return mapPrompt(data);
  },

  async getAll(): Promise<ReflectionPrompt[]> {
    const { data, error } = await supabaseServer
      .from("reflection_prompts")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    return data.map(mapPrompt);
  },

  async getById(
  id: string
): Promise<ReflectionPrompt | null> {
  const { data, error } = await supabaseServer
    .from("reflection_prompts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(error.message);
  }

  return mapPrompt(data);
},

async getPreviousPrompt(
  id: string
): Promise<ReflectionPrompt | null> {
  const current =
    await this.getById(id);

  if (!current) {
    return null;
  }

  const { data, error } =
    await supabaseServer
      .from("reflection_prompts")
      .select("*")
      .lt("created_at", current.createdAt)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(error.message);
  }

  return mapPrompt(data);
},

async getNextPrompt(
  id: string
): Promise<ReflectionPrompt | null> {
  const current =
    await this.getById(id);

  if (!current) {
    return null;
  }

  const { data, error } =
    await supabaseServer
      .from("reflection_prompts")
      .select("*")
      .gt("created_at", current.createdAt)
      .order("created_at", {
        ascending: true,
      })
      .limit(1)
      .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(error.message);
  }

  return mapPrompt(data);
},

async getPromptPosition(
  id: string
): Promise<{
  current: number;
  total: number;
}> {
  const { data, error } =
    await supabaseServer
      .from("reflection_prompts")
      .select("id")
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw new Error(error.message);
  }

  const index = data.findIndex(
    (prompt) => prompt.id === id
  );

  if (index === -1) {
  throw new Error("Prompt not found.");
}

  return {
    current: index + 1,
    total: data.length,
  };
},

  async create(
    title: string,
    description: string
  ): Promise<void> {
    const { error } = await supabaseServer
      .from("reflection_prompts")
      .insert({
        id: crypto.randomUUID(),
        title,
        description,
        is_active: false,
      });

    if (error) {
      throw new Error(error.message);
    }
  },
  async activate(
  id: string
): Promise<void> {
  const { error: resetError } = await supabaseServer
    .from("reflection_prompts")
    .update({
      is_active: false,
    })
    .eq("is_active", true);

  if (resetError) {
    throw new Error(resetError.message);
  }

  const { error } = await supabaseServer
    .from("reflection_prompts")
    .update({
      is_active: true,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
},
async markNotificationSent(
  id: string,
  recipients: number,
  delivered: number,
  failed: number
): Promise<void> {
  const { error } =
    await supabaseServer
      .from("reflection_prompts")
      .update({
        notification_sent_at:
          new Date().toISOString(),

        notification_recipients:
          recipients,

        notification_delivered:
          delivered,

        notification_failed:
          failed,
      })
      .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
},
};