"use client";

import { useState } from "react";

import NotifyCommunityDialog from "./NotifyCommunityDialog";

interface Props {
  promptTitle: string;
  promptDescription: string;

  subscriberCount: number;

  notificationRecipients: number | null;

  notificationSent: boolean;

  sentAt: string | null;

  delivered: number | null;

  failed: number | null;
}

export default function NotifyCommunityCard({
  promptTitle,
  promptDescription,
  subscriberCount,
  notificationRecipients,
  notificationSent,
  sentAt,
  delivered,
  failed,
}: Props) {
    const [dialogOpen, setDialogOpen] =
  useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function notifyCommunity() {
    try {
      setLoading(true);
      setMessage("");
      const response = await fetch(
  "/api/admin/notify-community",
  {
    method: "POST",

    headers: {
      "Content-Type":
        "application/json",
    },

    body: JSON.stringify({
      resend:
        notificationSent,
    }),
  }
);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      setMessage(
  notificationSent
    ? "Community notified again successfully."
    : data.message
);
      setDialogOpen(false);
      window.location.reload();
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
  <>
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <h2 className="text-xl font-semibold">
        Community Notification
      </h2>

      <div className="mt-8 space-y-6">

        <div>

          <p className="text-sm text-slate-500">
            Active Reflection
          </p>

          <h3 className="mt-2 text-xl font-semibold">
            {promptTitle}
          </h3>

          <p className="mt-2 text-slate-500">
            {promptDescription}
          </p>

        </div>

        <div className="grid grid-cols-2 gap-6">

          <div>

            <p className="text-sm text-slate-500">
              Status
            </p>

            <p className="mt-2 font-medium">

              {notificationSent
                ? "✅ Sent"
                : "⭕ Not Sent"}

            </p>

          </div>

          <div>

            <p className="text-sm text-slate-500">
              Subscribers
            </p>

            <p className="mt-2 font-medium">
              {subscriberCount}
            </p>

          </div>

        </div>

        {notificationSent && sentAt && (

          <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">

            Last notification sent on

            <div className="mt-1 font-medium">

              {new Date(sentAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
             })}

            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">

  <div>
    <p className="text-slate-500">
      Recipients
    </p>

    <p className="font-medium">
  {notificationRecipients ?? "-"}
</p>
  </div>

  <div>
    <p className="text-slate-500">
      Delivered
    </p>

    <p className="font-medium text-emerald-700">
      {delivered ?? "-"}
    </p>
  </div>

  <div>
    <p className="text-slate-500">
      Failed
    </p>

    <p className="font-medium text-red-600">
      {failed ?? "-"}
    </p>
  </div>

</div>

          </div>

        )}

        <button
  onClick={() => setDialogOpen(true)}
  disabled={loading}
  className="
  rounded-xl
  bg-blue-700
  px-6
  py-3
  text-white
  transition

  hover:bg-blue-600

  disabled:cursor-not-allowed
  disabled:opacity-50
"
>
  {
  loading
    ? "Sending..."
    : notificationSent
      ? "Resend Notification"
      : "Notify Community"
}
</button>

        {message && (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            {message}
          </p>
        )}

      </div>

    </section>

    <NotifyCommunityDialog
      open={dialogOpen}
      onCancel={() =>
        setDialogOpen(false)
      }
      onConfirm={notifyCommunity}
      promptTitle={promptTitle}
      subscriberCount={subscriberCount}
      mode={
  notificationSent
    ? "resend"
    : "notify"
}
    />

  </>
);
}