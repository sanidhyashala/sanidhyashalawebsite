export type ReflectionStatus =
  | "draft"
  | "pending"
  | "published"
  | "rejected"
  | "archived";

export interface Reflection {
  id: string;

  authorId: string;

  authorName: string;

  promptId: string;

  question: string;

  content: string;

  status: ReflectionStatus;

  version: number;

  rejectionReason: string | null;

  adminNote: string | null;

  updateRequested: boolean;

  updateRequestedAt: string | null;

  moderatedBy: string | null;

moderatedAt: string | null;

publishedAt: string | null;

archivedAt: string | null;

lastSubmittedAt: string | null;

lastReviewedAt: string | null;

reviewComment: string | null;

createdAt: string;

updatedAt: string;
}

export interface CreateReflectionInput {
  authorId: string;

  authorName: string;

  promptId: string;

  question: string;

  content: string;
}

export interface UpdateReflectionInput {
  id: string;

  question?: string;

  content?: string;

  status?: ReflectionStatus;

  moderatedBy?: string | null;

  moderatedAt?: string | null;

  rejectionReason?: string | null;

  adminNote?: string | null;

  updateRequested?: boolean;

  updateRequestedAt?: string | null;

  version?: number;

  publishedAt?: string | null;

archivedAt?: string | null;

lastSubmittedAt?: string | null;

lastReviewedAt?: string | null;

reviewComment?: string | null;
}