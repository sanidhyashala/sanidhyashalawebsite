import {
  CreateJournalInput,
  Journal,
  JournalCard,
} from "../journal-types";

export interface JournalRepository {
  /**
   * Create a new journal draft.
   */
  create(
    input: CreateJournalInput
  ): Promise<Journal>;

  /**
   * Update an existing journal.
   */
  update(
    journal: Journal
  ): Promise<Journal>;

  /**
   * Publish a journal.
   */
  publish(
    id: string
  ): Promise<void>;

  /**
   * Find journal by id.
   */
  findById(
    id: string
  ): Promise<Journal | null>;

  /**
   * Find journal by slug.
   */
  findBySlug(
    slug: string
  ): Promise<Journal | null>;

  /**
   * List all journals.
   */
  list(): Promise<JournalCard[]>;

  /**
   * Notify newsletter subscribers.
   */
  notifyCommunity(
    id: string
  ): Promise<void>;
}