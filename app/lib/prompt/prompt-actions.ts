"use server";

import { revalidatePath } from "next/cache";

import {
  createPrompt as createPromptService,
  activatePrompt,
} from "./prompt-service";

export async function createPrompt(
  formData: FormData
) {
  const title =
    formData.get("title")?.toString() ?? "";

  const description =
    formData.get("description")?.toString() ?? "";

  await createPromptService(
    title,
    description
  );

  revalidatePath("/admin/prompts");
}

export async function activatePromptAction(
  formData: FormData
) {
  const id =
    formData.get("id")?.toString() ?? "";

  await activatePrompt(id);

  revalidatePath("/admin/prompts");
}