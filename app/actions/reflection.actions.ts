"use server";

import { auth, currentUser } from "@clerk/nextjs/server";

import {
  createReflection,
  getReflection,
  getReflectionByAuthorAndPrompt,
  updateReflection,
} from "@/app/lib/reflection/reflection-service";

import type { ReflectionDraft } from "@/app/components/reflection/ReflectionWriting/types";

export async function publishReflection(
  draft: ReflectionDraft
) {
  const content = draft.content.trim();

  if (!content) {
    throw new Error("Reflection cannot be empty.");
  }

  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in.");
  }

  const user = await currentUser();

  const authorName =
    user?.fullName ??
    user?.firstName ??
    user?.username ??
    "Anonymous";

  const existingReflection =
    await getReflectionByAuthorAndPrompt(
      userId,
      draft.promptId
    );

  if (existingReflection) {
  return updateReflection({
    id: existingReflection.id,
    question: draft.question,
    content,
    version: existingReflection.version + 1,
  });
}

  return createReflection({
    promptId: draft.promptId,
    authorId: userId,
    authorName,
    question: draft.question,
    content,
  });
}

export async function resubmitReflection(
  reflectionId: string,
  content: string
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in.");
  }

  const reflection =
    await getReflection(reflectionId);

  if (!reflection) {
    throw new Error("Reflection not found.");
  }

  if (reflection.authorId !== userId) {
    throw new Error("Unauthorized.");
  }

  if (reflection.status !== "rejected") {
    throw new Error(
      "Only rejected reflections can be resubmitted."
    );
  }

  return updateReflection({
  id: reflection.id,
  question: reflection.question,
  content: content.trim(),
  version: reflection.version + 1,
});
}