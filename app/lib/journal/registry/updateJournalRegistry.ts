import path from "path";
import { promises as fs } from "fs";

import { generateJournalRegistry } from "./generateJournalRegistry";

import type { JournalRegistryItem } from "./types";

import type {
  JournalMeta,
} from "../metadata/journalMeta";

import { generateJournalEntriesRegistry } from "./generateJournalEntriesRegistry";

export async function updateJournalRegistry() {
  const contentRoot = path.join(
    process.cwd(),
    "app",
    "content",
    "journal"
  );

  const entries =
    await fs.readdir(contentRoot, {
      withFileTypes: true,
    });

  const journals: JournalRegistryItem[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const metaPath = path.join(
      contentRoot,
      entry.name,
      "meta.ts"
    );

    try {
      const source =
        await fs.readFile(
          metaPath,
          "utf8"
        );

      const slug =
        source.match(
          /slug:\s*"([^"]+)"/
        )?.[1];

      const titleHindi =
        source.match(
          /titleHindi:\s*"([^"]+)"/
        )?.[1];

      const titleEnglish =
        source.match(
          /titleEnglish:\s*"([^"]+)"/
        )?.[1];

      // 👇 Naye variables yahan add kiye gaye hain
      const description =
        source.match(
          /description:\s*"([^"]*)"/
        )?.[1] ?? "";

      const categories =
        source.match(
          /categories:\s*(\[[^\]]*\])/
        )?.[1];

      const languages =
        source.match(
          /languages:\s*(\[[^\]]*\])/
        )?.[1];

      const placements =
        source.match(
          /placements:\s*(\[[^\]]*\])/
        )?.[1];
      // 👆

      const coverImage =
        source.match(
          /coverImage:\s*"([^"]+)"/
        )?.[1];

      const readingTime =
        source.match(
          /readingTime:\s*"([^"]+)"/
        )?.[1];

      const featured =
        source.match(
          /featured:\s*(true|false)/
        )?.[1] === "true";

      const status =
        source.match(
          /status:\s*"([^"]+)"/
        )?.[1] as JournalMeta["status"] | undefined;

      const createdAt =
        source.match(
          /createdAt:\s*"([^"]+)"/
        )?.[1];

      const updatedAt =
        source.match(
          /updatedAt:\s*"([^"]+)"/
        )?.[1];

      const livePublishedAt =
        source.match(
          /livePublishedAt:\s*(null|"[^"]+")/
        )?.[1];

      // 👇 Naye notification variables yahan add kiye gaye hain
      /*
----------------------------------------
Notification History
----------------------------------------
*/
      const notificationSentAt =
        source.match(
          /notificationSentAt:\s*(null|"[^"]+")/
        )?.[1];
        
      const notificationRecipients =
        Number(
          source.match(
            /notificationRecipients:\s*(\d+)/
          )?.[1] ?? 0
        );
        
      const notificationDelivered =
        Number(
          source.match(
            /notificationDelivered:\s*(\d+)/
          )?.[1] ?? 0
        );
        
      const notificationFailed =
        Number(
          source.match(
            /notificationFailed:\s*(\d+)/
          )?.[1] ?? 0
        );
      // 👆

      if (
        !slug ||
        !titleHindi ||
        !titleEnglish ||
        !coverImage ||
        !readingTime ||
        !createdAt ||
        !updatedAt
      ) {
        continue;
      }

      journals.push({
        slug,
        folder: entry.name,
        titleHindi,
        titleEnglish,
        // 👇 Naye fields yahan add kiye gaye hain
        description,
        categories: categories
          ? JSON.parse(categories)
          : [],
        languages: languages
          ? JSON.parse(languages)
          : [],
        placements: placements
          ? JSON.parse(placements)
          : [],
        // 👆
        coverImage,
        readingTime,
        featured,
        status: status ?? "generated",
        createdAt,
        updatedAt,
        livePublishedAt:
          livePublishedAt === "null"
            ? null
            : livePublishedAt?.replace(/"/g, "") ??
              null,
        // 👇 Naye fields data push me add kiye gaye hain
        notificationSentAt:
          notificationSentAt === "null"
            ? null
            : notificationSentAt?.replace(/"/g, "") ??
              null,
        notificationRecipients,
        notificationDelivered,
        notificationFailed,
        // 👆
      });

    } catch {
      continue;
    }
  }

  /*
  ----------------------------------------
  Sort Journals
  Newest First
  ----------------------------------------
  */

  journals.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  const registrySource =
  generateJournalRegistry(
    journals
  );

  const entriesRegistrySource =
    generateJournalEntriesRegistry(
      journals
    );

  await fs.writeFile(
    path.join(
      contentRoot,
      "journalRegistry.ts"
    ),
    registrySource,
    "utf8"
  );

  await fs.writeFile(
    path.join(
      contentRoot,
      "journalEntries.ts"
    ),
    entriesRegistrySource,
    "utf8"
  );
}