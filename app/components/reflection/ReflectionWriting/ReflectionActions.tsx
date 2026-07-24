"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SignInButton, useAuth } from "@clerk/nextjs";

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

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handlePublish = () => {
  setError("");
  setSuccess("");

  if (!isSignedIn) {
    setError("signin");
    return;
  }

  if (disabled || isPending) return;

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
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong.";

        if (
          message.includes("signed in") ||
          message.includes("Unauthorized")
        ) {
          setError("signin");
          return;
        }

        setError(message);
      }
    });
  };

  return (
    <div className="space-y-4">

      {/* Normal Errors */}

      {error &&
        error !== "signin" && (
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

      {/* Sign In Required */}

      {error === "signin" && (
        <div
          className="
            rounded-3xl
            border
            border-blue-200
            bg-blue-50
            p-6

            dark:border-blue-900/40
            dark:bg-blue-950/30
          "
        >
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">
            Please sign in
          </h3>

          <p className="mt-3 leading-7 text-blue-700 dark:text-blue-400">
            You need an account before offering your reflection.
            Signing in allows your reflections to stay connected
            to you, so you can revisit, edit, and follow them from
            your Reflection Dashboard.
          </p>

          <div className="mt-6">
            <SignInButton mode="modal">
              <button
                className="
                  rounded-full

                  bg-blue-900
                  px-6
                  py-3

                  text-white
                  font-medium

                  transition-all
                  duration-300

                  hover:-translate-y-0.5
                  hover:bg-blue-800
                  hover:shadow-lg
                  hover:shadow-blue-500/20

                  dark:bg-blue-600
                  dark:hover:bg-blue-500
                "
              >
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      )}

      {/* Success */}

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