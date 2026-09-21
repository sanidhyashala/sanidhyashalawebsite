"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createAdminMcqSet } from "@/app/lib/admin/mcq-bank/mcq-set.actions";


/* =========================================================
 * Curriculum Types
 * ========================================================= */

type AdminMcqCurriculumChapter = {
  id: string;
  display_name: string;
  description: string | null;
  sequence_order: number | null;
};


type AdminMcqCurriculumClass = {
  id: string;
  name: string;
  slug: string;
  session: string | null;
  curriculum_version_id: string;
  chapters: AdminMcqCurriculumChapter[];
};


/* =========================================================
 * Access Type
 * ========================================================= */

type McqAccessType = "FREE" | "PREMIUM";


/* =========================================================
 * Component
 * ========================================================= */

export default function McqSetCreateForm({
  curriculumClasses,
}: {
  curriculumClasses: AdminMcqCurriculumClass[];
}) {
  const router = useRouter();


  /* =========================================================
   * Basic State
   * ========================================================= */

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [durationMinutes, setDurationMinutes] =
    useState("");

  const [accessType, setAccessType] =
    useState<McqAccessType>("FREE");

  const [passingPercentage, setPassingPercentage] =
    useState("");

  const [shuffleQuestions, setShuffleQuestions] =
    useState(false);

  const [shuffleOptions, setShuffleOptions] =
    useState(false);


  /* =========================================================
   * Curriculum Selection
   * ========================================================= */

  const [selectedClassSlug, setSelectedClassSlug] =
    useState("");

  const [curriculumNodeId, setCurriculumNodeId] =
    useState("");


  /* =========================================================
   * Submission State
   * ========================================================= */

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  /* =========================================================
   * Access → Maximum Attempts
   *
   * These values mirror the DB authority:
   *
   * FREE    → 3
   * PREMIUM → 7
   *
   * The value is never manually editable.
   * ========================================================= */

  const maxAttempts =
    accessType === "PREMIUM"
      ? 7
      : 3;


  /* =========================================================
   * Selected Class
   * ========================================================= */

  const selectedClass =
    useMemo(
      () =>
        curriculumClasses.find(
          (item) =>
            item.slug ===
            selectedClassSlug
        ) ?? null,
      [
        curriculumClasses,
        selectedClassSlug,
      ]
    );


  /* =========================================================
   * Available Chapters
   * ========================================================= */

  const availableChapters =
    selectedClass?.chapters ?? [];


  /* =========================================================
   * Selected Chapter
   * ========================================================= */

  const selectedChapter =
    useMemo(
      () =>
        availableChapters.find(
          (chapter) =>
            chapter.id ===
            curriculumNodeId
        ) ?? null,
      [
        availableChapters,
        curriculumNodeId,
      ]
    );


  /* =========================================================
   * Class Change
   * ========================================================= */

  function handleClassChange(
    value: string
  ) {
    setSelectedClassSlug(
      value
    );

    /*
     * Changing the class invalidates
     * the previously selected chapter.
     */

    setCurriculumNodeId("");

    setError(null);
  }


  /* =========================================================
   * Chapter Change
   * ========================================================= */

  function handleChapterChange(
    value: string
  ) {
    setCurriculumNodeId(
      value
    );

    setError(null);
  }


  /* =========================================================
   * Access Type Change
   * ========================================================= */

  function handleAccessTypeChange(
    value: McqAccessType
  ) {
    setAccessType(value);

    setError(null);
  }


  /* =========================================================
   * Submit
   * ========================================================= */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    setIsSubmitting(true);

    try {

      /*
       * Curriculum validation
       */

      if (!selectedClass) {
        throw new Error(
          "Please select a class."
        );
      }

      if (!curriculumNodeId) {
        throw new Error(
          "Please select a chapter."
        );
      }


      /*
       * Build FormData from the actual form.
       *
       * The server action receives:
       *
       * access_type
       * curriculum_node_id
       * max_attempts
       *
       * The database remains the final authority
       * for the FREE/PREMIUM attempt rule.
       */

      const formData =
        new FormData(
          event.currentTarget
        );


      /*
       * Explicitly ensure the selected access
       * type and DB-derived attempt value are sent.
       */

      formData.set(
        "access_type",
        accessType
      );

      formData.set(
        "max_attempts",
        String(maxAttempts)
      );


      /*
       * Send exact FormData expected
       * by createAdminMcqSet().
       */

      const result =
        await createAdminMcqSet(
          formData
        );


      /*
       * Server-side validation / database error.
       */

      if (!result.success) {
        throw new Error(
          result.message ||
            "Failed to create MCQ Set."
        );
      }


      /*
       * Successful creation must return
       * the newly created Set.
       */

      if (!result.set) {
        throw new Error(
          "MCQ Set was created, but no Set information was returned."
        );
      }


      /*
       * Open the newly created Set.
       */

      router.push(
        `/admin/mcq-bank/sets/${result.set.resourceId}`
      );

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the MCQ Set."
      );

      setIsSubmitting(false);
    }
  }


  /* =========================================================
   * UI
   * ========================================================= */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >

      {/* =================================================
       * Basic Information
       * ================================================= */}

      <section
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-sm
          dark:border-slate-800
          dark:bg-slate-900
        "
      >

        <div className="mb-6">

          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-slate-500
            "
          >
            Set Information
          </p>

          <h2
            className="
              mt-2
              text-lg
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            Basic Details
          </h2>

        </div>


        {/* =================================================
         * Title
         * ================================================= */}

        <div>

          <label
            htmlFor="title"
            className="
              text-sm
              font-semibold
              text-slate-800
              dark:text-slate-200
            "
          >
            Set Title
          </label>


          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value
              )
            }
            placeholder="e.g. Probability — MCQ Set"
            disabled={isSubmitting}
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              text-sm
              text-slate-900
              outline-none
              transition
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
              disabled:cursor-not-allowed
              disabled:opacity-60
              dark:border-slate-700
              dark:bg-slate-950
              dark:text-white
              dark:focus:ring-blue-950
            "
            required
          />


          <p
            className="
              mt-2
              text-xs
              leading-5
              text-slate-500
            "
          >
            Set number is assigned automatically
            chapter-wise. You do not need to enter
            the Set Number manually.
          </p>

        </div>


        {/* =================================================
         * Description
         * ================================================= */}

        <div className="mt-5">

          <label
            htmlFor="description"
            className="
              text-sm
              font-semibold
              text-slate-800
              dark:text-slate-200
            "
          >
            Description
          </label>


          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Optional description for this MCQ set..."
            rows={4}
            disabled={isSubmitting}
            className="
              mt-2
              w-full
              resize-none
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              text-sm
              leading-6
              text-slate-900
              outline-none
              transition
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
              disabled:cursor-not-allowed
              disabled:opacity-60
              dark:border-slate-700
              dark:bg-slate-950
              dark:text-white
              dark:focus:ring-blue-950
            "
          />

        </div>


        {/* =================================================
         * Class
         * ================================================= */}

        <div className="mt-5">

          <label
            htmlFor="class_slug"
            className="
              text-sm
              font-semibold
              text-slate-800
              dark:text-slate-200
            "
          >
            Class
          </label>


          <select
            id="class_slug"
            value={selectedClassSlug}
            onChange={(event) =>
              handleClassChange(
                event.target.value
              )
            }
            disabled={
              isSubmitting ||
              curriculumClasses.length === 0
            }
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              text-sm
              text-slate-900
              outline-none
              transition
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
              disabled:cursor-not-allowed
              disabled:opacity-60
              dark:border-slate-700
              dark:bg-slate-950
              dark:text-white
              dark:focus:border-blue-500
              dark:focus:ring-blue-950
            "
            required
          >

            <option value="">
              Select class
            </option>


            {curriculumClasses.map(
              (item) => (
                <option
                  key={
                    item.id
                  }
                  value={
                    item.slug
                  }
                >
                  {item.name}
                  {item.session
                    ? ` — ${item.session}`
                    : ""}
                </option>
              )
            )}

          </select>


          <p
            className="
              mt-2
              text-xs
              leading-5
              text-slate-500
            "
          >
            Select the class first. Only chapters
            belonging to that class will appear
            below.
          </p>

        </div>


        {/* =================================================
         * Chapter
         * ================================================= */}

        <div className="mt-5">

          <label
            htmlFor="curriculumNodeId"
            className="
              text-sm
              font-semibold
              text-slate-800
              dark:text-slate-200
            "
          >
            Chapter
          </label>


          <select
            id="curriculumNodeId"
            name="curriculum_node_id"
            value={curriculumNodeId}
            onChange={(event) =>
              handleChapterChange(
                event.target.value
              )
            }
            disabled={
              isSubmitting ||
              !selectedClass
            }
            required
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              text-sm
              text-slate-900
              outline-none
              transition
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
              disabled:cursor-not-allowed
              disabled:opacity-60
              dark:border-slate-700
              dark:bg-slate-950
              dark:text-white
              dark:focus:border-blue-500
              dark:focus:ring-blue-950
            "
          >

            <option value="">
              {selectedClass
                ? "Select a chapter"
                : "Select class first"}
            </option>


            {availableChapters.map(
              (chapter) => (
                <option
                  key={
                    chapter.id
                  }
                  value={
                    chapter.id
                  }
                >
                  Chapter{" "}
                  {chapter.sequence_order ??
                    "—"}{" "}
                  —{" "}
                  {
                    chapter.display_name
                  }
                </option>
              )
            )}

          </select>


          {selectedClass &&
            availableChapters.length ===
              0 && (
              <p
                className="
                  mt-2
                  text-xs
                  text-red-600
                  dark:text-red-400
                "
              >
                No active chapters are available
                for {selectedClass.name}.
              </p>
            )}

        </div>


        {/* =================================================
         * Curriculum Mapping Preview
         * ================================================= */}

        {selectedClass &&
          selectedChapter && (
            <div
              className="
                mt-5
                rounded-2xl
                border
                border-blue-100
                bg-blue-50
                p-4
                dark:border-blue-900/50
                dark:bg-blue-950/20
              "
            >

              <p
                className="
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-wider
                  text-blue-700
                  dark:text-blue-300
                "
              >
                Curriculum Mapping
              </p>


              <p
                className="
                  mt-2
                  text-sm
                  font-semibold
                  text-blue-900
                  dark:text-blue-200
                "
              >
                {selectedClass.name}
                {" · "}
                {selectedChapter.display_name}
              </p>


              <p
                className="
                  mt-1
                  text-xs
                  text-blue-700
                  dark:text-blue-400
                "
              >
                Session:{" "}
                {selectedClass.session ??
                  "—"}
              </p>


              <p
                className="
                  mt-2
                  text-xs
                  font-medium
                  text-blue-700
                  dark:text-blue-400
                "
              >
                Set Number:{" "}
                <span className="font-bold">
                  Assigned automatically
                </span>
              </p>

            </div>
          )}

      </section>


      {/* =================================================
       * Access & Test Configuration
       * ================================================= */}

      <section
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-sm
          dark:border-slate-800
          dark:bg-slate-900
        "
      >

        <div className="mb-6">

          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-slate-500
            "
          >
            Test Configuration
          </p>

          <h2
            className="
              mt-2
              text-lg
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            Assessment Settings
          </h2>

        </div>


        {/* =================================================
         * Access Type
         * ================================================= */}

        <div>

          <p
            className="
              text-sm
              font-semibold
              text-slate-800
              dark:text-slate-200
            "
          >
            Access Type
          </p>


          <div
            className="
              mt-3
              grid
              gap-3
              sm:grid-cols-2
            "
          >

            {/* FREE */}

            <label
              className={`
                cursor-pointer
                rounded-2xl
                border
                p-4
                transition
                ${
                  accessType === "FREE"
                    ? `
                      border-emerald-400
                      bg-emerald-50
                      ring-2
                      ring-emerald-100
                      dark:border-emerald-700
                      dark:bg-emerald-950/30
                      dark:ring-emerald-900/40
                    `
                    : `
                      border-slate-200
                      bg-white
                      hover:border-slate-300
                      dark:border-slate-700
                      dark:bg-slate-950
                      dark:hover:border-slate-600
                    `
                }
              `}
            >

              <div className="flex items-start gap-3">

                <input
                  type="radio"
                  name="access_type"
                  value="FREE"
                  checked={
                    accessType === "FREE"
                  }
                  onChange={() =>
                    handleAccessTypeChange(
                      "FREE"
                    )
                  }
                  disabled={isSubmitting}
                  className="
                    mt-1
                    h-4
                    w-4
                  "
                />


                <span className="min-w-0">

                  <span
                    className="
                      block
                      text-sm
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    FREE
                  </span>


                  <span
                    className="
                      mt-1
                      block
                      text-xs
                      leading-5
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Available without a paid
                    chapter or subject entitlement.
                  </span>

                </span>

              </div>

            </label>


            {/* PREMIUM */}

            <label
              className={`
                cursor-pointer
                rounded-2xl
                border
                p-4
                transition
                ${
                  accessType === "PREMIUM"
                    ? `
                      border-amber-400
                      bg-amber-50
                      ring-2
                      ring-amber-100
                      dark:border-amber-700
                      dark:bg-amber-950/30
                      dark:ring-amber-900/40
                    `
                    : `
                      border-slate-200
                      bg-white
                      hover:border-slate-300
                      dark:border-slate-700
                      dark:bg-slate-950
                      dark:hover:border-slate-600
                    `
                }
              `}
            >

              <div className="flex items-start gap-3">

                <input
                  type="radio"
                  name="access_type"
                  value="PREMIUM"
                  checked={
                    accessType === "PREMIUM"
                  }
                  onChange={() =>
                    handleAccessTypeChange(
                      "PREMIUM"
                    )
                  }
                  disabled={isSubmitting}
                  className="
                    mt-1
                    h-4
                    w-4
                  "
                />


                <span className="min-w-0">

                  <span
                    className="
                      block
                      text-sm
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    PREMIUM
                  </span>


                  <span
                    className="
                      mt-1
                      block
                      text-xs
                      leading-5
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Available through the relevant
                    chapter or subject entitlement.
                  </span>

                </span>

              </div>

            </label>

          </div>

        </div>


        {/* =================================================
         * Access Type Summary
         * ================================================= */}

        <div
          className="
            mt-5
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            p-4
            dark:border-slate-700
            dark:bg-slate-950
          "
        >

          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            <div>

              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-slate-500
                "
              >
                Maximum Attempts
              </p>


              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-slate-900
                  dark:text-white
                "
              >
                {accessType === "FREE"
                  ? "FREE access"
                  : "PREMIUM access"}
              </p>

            </div>


            <div
              className="
                flex
                items-baseline
                gap-2
              "
            >

              <span
                className="
                  text-2xl
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                {maxAttempts}
              </span>


              <span
                className="
                  text-xs
                  font-medium
                  text-slate-500
                "
              >
                attempts
              </span>

            </div>

          </div>


          <p
            className="
              mt-3
              text-xs
              leading-5
              text-slate-500
              dark:text-slate-400
            "
          >
            Maximum attempts are determined
            automatically by the selected access type
            and are not manually editable.
          </p>

        </div>


        {/* =================================================
         * Duration / Passing
         * ================================================= */}

        <div
          className="
            mt-6
            grid
            gap-5
            sm:grid-cols-2
          "
        >

          {/* Duration */}

          <div>

            <label
              htmlFor="durationMinutes"
              className="
                text-sm
                font-semibold
                text-slate-800
                dark:text-slate-200
              "
            >
              Duration (minutes)
            </label>


            <input
              id="durationMinutes"
              name="duration_minutes"
              type="number"
              min="1"
              value={durationMinutes}
              onChange={(event) =>
                setDurationMinutes(
                  event.target.value
                )
              }
              placeholder="e.g. 20"
              disabled={isSubmitting}
              className="
                mt-2
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                text-sm
                text-slate-900
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
                disabled:cursor-not-allowed
                disabled:opacity-60
                dark:border-slate-700
                dark:bg-slate-950
                dark:text-white
              "
            />

          </div>


          {/* Passing Percentage */}

          <div>

            <label
              htmlFor="passingPercentage"
              className="
                text-sm
                font-semibold
                text-slate-800
                dark:text-slate-200
              "
            >
              Passing Percentage
            </label>


            <input
              id="passingPercentage"
              name="passing_percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={passingPercentage}
              onChange={(event) =>
                setPassingPercentage(
                  event.target.value
                )
              }
              placeholder="Optional"
              disabled={isSubmitting}
              className="
                mt-2
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                text-sm
                text-slate-900
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
                disabled:cursor-not-allowed
                disabled:opacity-60
                dark:border-slate-700
                dark:bg-slate-950
                dark:text-white
              "
            />

          </div>

        </div>


        {/* =================================================
         * Shuffle Settings
         * ================================================= */}

        <div className="mt-6 space-y-4">

          {/* Shuffle Questions */}

          <label className="flex items-start gap-3">

            <input
              type="checkbox"
              name="shuffle_questions"
              checked={shuffleQuestions}
              onChange={(event) =>
                setShuffleQuestions(
                  event.target.checked
                )
              }
              disabled={isSubmitting}
              className="
                mt-1
                h-4
                w-4
                rounded
                border-slate-300
              "
            />


            <span>

              <span
                className="
                  block
                  text-sm
                  font-semibold
                  text-slate-800
                  dark:text-slate-200
                "
              >
                Shuffle Questions
              </span>


              <span
                className="
                  mt-1
                  block
                  text-xs
                  leading-5
                  text-slate-500
                "
              >
                Questions may appear in a different
                order for each attempt.
              </span>

            </span>

          </label>


          {/* Shuffle Options */}

          <label className="flex items-start gap-3">

            <input
              type="checkbox"
              name="shuffle_options"
              checked={shuffleOptions}
              onChange={(event) =>
                setShuffleOptions(
                  event.target.checked
                )
              }
              disabled={isSubmitting}
              className="
                mt-1
                h-4
                w-4
                rounded
                border-slate-300
              "
            />


            <span>

              <span
                className="
                  block
                  text-sm
                  font-semibold
                  text-slate-800
                  dark:text-slate-200
                "
              >
                Shuffle Options
              </span>


              <span
                className="
                  mt-1
                  block
                  text-xs
                  leading-5
                  text-slate-500
                "
              >
                Answer options may appear in a
                different order.
              </span>

            </span>

          </label>

        </div>

      </section>


      {/* =================================================
       * Publishing Architecture Note
       * ================================================= */}

      <section
        className="
          rounded-2xl
          border
          border-blue-200
          bg-blue-50
          p-5
          dark:border-blue-900/50
          dark:bg-blue-950/20
        "
      >

        <p
          className="
            text-sm
            font-semibold
            text-blue-900
            dark:text-blue-300
          "
        >
          Content Creation
        </p>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-blue-800
            dark:text-blue-400
          "
        >
          This Set will be created as a DRAFT.
          Add and review the questions first, then
          publish the MCQ Set from the Content Creation
          workflow.
        </p>

      </section>


      {/* =================================================
       * Error
       * ================================================= */}

      {error && (
        <div
          className="
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-4
            text-sm
            leading-6
            text-red-700
            dark:border-red-900/50
            dark:bg-red-950/20
            dark:text-red-400
          "
        >
          {error}
        </div>
      )}


      {/* =================================================
       * Actions
       * ================================================= */}

      <div
        className="
          flex
          flex-col-reverse
          gap-3
          sm:flex-row
          sm:justify-end
        "
      >

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/mcq-bank"
            )
          }
          disabled={isSubmitting}
          className="
            rounded-xl
            border
            border-slate-200
            bg-white
            px-5
            py-3
            text-sm
            font-semibold
            text-slate-700
            transition
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-50
            dark:border-slate-700
            dark:bg-slate-900
            dark:text-slate-300
            dark:hover:bg-slate-800
          "
        >
          Cancel
        </button>


        <button
          type="submit"
          disabled={
            isSubmitting ||
            curriculumClasses.length === 0
          }
          className="
            rounded-xl
            bg-slate-900
            px-5
            py-3
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-slate-800
            disabled:cursor-not-allowed
            disabled:opacity-50
            dark:bg-white
            dark:text-slate-900
            dark:hover:bg-slate-200
          "
        >
          {isSubmitting
            ? "Creating Set..."
            : "Create MCQ Set"}
        </button>

      </div>

    </form>
  );
}