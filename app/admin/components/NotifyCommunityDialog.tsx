"use client";

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;

  promptTitle: string;

  subscriberCount: number;

  mode: "notify" | "resend";
}

export default function NotifyCommunityDialog({
  open,
  onCancel,
  onConfirm,
  promptTitle,
  subscriberCount,
  mode,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="
        fixed
        inset-0
        z-50

        flex
        items-center
        justify-center

        bg-black/40
        backdrop-blur-sm
      "
    >
      <div
        className="
          w-full
          max-w-lg

          rounded-3xl
          bg-white
          p-8
          shadow-2xl

          dark:bg-slate-900
        "
      >
        <h2 className="text-2xl font-semibold">
  {mode === "notify"
    ? "Notify Community"
    : "Resend Community Notification"}
</h2>
        <div className="mt-8 space-y-6">

          <div>

            <p className="text-slate-500">

              Notify

              <strong>

                {" "}
                {subscriberCount}

              </strong>

              {" "}subscribers?

            </p>

          </div>

          <div>

            <p className="text-sm text-slate-500">

              Reflection

            </p>

            <p className="mt-2 font-medium">

              {promptTitle}

            </p>

          </div>

          <p className="text-sm text-red-500">
  {mode === "notify"
    ? "This action cannot be undone."
    : "This will send another email to every subscriber."}
</p>
          <div className="flex justify-end gap-3">

            <button
              onClick={onCancel}
              className="
                rounded-xl
                border
                px-5
                py-2
              "
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              className="
                rounded-xl
                bg-blue-700
                px-5
                py-2
                text-white
              "
            >
              {mode === "notify"
  ? "Notify Community"
  : "Resend Notification"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}