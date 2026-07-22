import type {
  CreateReflectionInput,
  UpdateReflectionInput,
  Reflection,
  ReflectionStatus,
} from "./reflection-types";

import { reflectionRepository } from "./supabase/reflection.supabase";

/**
 * Business Logic Layer
 * --------------------
 * All reflection-related business rules belong here.
 */

export async function createReflection(
  input: CreateReflectionInput
): Promise<Reflection> {
  const content = input.content.trim();

  if (content.length < 20) {
    throw new Error(
      "Reflection must contain at least 20 characters."
    );
  }

  if (content.length > 3000) {
    throw new Error(
      "Reflection exceeds the maximum allowed length."
    );
  }

  return reflectionRepository.create({
    ...input,
    content,
  });
}



export async function getPublishedReflectionsByPrompt(
  promptId: string
): Promise<Reflection[]> {
  if (!promptId) {
    throw new Error(
      "Prompt id is required."
    );
  }

  return reflectionRepository.getPublishedByPrompt(
    promptId
  );
}

export async function getPublishedReflectionCountByPrompt(
  promptId: string
): Promise<number> {
  if (!promptId) {
    throw new Error(
      "Prompt id is required."
    );
  }

  return reflectionRepository.getPublishedCountByPrompt(
    promptId
  );
}

export async function getReflectionByAuthorAndPrompt(
  authorId: string,
  promptId: string
): Promise<Reflection | null> {
  if (!authorId) {
    throw new Error(
      "Author id is required."
    );
  }

  if (!promptId) {
    throw new Error(
      "Prompt id is required."
    );
  }

  return reflectionRepository.getByAuthorAndPrompt(
    authorId,
    promptId
  );
}

export async function getPublishedReflection(
  id: string
): Promise<Reflection | null> {
  return reflectionRepository.getPublishedById(
    id
  );
}

export async function getReflection(
  id: string
): Promise<Reflection | null> {
  if (!id) {
    throw new Error(
      "Reflection id is required."
    );
  }

  return reflectionRepository.getById(id);
}

export async function getReflections(
  status?: ReflectionStatus
): Promise<Reflection[]> {
  return reflectionRepository.getByStatus(
    status
  );
}

export async function getReflectionsByAuthor(
  authorId: string
): Promise<Reflection[]> {
  if (!authorId) {
    throw new Error(
      "Author id is required."
    );
  }

  return reflectionRepository.getByAuthor(
    authorId
  );
}

export async function getRecentPendingReflections(
  limit: number
): Promise<Reflection[]> {
  return reflectionRepository.getRecentPending(limit);
}

export async function getReflectionCountByStatus(
  status: ReflectionStatus
): Promise<number> {
  return reflectionRepository.getCountByStatus(status);
}

export async function updateReflection(
  input: UpdateReflectionInput
): Promise<Reflection> {
  const content = input.content?.trim() ?? "";

  if (content.length < 20) {
    throw new Error(
      "Reflection must contain at least 20 characters."
    );
  }

  if (content.length > 3000) {
    throw new Error(
      "Reflection exceeds the maximum allowed length."
    );
  }

  return reflectionRepository.update({
    ...input,
    content,
  });
}

export async function updateReflectionStatus(
  reflectionId: string,
  status: ReflectionStatus,
  moderatedBy: string,
  rejectionReason?: string,
  adminNote?: string,
  reviewComment?: string
): Promise<void> {
  return reflectionRepository.updateStatus(
    reflectionId,
    status,
    moderatedBy,
    rejectionReason,
    adminNote,
    reviewComment
  );
}