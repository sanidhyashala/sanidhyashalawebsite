"use client";

import { useEffect, useRef, ChangeEvent } from "react";

import type { ReflectionEditorProps } from "./types";

export default function ReflectionEditor({
  question,
  value,
  onChange,
  maxLength = 3000,
}: ReflectionEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  const handleChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    onChange(event.target.value);
  };

  return (
    <div
      className="
        rounded-[2rem]
        border
        border-blue-100
        bg-white
        p-8
        shadow-[0_8px_40px_rgba(37,99,235,0.06)]

        transition-all
        duration-300

        hover:-translate-y-1
        hover:shadow-[0_18px_55px_rgba(37,99,235,0.12)]

        dark:border-blue-900/40
        dark:bg-slate-900
        dark:hover:shadow-[0_18px_55px_rgba(37,99,235,0.18)]
      "
    >
      <label
        htmlFor="reflection-editor"
        className="
          mb-4
          block
          text-lg
          font-semibold
          text-blue-900
          dark:text-blue-400
        "
      >
        What stayed with you after reading?
      </label>

      {/* Reflection Prompt */}

      <div
        className="
          mb-6
          rounded-2xl
          border
          border-blue-100
          bg-blue-50/60
          p-5

          dark:border-blue-900/40
          dark:bg-blue-950/20
        "
      >
        <p
          className="
            text-xs
            uppercase
            tracking-[0.25em]
            text-blue-600
            dark:text-blue-400
          "
        >
          Today&apos;s Reflection
        </p>

        <p
          className="
            mt-2
            text-lg
            font-medium
            leading-8
            text-blue-900
            dark:text-blue-100
          "
        >
          {question}
        </p>
      </div>

      <textarea
        id="reflection-editor"
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        spellCheck={true}
        autoCorrect="on"
        autoCapitalize="sentences"
        maxLength={maxLength}
        rows={6}
        placeholder="Write honestly. There is no perfect answer here."
        className="
          w-full
          resize-none
          overflow-hidden
          rounded-2xl
          border
          border-blue-100
          bg-transparent
          p-5
          text-lg
          leading-8
          text-slate-700
          outline-none

          transition-all
          duration-300

          placeholder:text-slate-400

          focus:border-blue-400
          focus:ring-4
          focus:ring-blue-100

          dark:border-blue-900/40
          dark:text-slate-200
          dark:placeholder:text-slate-500
          dark:focus:border-blue-500
          dark:focus:ring-blue-900/30
        "
      />

      <div
        className="
          mt-4
          flex
          items-center
          justify-between
          text-sm
          text-slate-500
          dark:text-slate-400
        "
      >
        <span>
          Write slowly. Reflection is not a race.
        </span>

        <span className="font-medium text-blue-700 dark:text-blue-400">
          {value.length} / {maxLength}
        </span>
      </div>
    </div>
  );
}