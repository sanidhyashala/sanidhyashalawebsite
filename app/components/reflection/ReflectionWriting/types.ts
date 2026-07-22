export interface ReflectionDraft {
  id?: string;

  promptId: string;

  question: string;

  content: string;
}

export interface ReflectionWritingProps {
  isOpen: boolean;
  onOpen: () => void;
}

export interface ReflectionEditorProps {
  question: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

import type { Dispatch, SetStateAction } from "react";

export interface ReflectionActionsProps {
  disabled: boolean;
  draft: ReflectionDraft;
  setDraft: Dispatch<SetStateAction<ReflectionDraft>>;
  isEditing: boolean;
}

export interface ReflectionRestoreNoticeProps {
  visible: boolean;
}

/* NEW */

export interface FeaturedReflectionProps {
  onReflect: () => void;
}