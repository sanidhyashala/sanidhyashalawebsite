"use client";

import { useEffect, useState } from "react";



import ReflectionPrompt from "./ReflectionPrompt";
import ReflectionEditor from "./ReflectionEditor";
import ReflectionGuidelines from "./ReflectionGuidelines";
import ReflectionPause from "./ReflectionPause";
import ReflectionActions from "./ReflectionActions";
import ReflectionRestoreNotice from "./ReflectionRestoreNotice";

import { validateReflection } from "./utils/validation";
import { useReflectionStorage } from "./hooks/useReflectionStorage";

import type { ReflectionPrompt as ReflectionPromptType } from "@/app/lib/prompt/prompt-types";
import type { Reflection } from "@/app/lib/reflection/reflection-types";

import type { ReflectionDraft } from "./types";

interface ReflectionWritingProps {
  prompt: ReflectionPromptType;

  existingReflection: Reflection | null;

  hasPendingReflection: boolean;
}

export default function ReflectionWriting({
  prompt,
  existingReflection,
  hasPendingReflection,
}: ReflectionWritingProps) {
  
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
  if (
    typeof window !== "undefined" &&
    window.location.hash === "#reflection-writing"
  ) {
    requestAnimationFrame(() => {
      setIsOpen(true);

      document
        .getElementById("reflection-writing")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  }
}, []);

  const [draft, setDraft] =
  useState<ReflectionDraft>({
  id: existingReflection?.id,

  promptId: prompt.id,

  question: prompt.title,

  content:
    existingReflection?.content ?? "",
});

  const { wasRestored } =
    useReflectionStorage(
      draft,
      setDraft
    );

  const validation = validateReflection(
    draft.content
  );

  return (
    <section
      id="reflection-writing"
      className="px-6 py-32"
    >
      <div className="mx-auto max-w-5xl">

        <ReflectionPrompt
          isOpen={isOpen}
          onOpen={() => setIsOpen(true)}
        />

        {isOpen && (

          <div className="mt-14 space-y-10">

            {hasPendingReflection && (
  <div
    className="
      rounded-2xl
      border
      border-amber-200
      bg-amber-50
      p-5

      dark:border-amber-800
      dark:bg-amber-950/30
    "
  >
    <p
  className="
    font-semibold
    text-blue-900

    dark:text-blue-400
  "
>
  Your reflection has been submitted successfully.
</p>

    <p
      className="
        mt-2
        text-sm
        text-amber-600

        dark:text-amber-400
      "
    >
      It is currently under review. Once approved, it will become part of the public reflection collection.
    </p>
  </div>
)}

            {existingReflection && !hasPendingReflection && (
              <div
                className="
                  rounded-2xl
                  border
                  border-blue-200
                  bg-blue-50

                 dark:border-blue-900/40
                 dark:bg-blue-950/20
                  p-5

                  dark:border-emerald-800
                  dark:bg-emerald-950/30
                "
              >
                <p
                  className="
                    font-medium
                    text-blue-900
                  dark:text-blue-400

                    dark:text-emerald-300
                  "
                >
                  You have already submitted a
                  reflection for this question.
                </p>

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-600
                    dark:text-slate-300

                    dark:text-emerald-400
                  "
                >
                  You can continue editing it
                  until the reflection period
                  closes.
                </p>
              </div>
            )}

            <ReflectionRestoreNotice
              visible={wasRestored}
            />

            {!hasPendingReflection && (
  <>
    <ReflectionEditor
      question={draft.question}
      value={draft.content}
      onChange={(value) =>
        setDraft((prev) => ({
          ...prev,
          content: value,
        }))
      }
    />

    <ReflectionGuidelines />

    <ReflectionPause />

    <ReflectionActions
      disabled={!validation.isValid}
      draft={draft}
      setDraft={setDraft}
      isEditing={!!existingReflection}
    />
  </>
)}

          </div>

        )}

      </div>
    </section>
  );
}