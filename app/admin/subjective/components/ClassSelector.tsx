"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CLASS_ORDER = [
  "class-9",
  "class-10",
  "class-11",
  "class-12",
];

const CLASS_LABELS: Record<string, string> = {
  "class-9": "Class IX",
  "class-10": "Class X",
  "class-11": "Class XI",
  "class-12": "Class XII",
};

type ClassSelectorProps = {
  selectedClass: string;
};

export default function ClassSelector({
  selectedClass,
}: ClassSelectorProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  function handleClassSelect(classSlug: string) {
    setIsOpen(false);

    router.push(
      `/admin/subjective?class=${classSlug}`
    );
  }

  return (
    <div className="relative w-full sm:w-64">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
        Select Class
      </p>

      {/* -------------------------------------------------
          Dropdown Trigger
         ------------------------------------------------- */}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="
          flex
          w-full
          items-center
          justify-between
          rounded-xl
          border
          border-slate-200
          bg-white
          px-4
          py-3
          text-sm
          font-semibold
          text-slate-800
          shadow-sm
          transition
          hover:border-blue-300
          hover:shadow
          dark:border-slate-700
          dark:bg-slate-900
          dark:text-slate-100
          dark:hover:border-slate-600
        "
      >
        <span>
          {CLASS_LABELS[selectedClass] ??
            "Select Class"}
        </span>

        <span
          className={`
            ml-3
            text-slate-400
            transition-transform
            ${
              isOpen
                ? "rotate-180"
                : ""
            }
          `}
        >
          ▾
        </span>
      </button>

      {/* -------------------------------------------------
          Dropdown Menu
         ------------------------------------------------- */}

      {isOpen && (
        <div
          role="listbox"
          className="
            absolute
            left-0
            right-0
            z-50
            mt-2
            overflow-hidden
            rounded-xl
            border
            border-slate-200
            bg-white
            p-1
            shadow-lg
            dark:border-slate-700
            dark:bg-slate-900
          "
        >
          {CLASS_ORDER.map(
            (classSlug) => {
              const isSelected =
                selectedClass ===
                classSlug;

              return (
                <button
                  key={classSlug}
                  type="button"
                  role="option"
                  aria-selected={
                    isSelected
                  }
                  onClick={() =>
                    handleClassSelect(
                      classSlug
                    )
                  }
                  className={`
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-lg
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    font-medium
                    transition
                    ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                        : "text-slate-700 hover:bg-slate-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                    }
                  `}
                >
                  <span>
                    {
                      CLASS_LABELS[
                        classSlug
                      ]
                    }
                  </span>

                  {isSelected && (
                    <span className="text-sm font-bold">
                      ✓
                    </span>
                  )}
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}