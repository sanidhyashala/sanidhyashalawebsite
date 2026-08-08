"use client";

import { useState, useEffect } from "react"; // 👇 Added useEffect here
import Link from "next/link";
import { useRouter } from "next/navigation";

import PublishJournalButton from "./PublishJournalButton";
import NotifyJournalButton from "./NotifyJournalButton";
import type { JournalRegistryItem } from "@/app/lib/journal/registry/types";

interface JournalActionsProps {
  journal: JournalRegistryItem;
}

export default function JournalActions({
  journal,
}: JournalActionsProps) {
  const router = useRouter();

  // 👇 Hydration Fix: Added isMounted state
  const [isMounted, setIsMounted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 👇 Hydration Fix: Set isMounted to true on client load
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    slug,
    status,
    notificationSentAt,
    notificationRecipients,
    notificationDelivered,
    notificationFailed,
  } = journal;

  return (
    <>
      {/* Top Actions Row (Clean Layout) */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/journal/edit/${slug}`}
          className="
            rounded-lg
            border
            border-slate-300
            px-3
            py-2
            text-sm
            transition-colors

            hover:bg-slate-100

            dark:border-slate-700
            dark:hover:bg-slate-800
          "
        >
          Revise
        </Link>

        {status === "published" ? (
          <NotifyJournalButton
            slug={slug}
            published
            resend={!!notificationSentAt}
          />
        ) : (
          <PublishJournalButton
            slug={slug}
            published={false}
          />
        )}

        <button
          type="button"
          onClick={() =>
            setShowDeleteModal(true)
          }
          className="
            rounded-lg
            border
            border-red-300
            px-3
            py-2
            text-sm
            text-red-600
            transition-colors

            hover:bg-red-50

            dark:border-red-800
            dark:text-red-400
            dark:hover:bg-red-950/30
          "
        >
          Delete
        </button>
      </div>

      {/* Stats Block (Rendered below the actions separately) */}
      {status === "published" && notificationSentAt && (
        <div className="mt-6 flex flex-col gap-4">
          <hr className="border-slate-200 dark:border-slate-800" />
          
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
              Community Notified ✓
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
                <strong>Last Sent:</strong><br />
                {/* 👇 Hydration Fix: Only render Date if mounted */}
                {isMounted && notificationSentAt
                  ? new Date(notificationSentAt).toLocaleString()
                  : "-"}
              </p>

              <p className="mt-2">
                <strong>Recipients:</strong>{" "}
                {notificationRecipients}
              </p>

              <p>
                <strong>Delivered:</strong>{" "}
                {notificationDelivered}
              </p>

              <p>
                <strong>Failed:</strong>{" "}
                {notificationFailed}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">

            <h2 className="text-xl font-semibold text-red-600">
              Delete Journal
            </h2>

            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              This action cannot be undone.
            </p>

            <p className="mt-2 break-all rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
              {slug}
            </p>

            <div className="mt-8 flex flex-col gap-3">

              <Link
                href={`/admin/journal/edit/${slug}`}
                className="
                  rounded-xl
                  bg-blue-600
                  px-4
                  py-3
                  text-center
                  font-medium
                  text-white

                  hover:bg-blue-700
                "
              >
                ✏ Modify Instead
              </Link>

              <button
                onClick={async () => {
                  try {
                    const response = await fetch(
                      "/api/admin/journal/delete",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type":
                            "application/json",
                        },
                        body: JSON.stringify({
                          slug,
                        }),
                      }
                    );

                    const result = await response.json();

                    if (!response.ok) {
                      alert(result.message || "Failed to delete journal.");
                      return;
                    }

                    // Success UX
                    setShowDeleteModal(false);
                    router.refresh();
                  } catch (error) {
                    console.error("Delete error:", error);
                    alert("Something went wrong while deleting.");
                  }
                }}
                className="
                  rounded-xl
                  bg-red-600
                  px-4
                  py-3
                  font-medium
                  text-white

                  hover:bg-red-700
                "
              >
                🗑 Permanently Delete
              </button>

              <button
                onClick={() =>
                  setShowDeleteModal(
                    false
                  )
                }
                className="
                  rounded-xl
                  border
                  border-slate-300
                  px-4
                  py-3

                  hover:bg-slate-100

                  dark:border-slate-700
                  dark:hover:bg-slate-800
                "
              >
                Cancel
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}