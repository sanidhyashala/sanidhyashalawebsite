import path from "path";
import { promises as fs } from "fs";

const REGISTRY_PATH = path.join(
  process.cwd(),
  "content",
  "journal",
  "legacy-notification-registry.json"
);

export async function ensureLegacyNotificationRegistry() {
  try {
    await fs.access(REGISTRY_PATH);
  } catch {
    await fs.writeFile(
      REGISTRY_PATH,
      "{}",
      "utf8"
    );

    console.log(
      "🆕 Created legacy-notification-registry.json"
    );
  }

  return REGISTRY_PATH;
}