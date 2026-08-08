import type { JournalMeta } from "../metadata/journalMeta";
import { serializeJournalMeta } from "./serializeJournalMeta";

type GenerateJournalMetaOptions =
  Omit<
    JournalMeta,
    | "status"
    | "createdAt"
    | "updatedAt"
    | "livePublishedAt"
    | "notificationSentAt"
    | "notificationRecipients"
    | "notificationDelivered"
    | "notificationFailed"
  >;

export function generateJournalMeta({
  slug,
  titleHindi,
  titleEnglish,
  description = "",
  coverImage,
  readingTime,
  categories = [],
  languages = ["Hindi", "English"],
  placements = [],
  featured = false,
}: GenerateJournalMetaOptions) {

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const meta: JournalMeta = {
    slug,

    titleHindi,

    titleEnglish,

    description,

    coverImage,

    readingTime,

    categories,

    languages,

    placements,

    featured,

    status: "generated",

    createdAt: today,

    updatedAt: today,

    livePublishedAt: null,

    /*
    ----------------------------------------
    Notification History
    ----------------------------------------
    */

    notificationSentAt: null,

    notificationRecipients: 0,

    notificationDelivered: 0,

    notificationFailed: 0,
  };

  return serializeJournalMeta(meta);
}