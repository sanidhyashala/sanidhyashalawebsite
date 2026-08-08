import type { JournalMeta } from "../metadata/journalMeta";

export interface JournalRegistryItem
  extends JournalMeta {
  folder: string;
}