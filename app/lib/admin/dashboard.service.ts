import {
  getRecentPendingReflections,
  getReflectionCountByStatus,
} from "@/app/lib/reflection/reflection-service";

import type { Reflection } from "@/app/lib/reflection/reflection-types";

import { journalRegistry } from "@/app/content/journal/journalRegistry";
import { journalArticles } from "@/content/journal/journal-articles";

export interface DashboardData {
  stats: {
    reflections: {
      pending: number;
      published: number;
      rejected: number;
      archived: number;
      total: number;
    };

    journal: {
      generated: number;
      published: number;
      archived: number;
      legacy: number;
      total: number;
    };

    learning: {
      resources: number;
    };

    students: {
      total: number;
    };

    newsletter: {
      subscribers: number;
    };
  };

  recentPendingReflections: Reflection[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const generatedJournalCount =
    journalRegistry.filter(
      (journal) =>
        journal.status === "generated"
    ).length;

  const publishedJournalCount =
    journalRegistry.filter(
      (journal) =>
        journal.status === "published"
    ).length;

  const archivedJournalCount =
    journalRegistry.filter(
      (journal) =>
        journal.status === "archived"
    ).length;

  const legacyJournalCount =
    Object.keys(journalArticles).length;

  const totalJournalCount =
    generatedJournalCount +
    publishedJournalCount +
    archivedJournalCount +
    legacyJournalCount;

  const [
    pendingCount,
    publishedCount,
    rejectedCount,
    archivedCount,
    recentPendingReflections,
  ] = await Promise.all([
    getReflectionCountByStatus("pending"),
    getReflectionCountByStatus("published"),
    getReflectionCountByStatus("rejected"),
    getReflectionCountByStatus("archived"),
    getRecentPendingReflections(5),
  ]);

  return {
    stats: {
      reflections: {
        pending: pendingCount,
        published: publishedCount,
        rejected: rejectedCount,
        archived: archivedCount,
        total:
          pendingCount +
          publishedCount +
          rejectedCount +
          archivedCount,
      },

      journal: {
        generated: generatedJournalCount,
        published: publishedJournalCount,
        archived: archivedJournalCount,
        legacy: legacyJournalCount,
        total: totalJournalCount,
      },

      learning: {
        resources: 0,
      },

      students: {
        total: 0,
      },

      newsletter: {
        subscribers: 0,
      },
    },

    recentPendingReflections,
  };
}