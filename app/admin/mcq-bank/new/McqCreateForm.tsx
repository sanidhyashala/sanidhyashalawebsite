"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createAdminMcq } from "@/app/lib/admin/mcq-bank/mcq-bank.actions";
import MathTextPreview from "../components/MathTextPreview";

/* =========================================================
 * Curriculum Types
 * ========================================================= */

type CurriculumChapter = {
  id: string;
  display_name: string;
  description: string | null;
  sequence_order: number | null;
};

type CurriculumBranch = {
  id: string;
  display_name: string;
  description: string | null;
  sequence_order: number | null;
  chapters: CurriculumChapter[];
};

type CurriculumSubject = {
  id: string;
  display_name: string;
  description: string | null;
  sequence_order: number | null;
  chapters: CurriculumChapter[];
  branches: CurriculumBranch[];
};

type CurriculumClass = {
  id: string;
  name: string;
  slug: string;
  session: string | null;
  curriculum_version_id: string;
  chapters: CurriculumChapter[];
  subjects: CurriculumSubject[];
};

interface Props {
  chapters: CurriculumClass[];
}

/* =========================================================
 * MCQ Options
 * ========================================================= */

type OptionKey = "A" | "B" | "C" | "D";

const OPTIONS: {
  key: OptionKey;
  label: string;
}[] = [
  { key: "A", label: "Option A" },
  { key: "B", label: "Option B" },
  { key: "C", label: "Option C" },
  { key: "D", label: "Option D" },
];

/* =========================================================
 * Component
 * ========================================================= */

