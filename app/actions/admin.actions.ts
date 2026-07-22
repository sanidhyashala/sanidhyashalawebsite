"use server";

import { auth } from "@clerk/nextjs/server";

import { requireAdmin } from "@/app/lib/auth/admin";

import {
  getReflections,
  updateReflectionStatus,
} from "@/app/lib/reflection/reflection-service";

import type {
  Reflection,
  ReflectionStatus,
} from "@/app/lib/reflection/reflection-types";

export async function getReflectionList(
  status?: ReflectionStatus
): Promise<Reflection[]> {
  await requireAdmin();

  return getReflections(status);
}

export async function getPendingReflectionList() {
  return getReflectionList("pending");
}

export async function moderateReflection(
  reflectionId: string,
  status: ReflectionStatus,
  rejectionReason?: string,
  adminNote?: string,
  reviewComment?: string
) {
  await requireAdmin();

  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  await updateReflectionStatus(
    reflectionId,
    status,
    userId,
    rejectionReason,
    adminNote,
    reviewComment
  );
}