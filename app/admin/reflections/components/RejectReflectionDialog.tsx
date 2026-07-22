"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (
    rejectionReason: string,
    adminNote: string
  ) => void;
}

export default function RejectReflectionDialog({
  open,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const [reason, setReason] = useState("");
  const [adminNote, setAdminNote] =
    useState("");

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/40
        p-6
      "
    >
      <div
        className="
          w-full
          max-w-xl
          rounded-3xl
          bg-white
          p-8
          shadow-2xl
          dark:bg-slate-900
        "
      >
        <h2 className="text-2xl font-bold">
          Reject Reflection
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Please explain why this reflection
          was rejected.
        </p>

        <div className="mt-8 space-y-6">

          <div>
            <label className="mb-2 block text-sm font-medium">
              Reject Reason *
            </label>

            <textarea
              rows={5}
              value={reason}
              onChange={(e) =>
                setReason(e.target.value)
              }
              className="
                w-full
                rounded-2xl
                border
                p-4
              "
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Admin Note (optional)
            </label>

            <textarea
              rows={4}
              value={adminNote}
              onChange={(e) =>
                setAdminNote(e.target.value)
              }
              className="
                w-full
                rounded-2xl
                border
                p-4
              "
            />
          </div>

        </div>

        <div className="mt-8 flex justify-end gap-3">

          <button
            onClick={() => {
  setReason("");
  setAdminNote("");
  onClose();
}}
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
            disabled={
              loading || reason.trim() === ""
            }
            onClick={() => {
  onSubmit(
    reason.trim(),
    adminNote.trim()
  );

  setReason("");
  setAdminNote("");
}}
            className="
              rounded-xl
              bg-red-600
              px-5
              py-2
              text-white
              disabled:opacity-50
            "
          >
            {loading
              ? "Rejecting..."
              : "Reject Reflection"}
          </button>

        </div>
      </div>
    </div>
  );
}