export default function McqCreateForm({ chapters }: Props) {
  const router = useRouter();

  /* =========================================================
   * Form State
   * ========================================================= */

  const [questionText, setQuestionText] = useState("");

  const [optionTexts, setOptionTexts] = useState<Record<OptionKey, string>>({
    A: "",
    B: "",
    C: "",
    D: "",
  });

  const [correctOption, setCorrectOption] = useState<OptionKey | "">("");

  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD" | "">("");

  const [sourceType, setSourceType] = useState<"ORIGINAL" | "PYQ" | "PRACTICE">("ORIGINAL");

  const [sourceReference, setSourceReference] = useState("");

  const [marks, setMarks] = useState("1");

  const [estimatedTimeMinutes, setEstimatedTimeMinutes] = useState("1");

  /* ---------------------------------------------------------
   * Selected Curriculum
   * --------------------------------------------------------- */

  const [selectedClassSlug, setSelectedClassSlug] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [curriculumNodeId, setCurriculumNodeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* =========================================================
   * Selected Curriculum Objects
   * ========================================================= */

  const selectedClass = useMemo(
    () => chapters.find((item) => item.slug === selectedClassSlug) ?? null,
    [chapters, selectedClassSlug]
  );

  const selectedSubject = useMemo(
    () => selectedClass?.subjects?.find((subject) => subject.id === selectedSubjectId) ?? null,
    [selectedClass, selectedSubjectId]
  );

  const selectedBranch = useMemo(
    () => selectedSubject?.branches?.find((branch) => branch.id === selectedBranchId) ?? null,
    [selectedSubject, selectedBranchId]
  );

  const availableSubjects = selectedClass?.subjects ?? [];
  const availableBranches = selectedSubject?.branches ?? [];

  const availableChapters = useMemo(() => {
    if (!selectedSubject) {
      return [];
    }
    if (availableBranches.length > 0) {
      return selectedBranch?.chapters ?? [];
    }
    return selectedSubject.chapters ?? [];
  }, [selectedSubject, selectedBranch, availableBranches.length]);

  /* =========================================================
   * Option Update
   * ========================================================= */

  function updateOption(key: OptionKey, value: string) {
    setOptionTexts((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /* =========================================================
   * Class Change
   * ========================================================= */

  function handleClassChange(value: string) {
    setSelectedClassSlug(value);
    // Changing class invalidates the entire lower curriculum selection.
    setSelectedSubjectId("");
    setSelectedBranchId("");
    setCurriculumNodeId("");
    setError(null);
    setMessage(null);
  }

  /* =========================================================
   * Subject Change
   * ========================================================= */

  function handleSubjectChange(value: string) {
    setSelectedSubjectId(value);
    // Changing subject invalidates branch and chapter.
    setSelectedBranchId("");
    setCurriculumNodeId("");
    setError(null);
    setMessage(null);
  }

  /* =========================================================
   * Branch Change
   * ========================================================= */

  function handleBranchChange(value: string) {
    setSelectedBranchId(value);
    // Changing branch invalidates the previously selected chapter.
    setCurriculumNodeId("");
    setError(null);
    setMessage(null);
  }

  /* =========================================================
   * Chapter Change
   * ========================================================= */

  function handleChapterChange(value: string) {
    setCurriculumNodeId(value);
    setError(null);
    setMessage(null);
  }

  /* =========================================================
   * Submit
   * ========================================================= */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setMessage(null);
    setError(null);

    /* -------------------------------------------------------
     * Question validation
     * ------------------------------------------------------- */
    const trimmedQuestion = questionText.trim();

    if (!trimmedQuestion) {
      setError("Please enter the question.");
      return;
    }

    /* -------------------------------------------------------
     * Class validation
     * ------------------------------------------------------- */
    if (!selectedClassSlug) {
      setError("Please select a class.");
      return;
    }

    /* -------------------------------------------------------
     * Subject validation
     * ------------------------------------------------------- */
    if (!selectedSubjectId || !selectedSubject) {
      setError("Please select a subject.");
      return;
    }

    /* -------------------------------------------------------
     * Branch validation
     * ------------------------------------------------------- */
    if (availableBranches.length > 0 && !selectedBranchId) {
      setError("Please select a branch.");
      return;
    }

    /* -------------------------------------------------------
     * Chapter validation
     * ------------------------------------------------------- */
    if (!curriculumNodeId) {
      setError("Please select a chapter.");
      return;
    }

    /* -------------------------------------------------------
     * Correct answer validation
     * ------------------------------------------------------- */
    if (!correctOption) {
      setError("Please select the correct option.");
      return;
    }

    /* -------------------------------------------------------
     * Marks validation
     * ------------------------------------------------------- */
    const parsedMarks = Number(marks);

    if (!Number.isFinite(parsedMarks) || parsedMarks <= 0) {
      setError("Marks must be greater than 0.");
      return;
    }

    /* -------------------------------------------------------
     * Estimated time validation
     * ------------------------------------------------------- */
    const parsedTime = Number(estimatedTimeMinutes);

    if (!Number.isInteger(parsedTime) || parsedTime < 0) {
      setError("Estimated time must be a valid non-negative integer.");
      return;
    }

    /* -------------------------------------------------------
     * Option validation
     * ------------------------------------------------------- */
    for (const option of OPTIONS) {
      if (!optionTexts[option.key].trim()) {
        setError(`${option.label} cannot be empty.`);
        return;
      }
    }

    setSaving(true);

    try {
      /* -----------------------------------------------------
       * Create MCQ
       * ----------------------------------------------------- */
      const result = await createAdminMcq({
        questionText: trimmedQuestion,
        sourceType,
        sourceReference: sourceReference.trim(),
        difficulty: difficulty || undefined,
        marks: parsedMarks,
        estimatedTimeMinutes: parsedTime,
        curriculumNodeId,
        options: OPTIONS.map((option, index) => ({
          optionKey: option.key,
          /*
           * Preserve original LaTeX.
           * Nothing is converted here.
           */
          optionText: optionTexts[option.key].trim(),
          displayOrder: index + 1,
          isCorrect: correctOption === option.key,
        })),
      });

      if (!result.success) {
        throw new Error("MCQ creation failed.");
      }

      /* -----------------------------------------------------
       * Success
       * ----------------------------------------------------- */
      setMessage("MCQ created successfully. It is currently in DRAFT status.");

      /* -----------------------------------------------------
       * Reset form
       * ----------------------------------------------------- */
      setQuestionText("");
      setOptionTexts({
        A: "",
        B: "",
        C: "",
        D: "",
      });
      setCorrectOption("");
      setDifficulty("");
      setSourceType("ORIGINAL");
      setSourceReference("");
      setMarks("1");
      setEstimatedTimeMinutes("1");

      /*
       * Keep the selected class.
       * This makes repeated MCQ entry into the same class much faster.
       */
      setCurriculumNodeId("");

      /* -----------------------------------------------------
       * Refresh server-rendered data
       * ----------------------------------------------------- */
      router.refresh();

    } catch (submitError) {
      console.error("MCQ creation failed:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "MCQ creation failed. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
   * UI
   * ========================================================= */

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* =================================================
       * Question
       * ================================================= */}
      <div>
        <label
          htmlFor="question_text"
          className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
        >
          Question
        </label>

        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Plain text and LaTeX are supported. Example: <code>$x^2 + y^2 = z^2$</code>
        </p>

        <textarea
          id="question_text"
          value={questionText}
          onChange={(event) => setQuestionText(event.target.value)}
          rows={5}
          placeholder="Enter the MCQ question. Example: If $x=2$, find $x^2+3x$."
          disabled={saving}
          className="mt-3 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-950"
        />

        {questionText.trim() && (
          <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              Mathematical Preview
            </p>
            <MathTextPreview value={questionText} />
          </div>
        )}
      </div>

      {/* =================================================
       * Options
       * ================================================= */}
      <div>
        <div className="mb-3">
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
            Answer Options
          </label>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Enter all four options. You can paste LaTeX directly into any option.
          </p>
        </div>

        <div className="space-y-3">
          {OPTIONS.map((option) => {
            const isCorrect = correctOption === option.key;

            return (
              <div
                key={option.key}
                className={`rounded-2xl border p-4 transition ${
                  isCorrect
                    ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                }`}
              >
                <div className="flex gap-3">
                  <div className="pt-2">
                    <input
                      type="radio"
                      name="correct_option"
                      value={option.key}
                      checked={isCorrect}
                      onChange={() => setCorrectOption(option.key)}
                      disabled={saving}
                      className="h-4 w-4"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={`option-${option.key}`}
                      className="text-sm font-semibold text-slate-800 dark:text-slate-200"
                    >
                      {option.label}
                    </label>

                    <input
                      id={`option-${option.key}`}
                      type="text"
                      value={optionTexts[option.key]}
                      onChange={(event) => updateOption(option.key, event.target.value)}
                      placeholder={`Enter option ${option.key}... Example: $\\frac{3}{5}$`}
                      disabled={saving}
                      className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />

                    {optionTexts[option.key].trim() && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Preview
                        </p>
                        <MathTextPreview value={optionTexts[option.key]} />
                      </div>
                    )}

                    {isCorrect && (
                      <p className="mt-2 text-xs font-semibold text-green-700 dark:text-green-400">
                        Correct answer
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =================================================
       * Difficulty + Marks + Time
       * ================================================= */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Difficulty */}
        <div>
          <label
            htmlFor="difficulty"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Difficulty
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as "EASY" | "MEDIUM" | "HARD" | "")
            }
            disabled={saving}
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">Select</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        {/* Marks */}
        <div>
          <label
            htmlFor="marks"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Marks
          </label>
          <input
            id="marks"
            type="number"
            min="0.5"
            step="0.5"
            value={marks}
            onChange={(event) => setMarks(event.target.value)}
            disabled={saving}
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        {/* Estimated Time */}
        <div>
          <label
            htmlFor="estimated_time_minutes"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Time (minutes)
          </label>
          <input
            id="estimated_time_minutes"
            type="number"
            min="0"
            step="1"
            value={estimatedTimeMinutes}
            onChange={(event) => setEstimatedTimeMinutes(event.target.value)}
            disabled={saving}
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
      </div>

      {/* =================================================
       * Source
       * ================================================= */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Source Type */}
        <div>
          <label
            htmlFor="source_type"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Source Type
          </label>
          <select
            id="source_type"
            value={sourceType}
            onChange={(event) =>
              setSourceType(event.target.value as "ORIGINAL" | "PYQ" | "PRACTICE")
            }
            disabled={saving}
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="ORIGINAL">Original</option>
            <option value="PYQ">Previous Year Question</option>
            <option value="PRACTICE">Practice</option>
          </select>
        </div>

        {/* Source Reference */}
        <div>
          <label
            htmlFor="source_reference"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Source Reference
            <span className="ml-1 font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="source_reference"
            type="text"
            value={sourceReference}
            onChange={(event) => setSourceReference(event.target.value)}
            placeholder="e.g. CBSE 2025"
            disabled={saving}
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
      </div>

      {/* =================================================
       * Curriculum
       * ================================================= */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Curriculum Mapping
          </p>
          <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
            Choose where this MCQ belongs
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Select the class first, then the subject. Science subjects can be further narrowed by branch before choosing the chapter.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Class */}
          <div>
            <label
              htmlFor="class_slug"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Class
            </label>
            <select
              id="class_slug"
              value={selectedClassSlug}
              onChange={(event) => handleClassChange(event.target.value)}
              disabled={saving}
              className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-950"
            >
              <option value="">Select class</option>
              {chapters.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label
              htmlFor="subject_id"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Subject
            </label>
            <select
              id="subject_id"
              value={selectedSubjectId}
              onChange={(event) => handleSubjectChange(event.target.value)}
              disabled={saving || !selectedClass}
              className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-950"
            >
              <option value="">
                {selectedClass ? "Select subject" : "Select class first"}
              </option>
              {availableSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.display_name}
                </option>
              ))}
            </select>
            {selectedClass && availableSubjects.length === 0 && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                No active subjects are available for this class.
              </p>
            )}
          </div>

          {/* Branch — only for subjects that have branches */}
          {selectedSubject && availableBranches.length > 0 && (
            <div>
              <label
                htmlFor="branch_id"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                Branch
              </label>
              <select
                id="branch_id"
                value={selectedBranchId}
                onChange={(event) => handleBranchChange(event.target.value)}
                disabled={saving}
                className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-950"
              >
                <option value="">Select branch</option>
                {availableBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.display_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Chapter */}
          <div>
            <label
              htmlFor="curriculum_node_id"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Chapter
            </label>
            <select
              id="curriculum_node_id"
              value={curriculumNodeId}
              onChange={(event) => handleChapterChange(event.target.value)}
              disabled={
                saving ||
                !selectedSubject ||
                (availableBranches.length > 0 && !selectedBranch)
              }
              className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-950"
            >
              <option value="">
                {!selectedClass
                  ? "Select class first"
                  : !selectedSubject
                  ? "Select subject first"
                  : availableBranches.length > 0 && !selectedBranch
                  ? "Select branch first"
                  : "Select chapter"}
              </option>
              {availableChapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  Chapter {chapter.sequence_order ?? "—"} — {chapter.display_name}
                </option>
              ))}
            </select>
            {selectedSubject &&
              (availableBranches.length === 0 || selectedBranch) &&
              availableChapters.length === 0 && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  No active chapters are available for this selection.
                </p>
              )}
          </div>
        </div>
      </div>

      {/* =================================================
       * Selected Curriculum Information
       * ================================================= */}
      {selectedClass && selectedSubject && curriculumNodeId && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            Curriculum Mapping
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-blue-900 dark:text-blue-200">
            {selectedClass.name}
            {" · "}
            {selectedSubject.display_name}
            {selectedBranch && (
              <>
                {" · "}
                {selectedBranch.display_name}
              </>
            )}
            {" · "}
            {
              availableChapters.find((chapter) => chapter.id === curriculumNodeId)
                ?.display_name
            }
          </p>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
            Session: {selectedClass.session ?? "—"}
          </p>
        </div>
      )}

      {/* =================================================
       * Status Information
       * ================================================= */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
          Draft workflow
        </p>
        <p className="mt-1 text-sm leading-6 text-blue-800 dark:text-blue-400">
          New MCQs are created as <strong>DRAFT</strong>. They will not appear in
          student-facing tests until we implement the publishing workflow.
        </p>
      </div>

      {/* =================================================
       * Messages
       * ================================================= */}
      {message && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* =================================================
       * Submit
       * ================================================= */}
      <div className="flex justify-end border-t border-slate-200 pt-6 dark:border-slate-800">
        <button
          type="submit"
          disabled={
            saving ||
            chapters.length === 0 ||
            !selectedClass ||
            availableChapters.length === 0
          }
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating MCQ...
            </>
          ) : (
            "Create MCQ"
          )}
        </button>
      </div>
    </form>
  );
}