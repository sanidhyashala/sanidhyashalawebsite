import { promises as fs } from "fs";
import path from "path";

import {
  ensureLegacyNotificationRegistry,
} from "./ensureLegacyNotificationRegistry";

import type {
  LegacyNotificationRecord,
} from "@/app/lib/journal/legacy/types";

export async function writeLegacyNotificationRegistry(
  registry: Record<
    string,
    LegacyNotificationRecord
  >
): Promise<void> {
  const registryPath =
    await ensureLegacyNotificationRegistry();

  const tempPath = path.join(
    path.dirname(registryPath),
    "legacy-notification-registry.tmp"
  );

  await fs.writeFile(
    tempPath,
    JSON.stringify(
      registry,
      null,
      2
    ),
    "utf8"
  );

  await fs.rename(
    tempPath,
    registryPath
  );
}