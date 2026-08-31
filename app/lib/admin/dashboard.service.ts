import {
  getRecentPendingReflections,
  getReflectionCountByStatus,
} from "@/app/lib/reflection/reflection-service";

import type { Reflection } from "@/app/lib/reflection/reflection-types";

import { journalRegistry } from "@/app/content/journal/journalRegistry";
import { journalArticles } from "@/content/journal/journal-articles";

// 👇 नया import ऐड किया गया है
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

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

  // 👇 Supabase Client और learning resources प्रॉमिस 
  const supabase = createAdminSupabaseClient();

  const learningResourcesPromise = supabase
    .from("resources")
    .select("id", { count: "exact", head: true });

  const [
    pendingCount,
    publishedCount,
    rejectedCount,
    archivedCount,
    recentPendingReflections,
    learningResourcesResult, // 👇 प्रॉमिस रिजल्ट
  ] = await Promise.all([
    getReflectionCountByStatus("pending"),
    getReflectionCountByStatus("published"),
    getReflectionCountByStatus("rejected"),
    getReflectionCountByStatus("archived"),
    getRecentPendingReflections(5),
    learningResourcesPromise, // 👇 प्रॉमिस कॉल
  ]);

  // 👇 नया safety check
  if (learningResourcesResult.error) {
    throw new Error(
      `Failed to load learning resource count: ${learningResourcesResult.error.message}`
    );
  }

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
        // 👇 Hard-coded 0 को डायनामिक काउंट से रिप्लेस किया गया
        resources: learningResourcesResult.count ?? 0,
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