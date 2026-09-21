"use client";

import { useState } from "react";

const CATEGORY_OPTIONS = [
  {
    value: "UNDERSTAND_APPLY",
    label: "Understand & Apply",
    description:
      "Questions focused on understanding concepts and applying them.",
  },
  {
    value: "THINK_SOLVE",
    label: "Think & Solve",
    description:
      "Questions focused on reasoning, problem solving and deeper thinking.",
  },
  {
    value: "CASE_BASED",
    label: "Case Based",
    description:
      "Case-based questions within the Subjective Engine.",
  },
] as const;

const ACCESS_OPTIONS = [
  {
    value: "FREE",
    label: "Free",
    description:
      "Available to students without a premium chapter or subject entitlement.",
  },
  {
    value: "PREMIUM",
    label: "Premium",
    description:
      "Available to students with the relevant premium access.",
  },
] as const;

type Category =
  (typeof CATEGORY_OPTIONS)[number]["value"];

type AccessType =
  (typeof ACCESS_OPTIONS)[number]["value"];

type Props = {
  nextSetNumbers: Record<Category, number>;
};

export default function SubjectiveSetCreationFields({
  nextSetNumbers,
}: Props) {
  const [category, setCategory] =
    useState<Category>("UNDERSTAND_APPLY");

  const [accessType, setAccessType] =
    useState<AccessType>("FREE");

  const nextSetNumber =
    nextSetNumbers[category] ?? 1;

  const selectedCategory =
    CATEGORY_OPTIONS.find(
      (item) => item.value === category
    );

  return (
    <>
      {/* Category */}

      <div>
        <label
          htmlFor="category"
          className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
        >
          Category
        </label>

        <select
          id="category"
          name="category"
          value={category}
          onChange={(event) =>
            setCategory(
              event.target.value as Category
            )
          }
          required
          className="
            mt-2
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-sm
            text-slate-900
            outline-none
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-100
            dark:border-slate-700
            dark:bg-slate-950
            dark:text-white
          "
        >
          {CATEGORY_OPTIONS.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {selectedCategory?.description}
        </p>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Each category has its own independent Set numbering.
        </p>
      </div>

      {/* Access Type */}

      <div>
        <p className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
          Access
        </p>

        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {ACCESS_OPTIONS.map((option) => {
            const selected =
              accessType === option.value;

            return (
              <label
                key={option.value}
                className={`
                  cursor-pointer
                  rounded-xl
                  border
                  p-4
                  transition
                  ${
                    selected
                      ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
                      : "border-slate-300 bg-white hover:border-blue-400 dark:border-slate-700 dark:bg-slate-950"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="access_type"
                    value={option.value}
                    checked={selected}
                    onChange={() =>
                      setAccessType(
                        option.value
                      )
                    }
                    required
                    className="mt-1"
                  />

                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {option.label}
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {option.description}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Access type is selected when the set is created.
        </p>
      </div>

      {/* Set Number */}

      <div>
        <label
          htmlFor="set_number_display"
          className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
        >
          Set Number
        </label>

        <input
          id="set_number_display"
          type="number"
          value={nextSetNumber}
          readOnly
          aria-readonly="true"
          className="
            mt-2
            w-full
            rounded-xl
            border
            border-slate-300
            bg-slate-50
            px-4
            py-3
            text-sm
            font-semibold
            text-slate-700
            outline-none
            dark:border-slate-700
            dark:bg-slate-900
            dark:text-slate-200
          "
        />

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Automatically determined for the selected category.
        </p>
      </div>
    </>
  );
}