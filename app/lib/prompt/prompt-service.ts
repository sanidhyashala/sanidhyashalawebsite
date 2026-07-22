import { promptRepository } from "./supabase/prompt.supabase";

export async function getActivePrompt() {
  return promptRepository.getActive();
}

export async function getAllPrompts() {
  return promptRepository.getAll();
}

export async function createPrompt(
  title: string,
  description: string
) {
  const cleanTitle = title.trim();
  const cleanDescription = description.trim();

  if (!cleanTitle) {
    throw new Error("Prompt title is required.");
  }

  if (!cleanDescription) {
    throw new Error("Prompt description is required.");
  }

  if (cleanTitle.length > 200) {
    throw new Error(
      "Prompt title is too long."
    );
  }

  if (cleanDescription.length > 1000) {
    throw new Error(
      "Prompt description is too long."
    );
  }

  return promptRepository.create(
    cleanTitle,
    cleanDescription
  );
}

export async function activatePrompt(
  id: string
) {
  if (!id) {
    throw new Error(
      "Prompt id is required."
    );
  }

  return promptRepository.activate(id);
}

export async function getPromptById(
  id: string
) {
  if (!id) {
    throw new Error(
      "Prompt id is required."
    );
  }

  return promptRepository.getById(id);
}

export async function getPreviousPrompt(
  id: string
) {
  if (!id) {
    throw new Error(
      "Prompt id is required."
    );
  }

  return promptRepository.getPreviousPrompt(
    id
  );
}

export async function getNextPrompt(
  id: string
) {
  if (!id) {
    throw new Error(
      "Prompt id is required."
    );
  }

  return promptRepository.getNextPrompt(
    id
  );
}

export async function getPromptPosition(
  id: string
) {
  if (!id) {
    throw new Error(
      "Prompt id is required."
    );
  }

  return promptRepository.getPromptPosition(
    id
  );
}