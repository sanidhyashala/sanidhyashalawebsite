import type {
  LegacyNotificationRecord,
} from "./types";

export function createDefaultNotificationRecord(): LegacyNotificationRecord {
  return {
    notificationSentAt: null,

    recipients: 0,

    delivered: 0,

    failed: 0,
  };
}