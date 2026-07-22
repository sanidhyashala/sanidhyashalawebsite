import { supabaseServer } from "./server";

import type {
  CreateReflectionInput,
  UpdateReflectionInput,
  Reflection,
  ReflectionStatus,
} from "../reflection-types";

import type { ReflectionRepository } from "../repository/reflection.repository";

/**
 * Maps a raw Supabase row (snake_case) to the domain-level
 * Reflection type (camelCase). Centralizing this mapping avoids
 * repeating the same property transform in every repository
 * method and guarantees no field is ever silently dropped.
 */
function mapReflection(
  row: Record<string, unknown>
): Reflection {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    authorName: row.author_name as string,
    promptId: row.prompt_id as string,
    question: row.question as string,
    content: row.content as string,
    status: row.status as ReflectionStatus,
    version: row.version as number,
    rejectionReason: row.rejection_reason as string | null,
    adminNote: row.admin_note as string | null,
    updateRequested: row.update_requested as boolean,
    updateRequestedAt: row.update_requested_at as string | null,
    moderatedBy: row.moderated_by as string | null,
    moderatedAt: row.moderated_at as string | null,
    reviewComment: row.review_comment as string | null,
    lastReviewedAt: row.last_reviewed_at as string | null,
    publishedAt: row.published_at as string | null,
    archivedAt: row.archived_at as string | null,
    lastSubmittedAt: row.last_submitted_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export const reflectionRepository: ReflectionRepository = {
  async create(
    input: CreateReflectionInput
  ): Promise<Reflection> {
    const now = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from("reflections")
      .insert({
        prompt_id: input.promptId,
        author_id: input.authorId,
        author_name: input.authorName,
        question: input.question,
        content: input.content,
        status: "pending",
        last_submitted_at: now,
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        `Unable to create reflection: ${error.message}`
      );
    }

    return mapReflection(data);
  },

  async getByAuthor(
    authorId: string
  ): Promise<Reflection[]> {
    const { data, error } = await supabaseServer
      .from("reflections")
      .select("*")
      .eq("author_id", authorId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(
        `Unable to load author reflections: ${error.message}`
      );
    }

    return data.map((item) => mapReflection(item));
  },

  async getPublishedByPrompt(
    promptId: string
  ): Promise<Reflection[]> {
    const { data, error } = await supabaseServer
      .from("reflections")
      .select("*")
      .eq("status", "published")
      .eq("prompt_id", promptId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(
        `Unable to load prompt reflections: ${error.message}`
      );
    }

    return data.map((item) => mapReflection(item));
  },

  async getPublishedCountByPrompt(
    promptId: string
  ): Promise<number> {
    const { count, error } =
      await supabaseServer
        .from("reflections")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "published")
        .eq("prompt_id", promptId);

    if (error) {
      throw new Error(
        `Unable to count prompt reflections: ${error.message}`
      );
    }

    return count ?? 0;
  },

  async getByStatus(
    status?: ReflectionStatus
  ): Promise<Reflection[]> {

    let query = supabaseServer
      .from("reflections")
      .select("*");

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } =
      await query.order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(
        `Unable to load reflections: ${error.message}`
      );
    }

    return data.map((item) => mapReflection(item));
  },

  async getByAuthorAndPrompt(
    authorId: string,
    promptId: string
  ): Promise<Reflection | null> {
    const { data, error } = await supabaseServer
      .from("reflections")
      .select("*")
      .eq("author_id", authorId)
      .eq("prompt_id", promptId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }

      throw new Error(
        `Unable to load reflection: ${error.message}`
      );
    }

    return mapReflection(data);
  },

  async getRecentPending(
    limit: number
  ): Promise<Reflection[]> {
    const { data, error } = await supabaseServer
      .from("reflections")
      .select("*")
      .eq("status", "pending")
      .order("created_at", {
        ascending: false,
      })
      .limit(limit);

    if (error) {
      throw new Error(
        `Unable to load recent pending reflections: ${error.message}`
      );
    }

    return data.map((item) => mapReflection(item));
  },

  async getCountByStatus(
    status: ReflectionStatus
  ): Promise<number> {
    const { count, error } = await supabaseServer
      .from("reflections")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", status);

    if (error) {
      throw new Error(
        `Unable to count reflections: ${error.message}`
      );
    }

    return count ?? 0;
  },

  async getById(
  id: string
): Promise<Reflection | null> {
  const { data, error } =
    await supabaseServer
      .from("reflections")
      .select("*")
      .eq("id", id)
      .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(
      `Unable to load reflection: ${error.message}`
    );
  }

  return mapReflection(data);
},

  async getPublishedById(
    id: string
  ): Promise<Reflection | null> {
    const { data, error } =
      await supabaseServer
        .from("reflections")
        .select("*")
        .eq("id", id)
        .eq("status", "published")
        .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }

      throw new Error(
        `Unable to load reflection: ${error.message}`
      );
    }

    return mapReflection(data);
  },

  async update(
    input: UpdateReflectionInput
  ): Promise<Reflection> {
    const now = new Date().toISOString();

    // Any edit to a reflection must re-enter the moderation queue:
    // status resets to "pending", the submission clock restarts,
    // and any pending "please update this" flag is cleared since
    // the author has just acted on it.
    const { data, error } =
      await supabaseServer
        .from("reflections")
        .update({
  question: input.question,

  content: input.content,

  version: input.version,

  updated_at: now,

  status: "pending",

  last_submitted_at: now,

  update_requested: false,
  update_requested_at: null,

  rejection_reason: null,
  admin_note: null,
  review_comment: null,

  moderated_by: null,
  moderated_at: null,

  published_at: null,
  archived_at: null,

  last_reviewed_at: null,
})
        .eq("id", input.id)
        .select()
        .single();

    if (error) {
      throw new Error(
        `Unable to update reflection: ${error.message}`
      );
    }

    return mapReflection(data);
  },

  async updateStatus(
  id: string,
  status: ReflectionStatus,
  moderatedBy: string,
  rejectionReason?: string,
  adminNote?: string,
  reviewComment?: string
): Promise<void> {
    const now = new Date().toISOString();

    // Base moderation fields apply to every status transition.
    const updatePayload: Record<string, unknown> = {
      status,
      moderated_by: moderatedBy,
      moderated_at: now,
      last_reviewed_at: now,
    };

    if (status === "published") {
  updatePayload.published_at = now;

  // Previous rejection data should disappear
  updatePayload.rejection_reason = null;
  updatePayload.admin_note = null;
  updatePayload.review_comment = null;

  // Future-proof
  updatePayload.update_requested = false;
  updatePayload.update_requested_at = null;
}

    if (status === "archived") {
      updatePayload.archived_at = now;
    }

    if (status === "rejected") {
      updatePayload.published_at = null;
  if (rejectionReason !== undefined) {
    updatePayload.rejection_reason = rejectionReason;
  }

  if (adminNote !== undefined) {
    updatePayload.admin_note = adminNote;
  }

  if (reviewComment !== undefined) {
    updatePayload.review_comment = reviewComment;
  }
}

    const { error } = await supabaseServer
      .from("reflections")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      throw new Error(
        `Unable to update reflection status: ${error.message}`
      );
    }
  },
};