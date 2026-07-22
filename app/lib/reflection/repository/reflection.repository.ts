import type {
  CreateReflectionInput,
  UpdateReflectionInput,
  Reflection,
  ReflectionStatus,
} from "../reflection-types";

export interface ReflectionRepository {
  create(
    input: CreateReflectionInput
  ): Promise<Reflection>;

  getByStatus(
    status?: ReflectionStatus
  ): Promise<Reflection[]>;

  getByAuthor(
    authorId: string
  ): Promise<Reflection[]>;

  getPublishedByPrompt(
    promptId: string
  ): Promise<Reflection[]>;

  getPublishedCountByPrompt(
    promptId: string
  ): Promise<number>;

  getByAuthorAndPrompt(
    authorId: string,
    promptId: string
  ): Promise<Reflection | null>;

  getById(
  id: string
): Promise<Reflection | null>;

  getPublishedById(
    id: string
  ): Promise<Reflection | null>;

  getRecentPending(
    limit: number
  ): Promise<Reflection[]>;

  getCountByStatus(
    status: ReflectionStatus
  ): Promise<number>;

  update(
    input: UpdateReflectionInput
  ): Promise<Reflection>;

  updateStatus(
  id: string,
  status: ReflectionStatus,
  moderatedBy: string,
  rejectionReason?: string,
  adminNote?: string,
  reviewComment?: string
): Promise<void>;
}