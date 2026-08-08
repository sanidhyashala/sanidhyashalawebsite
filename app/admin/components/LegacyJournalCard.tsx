import type {
  JournalEntry,
} from "@/content/journal/types";

import type {
  LegacyNotificationRecord,
} from "@/app/lib/journal/legacy/types";

import LegacyNotifyButton from "./LegacyNotifyButton";

interface LegacyJournalCardProps {
  slug: string;

  journal: JournalEntry;

  notification: LegacyNotificationRecord;
}

export default function LegacyJournalCard({
  slug,
  journal,
  notification,
}: LegacyJournalCardProps) {
  return (
    <article
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-6
        shadow-sm
        transition-all

        hover:shadow-md

        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      {/* Header */}

      <div className="flex items-start justify-between gap-4">

        <div>

          <h3
            className="
              text-lg
              font-semibold
            "
          >
            {journal.meta.title}
          </h3>

          <p
            className="
              mt-1
              break-all
              text-sm
              text-slate-500

              dark:text-slate-400
            "
          >
            {slug}
          </p>

        </div>

        <span
          className="
            rounded-full
            bg-slate-100
            px-3
            py-1
            text-xs
            font-medium
            uppercase
            tracking-wide
            text-slate-600

            dark:bg-slate-800
            dark:text-slate-300
          "
        >
          Legacy
        </span>

      </div>

      {/* Divider */}

      <div className="my-6 border-t border-slate-200 dark:border-slate-800" />

      {/* Description */}

      <p
        className="
          text-sm
          text-slate-600

          dark:text-slate-300
        "
      >
        {journal.meta.description}
      </p>

      {/* Divider */}

      <div className="my-6 border-t border-slate-200 dark:border-slate-800" />

      {/* Metadata */}

      <div
        className="
          space-y-2
          text-sm
          text-slate-600

          dark:text-slate-300
        "
      >
        <p>
          <strong>Reading Time:</strong>{" "}
          {journal.meta.readingTime}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          Published
        </p>

        <p>
          <strong>System:</strong>{" "}
          Legacy
        </p>
      </div>

      {/* Notification History */}

      {notification.notificationSentAt && (
        <>
          <div className="my-6 border-t border-slate-200 dark:border-slate-800" />

          <div className="flex flex-col gap-2">

            <div
              className="
                rounded-lg
                bg-emerald-600
                px-3
                py-2
                text-center
                text-sm
                text-white
              "
            >
              Community Recommended ✓
            </div>

            <div
              className="
                rounded-lg
                border
                border-slate-200
                p-3
                text-xs
                text-slate-600

                dark:border-slate-700
                dark:text-slate-400
              "
            >
              <p>
                <strong>
                  Last Recommended:
                </strong>
                <br />
                {new Date(
                  notification.notificationSentAt
                ).toLocaleString()}
              </p>

              <p className="mt-2">
                <strong>
                  Recipients:
                </strong>{" "}
                {notification.recipients}
              </p>

              <p>
                <strong>
                  Delivered:
                </strong>{" "}
                {notification.delivered}
              </p>

              <p>
                <strong>
                  Failed:
                </strong>{" "}
                {notification.failed}
              </p>

            </div>

          </div>
        </>
      )}

      {/* Divider */}

      <div className="my-6 border-t border-slate-200 dark:border-slate-800" />

      {/* Actions */}

      <LegacyNotifyButton
        slug={slug}
        notification={notification}
      />

    </article>
  );
}