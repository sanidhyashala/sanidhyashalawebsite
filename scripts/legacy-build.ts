import {
  syncLegacyNotificationRegistry,
} from "@/app/lib/journal/services/syncLegacyNotificationRegistry";

async function main() {
  const startedAt = Date.now();

  console.log("");

  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  console.log(
    "📚 SanidhyaShala Legacy Sync"
  );

  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  try {
    const result =
      await syncLegacyNotificationRegistry();

    const duration =
      Date.now() - startedAt;

    console.log("");

    console.log(
      `Articles Found : ${result.total}`
    );

    console.log(
      `Added          : ${result.added}`
    );

    console.log(
      `Removed        : ${result.removed}`
    );

    console.log(
      `Preserved      : ${result.unchanged}`
    );

    console.log("");

    console.log(
      `Completed In   : ${duration} ms`
    );

    console.log("");

    console.log(
      "✅ Legacy notification registry synchronized successfully."
    );

    console.log("");

    process.exit(0);

  } catch (error) {

    console.error("");

    console.error(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.error(
      "❌ Legacy Sync Failed"
    );

    console.error(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.error("");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    console.error("");

    process.exit(1);

  }
}

main();