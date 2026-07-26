export interface ReflectionPrompt {
  id: string;

  title: string;

  description: string;

  isActive: boolean;

  createdAt: string;

  updatedAt: string;

  notificationSentAt: string | null;

  notificationRecipients: number | null;

notificationDelivered: number | null;

notificationFailed: number | null;
}