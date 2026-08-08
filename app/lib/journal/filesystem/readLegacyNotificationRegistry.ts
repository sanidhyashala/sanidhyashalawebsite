import { promises as fs } from "fs";

import {
  ensureLegacyNotificationRegistry,
} from "./ensureLegacyNotificationRegistry";

import type {
  LegacyNotificationRecord,
} from "@/app/lib/journal/legacy/types";

export async function readLegacyNotificationRegistry(): Promise<
  Record<string, LegacyNotificationRecord>
> {
  const registryPath =
    await ensureLegacyNotificationRegistry();

  const source =
    await fs.readFile(
      registryPath,
      "utf8"
    );

  try {
    return JSON.parse(
      source
    ) as Record<
      string,
      LegacyNotificationRecord
    >;
  } catch {
    throw new Error(
      [
        "Invalid JSON found in:",
        registryPath,
        "",
        "Please fix the JSON file and run the command again.",
      ].join("\n")
    );
  }
}