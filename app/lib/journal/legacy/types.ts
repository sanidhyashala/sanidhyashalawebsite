export interface LegacyNotificationRecord {
  notificationSentAt: string | null;

  recipients: number;

  delivered: number;

  failed: number;
}