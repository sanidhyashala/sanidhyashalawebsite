import {
  getRecentPendingReflections,
  getReflectionCountByStatus,
} from "@/app/lib/reflection/reflection-service";

import type { Reflection } from "@/app/lib/reflection/reflection-types";

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
      articles: number;
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
        articles: 0,
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