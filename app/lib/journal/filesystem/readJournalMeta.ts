import path from "path";
import { promises as fs } from "fs";

import type {
  JournalMeta,
  JournalStatus,
} from "../metadata/journalMeta";

export async function readJournalMeta(
  slug: string
): Promise<JournalMeta> {
  const metaPath = path.join(
    process.cwd(),
    "app",
    "content",
    "journal",
    slug,
    "meta.ts"
  );

  const source = await fs.readFile(
    metaPath,
    "utf8"
  );

  const match = (
    pattern: RegExp
  ) => source.match(pattern)?.[1];

  return {
    slug:
      match(/slug:\s*"([^"]+)"/) ??
      "",

    titleHindi:
      match(
        /titleHindi:\s*"([^"]+)"/
      ) ?? "",

    titleEnglish:
      match(
        /titleEnglish:\s*"([^"]+)"/
      ) ?? "",

    description:
      match(
        /description:\s*"([^"]*)"/
      ) ?? "",

    coverImage:
      match(
        /coverImage:\s*"([^"]+)"/
      ) ?? "",

    readingTime:
      match(
        /readingTime:\s*"([^"]+)"/
      ) ?? "",

    categories:
      source.match(
        /categories:\s*(\[[^\]]*\])/
      )
        ? JSON.parse(
            source.match(
              /categories:\s*(\[[^\]]*\])/
            )![1]
          )
        : [],

    languages:
      source.match(
        /languages:\s*(\[[^\]]*\])/
      )
        ? JSON.parse(
            source.match(
              /languages:\s*(\[[^\]]*\])/
            )![1]
          )
        : [],

    placements:
      source.match(
        /placements:\s*(\[[^\]]*\])/
      )
        ? JSON.parse(
            source.match(
              /placements:\s*(\[[^\]]*\])/
            )![1]
          )
        : [],

    featured:
      match(
        /featured:\s*(true|false)/
      ) === "true",

    status:
      (match(
        /status:\s*"([^"]+)"/
      ) as JournalStatus) ??
      "generated",

    createdAt:
      match(
        /createdAt:\s*"([^"]+)"/
      ) ?? "",

    updatedAt:
      match(
        /updatedAt:\s*"([^"]+)"/
      ) ?? "",

    livePublishedAt:
      match(
        /livePublishedAt:\s*"([^"]+)"/
      ) ?? null,

    /*
    ----------------------------------------
    Notification History
    Backward Compatible
    ----------------------------------------
    */

    notificationSentAt:
      match(
        /notificationSentAt:\s*"([^"]+)"/
      ) ?? null,

    notificationRecipients: Number(
      match(
        /notificationRecipients:\s*(\d+)/
      ) ?? 0
    ),

    notificationDelivered: Number(
      match(
        /notificationDelivered:\s*(\d+)/
      ) ?? 0
    ),

    notificationFailed: Number(
      match(
        /notificationFailed:\s*(\d+)/
      ) ?? 0
    ),
  };
}