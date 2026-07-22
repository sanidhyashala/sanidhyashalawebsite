"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { publishReflection } from "@/app/actions/reflection.actions";

import type { ReflectionActionsProps } from "./types";

import { clearReflectionDraft } from "./hooks/useReflectionStorage";

export default function ReflectionActions({
  disabled,
  draft,
  setDraft,
  isEditing,
}: ReflectionActionsProps) {
  const [isPending, startTransition] =
    useTransition();

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  const router = useRouter();

  const handlePublish = () => {
    if (disabled || isPending) return;

    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        await publishReflection(draft);

        if (!isEditing) {
          clearReflectionDraft();

          setDraft((prev) => ({
            ...prev,
            content: "",
          }));
        }

        router.refresh();

        setSuccess(
          isEditing
            ? "Your reflection has been updated successfully."
            : "Your reflection has been received and is awaiting review."
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      }
    });
  };

  return (
    <div className="space-y-4">

      {error && (
        <div
          className="
            rounded-2xl
            border
            border-red-200
            bg-red-50
            px-5
            py-4
            text-sm
            text-red-700

            dark:border-red-900
            dark:bg-red-950/30
            dark:text-red-300
          "
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="
            rounded-2xl
            border
            border-emerald-200
            bg-emerald-50
            px-5
            py-4
            text-sm
            text-emerald-700

            dark:border-emerald-900
            dark:bg-emerald-950/30
            dark:text-emerald-300
          "
        >
          {success}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handlePublish}
          disabled={disabled || isPending}
          className="
            rounded-full

            bg-blue-900
            px-8
            py-4

            text-base
            font-medium
            text-white

            transition-all
            duration-300

            hover:-translate-y-0.5
            hover:bg-blue-800
            hover:shadow-xl
            hover:shadow-blue-500/20

            active:translate-y-0

            disabled:cursor-not-allowed
            disabled:opacity-50

            dark:bg-blue-600
            dark:hover:bg-blue-500
            dark:hover:shadow-blue-500/30

            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue-500
            focus-visible:ring-offset-2
            dark:focus-visible:ring-offset-slate-900
          "
        >
          {isPending
            ? isEditing
              ? "Updating..."
              : "Publishing..."
            : isEditing
            ? "Update Reflection"
            : "Offer This Reflection"}
        </button>
      </div>
    </div>
  );
}