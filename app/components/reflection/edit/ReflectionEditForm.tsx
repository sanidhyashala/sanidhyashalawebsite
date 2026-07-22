"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { resubmitReflection } from "@/app/actions/reflection.actions";

import type { Reflection } from "@/app/lib/reflection/reflection-types";

interface Props {
  reflection: Reflection;
}

export default function ReflectionEditForm({
  reflection,
}: Props) {
  const router = useRouter();

  const [content, setContent] = useState(
    reflection.content
  );

  const [isPending, startTransition] =
    useTransition();

  async function handleResubmit() {
    startTransition(async () => {
      try {
        await resubmitReflection(
          reflection.id,
          content
        );

        router.push("/reflection/dashboard");
        router.refresh();
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      }
    });
  }

  return (
    <>
      {/* Review Comment */}

      <div
        className="
          mt-10
          rounded-3xl
          border
          border-red-200
          bg-red-50
          p-7

          dark:border-red-900/40
          dark:bg-red-950/20
        "
      >
        <h2
          className="
            text-lg
            font-semibold
            text-red-700

            dark:text-red-300
          "
        >
          Review Comment
        </h2>

        <p
          className="
            mt-4
            whitespace-pre-wrap
            leading-8
            text-red-600

            dark:text-red-200
          "
        >
          {reflection.rejectionReason ??
            "No review comment provided."}
        </p>
      </div>

      {/* Admin Note */}

      {reflection.adminNote && (
        <div
          className="
            mt-6
            rounded-3xl
            border
            border-blue-200
            bg-blue-50
            p-7

            dark:border-blue-900/40
            dark:bg-blue-950/20
          "
        >
          <h2
            className="
              text-lg
              font-semibold
              text-blue-800

              dark:text-blue-300
            "
          >
            Admin Note
          </h2>

          <p
            className="
              mt-4
              whitespace-pre-wrap
              leading-8
              text-slate-700

              dark:text-slate-300
            "
          >
            {reflection.adminNote}
          </p>
        </div>
      )}

      {/* Revision Message */}

      <div className="mt-10">
        <p
          className="
            rounded-2xl
            border
            border-blue-100
            bg-blue-50/70
            px-6
            py-5

            text-base
            leading-8
            text-slate-700

            dark:border-blue-900/30
            dark:bg-blue-950/20
            dark:text-slate-300
          "
        >
          Take a moment to revise your reflection in light of
          the feedback above. Thoughtful revisions often lead
          to deeper clarity.
        </p>
      </div>

      {/* Editor */}

      <div className="mt-10">
        <label
          className="
            mb-4
            block
            text-lg
            font-semibold

            text-blue-900
            dark:text-blue-400
          "
        >
          Revise Your Reflection
        </label>

        <textarea
          value={content}
          onChange={(e) =>
            setContent(e.target.value)
          }
          rows={14}
          className="
            w-full

            rounded-3xl
            border
            border-slate-300

            bg-white

            p-6

            text-slate-700
            leading-8

            outline-none

            transition-all
            duration-300

            placeholder:text-slate-400

            focus:border-blue-500
            focus:ring-4
            focus:ring-blue-100

            dark:border-slate-700
            dark:bg-slate-900
            dark:text-slate-200

            dark:placeholder:text-slate-500

            dark:focus:border-blue-500
            dark:focus:ring-blue-900/40
          "
        />
      </div>

      {/* Action */}

      <div className="mt-10 flex justify-end">
        <button
          type="button"
          disabled={
            isPending ||
            content.trim().length < 20
          }
          onClick={handleResubmit}
          className="
            rounded-2xl

            bg-blue-900
            px-7
            py-3.5

            font-medium
            text-white

            transition-all
            duration-300

            hover:-translate-y-0.5
            hover:bg-blue-800
            hover:shadow-lg
            hover:shadow-blue-500/20

            active:translate-y-0

            disabled:cursor-not-allowed
            disabled:opacity-50

            dark:bg-blue-600
            dark:hover:bg-blue-500
          "
        >
          {isPending
            ? "Resubmitting..."
            : "Resubmit Reflection"}
        </button>
      </div>
    </>
  );
}