"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

import {
  bulkCreateAdminMcqs,
  BulkMcqInput,
} from "@/app/lib/admin/mcq-bank/mcq-bulk-import.actions";
import ExcelMcqPreview from "./ExcelMcqPreview";

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
 * Excel Types
 * ========================================================= */

type ExcelRow = Record<string, unknown>;

type ExcelValidationIssue = {
  row: number;
  field: string;
  message: string;
};

/* =========================================================
 * Required Excel Columns
 * ========================================================= */

const REQUIRED_EXCEL_COLUMNS = [
  "question_text",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_option",
] as const;

/* =========================================================
 * Helpers
 * ========================================================= */

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function textValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function optionalText(value: unknown): string | undefined {
  const valueText = textValue(value);
  return valueText || undefined;
}

function parseNumber(
  value: unknown,
  fieldName: string,
  rowNumber: number
): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const parsed =
    typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed)) {
    throw new Error(
      `Excel row ${rowNumber}: ${fieldName} must be a valid number.`
    );
  }
  return parsed;
}

function parseInteger(
  value: unknown,
  fieldName: string,
  rowNumber: number
): number | undefined {
  const parsed = parseNumber(value, fieldName, rowNumber);
  if (parsed === undefined) {
    return undefined;
  }
  if (!Number.isInteger(parsed)) {
    throw new Error(
      `Excel row ${rowNumber}: ${fieldName} must be a whole number.`
    );
  }
  return parsed;
}

function normalizeSourceType(
  value: unknown,
  rowNumber: number
): BulkMcqInput["sourceType"] {
  const sourceType = textValue(value).toUpperCase();
  if (!sourceType) {
    return "ORIGINAL";
  }
  if (
    sourceType !== "ORIGINAL" &&
    sourceType !== "PYQ" &&
    sourceType !== "PRACTICE"
  ) {
    throw new Error(
      `Excel row ${rowNumber}: source_type must be ORIGINAL, PYQ or PRACTICE.`
    );
  }
  return sourceType;
}

function normalizeDifficulty(
  value: unknown,
  rowNumber: number
): BulkMcqInput["difficulty"] {
  const difficulty = textValue(value).toUpperCase();
  if (!difficulty) {
    return undefined;
  }
  if (
    difficulty !== "EASY" &&
    difficulty !== "MEDIUM" &&
    difficulty !== "HARD"
  ) {
    throw new Error(
      `Excel row ${rowNumber}: difficulty must be EASY, MEDIUM or HARD.`
    );
  }
  return difficulty;
}

function normalizeCorrectOption(
  value: unknown,
  rowNumber: number
): "A" | "B" | "C" | "D" {
  const correctOption = textValue(value).toUpperCase();
  if (
    correctOption !== "A" &&
    correctOption !== "B" &&
    correctOption !== "C" &&
    correctOption !== "D"
  ) {
    throw new Error(
      `Excel row ${rowNumber}: correct_option must be A, B, C or D.`
    );
  }
  return correctOption;
}

/* =========================================================
 * Excel → BulkMcqInput
 * ========================================================= */

function parseExcelRows(
  rows: ExcelRow[]
): {
  questions: BulkMcqInput[];
  issues: ExcelValidationIssue[];
} {
  if (rows.length === 0) {
    return {
      questions: [],
      issues: [
        {
          row: 0,
          field: "worksheet",
          message: "The Excel sheet does not contain any MCQ rows.",
        },
      ],
    };
  }

  const questions: BulkMcqInput[] = [];
  const issues: ExcelValidationIssue[] = [];

  rows.forEach((row, index) => {
    /*
     * Excel row 1 is the header.
     * Therefore the first data row is Excel row 2.
     */
    const rowNumber = index + 2;

    try {
      const questionText = textValue(row.question_text);
      if (!questionText) {
        throw new Error("question_text is required.");
      }

      const optionA = textValue(row.option_a);
      const optionB = textValue(row.option_b);
      const optionC = textValue(row.option_c);
      const optionD = textValue(row.option_d);

      if (!optionA) {
        throw new Error("option_A is required.");
      }
      if (!optionB) {
        throw new Error("option_B is required.");
      }
      if (!optionC) {
        throw new Error("option_C is required.");
      }
      if (!optionD) {
        throw new Error("option_D is required.");
      }

      const correctOption = normalizeCorrectOption(
        row.correct_option,
        rowNumber
      );

      const marks = parseNumber(row.marks, "marks", rowNumber);
      if (marks !== undefined && marks <= 0) {
        throw new Error("marks must be greater than 0.");
      }

      const estimatedTimeMinutes = parseInteger(
        row.estimated_time_minutes,
        "estimated_time_minutes",
        rowNumber
      );
      if (
        estimatedTimeMinutes !== undefined &&
        estimatedTimeMinutes < 0
      ) {
        throw new Error("estimated_time_minutes cannot be negative.");
      }

      const question: BulkMcqInput = {
        questionText,
        sourceType: normalizeSourceType(row.source_type, rowNumber),
        sourceReference: optionalText(row.source_reference),
        difficulty: normalizeDifficulty(row.difficulty, rowNumber),
        marks,
        estimatedTimeMinutes,
        solutionText: optionalText(row.solution_text),
        mistakeInsight: optionalText(row.mistake_insight),
        options: [
          {
            optionKey: "A",
            optionText: optionA,
            displayOrder: 1,
            isCorrect: correctOption === "A",
          },
          {
            optionKey: "B",
            optionText: optionB,
            displayOrder: 2,
            isCorrect: correctOption === "B",
          },
          {
            optionKey: "C",
            optionText: optionC,
            displayOrder: 3,
            isCorrect: correctOption === "C",
          },
          {
            optionKey: "D",
            optionText: optionD,
            displayOrder: 4,
            isCorrect: correctOption === "D",
          },
        ],
      };
      questions.push(question);
    } catch (rowError) {
      const rawMessage =
        rowError instanceof Error ? rowError.message : "Invalid MCQ data.";

      /*
       * Our helper functions currently include
       * "Excel row X:" in their errors.
       * We remove that prefix because the UI
       * already displays the row number separately.
       */
      const message = rawMessage.replace(/^Excel row \d+:\s*/i, "");

      let field = "row";
      if (message.toLowerCase().includes("question_text")) {
        field = "question_text";
      } else if (message.toLowerCase().includes("option_a")) {
        field = "option_A";
      } else if (message.toLowerCase().includes("option_b")) {
        field = "option_B";
      } else if (message.toLowerCase().includes("option_c")) {
        field = "option_C";
      } else if (message.toLowerCase().includes("option_d")) {
        field = "option_D";
      } else if (message.toLowerCase().includes("correct_option")) {
        field = "correct_option";
      } else if (message.toLowerCase().includes("source_type")) {
        field = "source_type";
      } else if (message.toLowerCase().includes("difficulty")) {
        field = "difficulty";
      } else if (message.toLowerCase().includes("marks")) {
        field = "marks";
      } else if (message.toLowerCase().includes("estimated_time_minutes")) {
        field = "estimated_time_minutes";
      }

      issues.push({
        row: rowNumber,
        field,
        message,
      });
    }
  });

  return {
    questions,
    issues,
  };
}

/* =========================================================
 * Component
 * ========================================================= */

export default function BulkMcqImportForm({ chapters }: Props) {
  const [selectedClassSlug, setSelectedClassSlug] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [curriculumNodeId, setCurriculumNodeId] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [excelQuestions, setExcelQuestions] = useState<BulkMcqInput[] | null>(null);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [excelRowCount, setExcelRowCount] = useState(0);
  const [importMode, setImportMode] = useState<"JSON" | "EXCEL" | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [excelValidationIssues, setExcelValidationIssues] = useState<ExcelValidationIssue[]>([]);

  const selectedClass = useMemo(
    () => chapters.find((item) => item.slug === selectedClassSlug) ?? null,
    [chapters, selectedClassSlug]
  );
  const availableSubjects = selectedClass?.subjects ?? [];
  const selectedSubject = useMemo(
    () => selectedClass?.subjects?.find((subject) => subject.id === selectedSubjectId) ?? null,
    [selectedClass, selectedSubjectId]
  );
  const availableBranches = selectedSubject?.branches ?? [];
  const selectedBranch = useMemo(
    () => selectedSubject?.branches?.find((branch) => branch.id === selectedBranchId) ?? null,
    [selectedSubject, selectedBranchId]
  );
  const availableChapters = useMemo(() => {
    if (!selectedSubject) return [];
    if (availableBranches.length > 0) return selectedBranch?.chapters ?? [];
    return selectedSubject.chapters ?? [];
  }, [selectedSubject, selectedBranch, availableBranches.length]);

  /* =======================================================
   * Class Change
   * ======================================================= */
  function handleClassChange(value: string) {
    setSelectedClassSlug(value);
    setSelectedSubjectId("");
    setSelectedBranchId("");
    setCurriculumNodeId("");
    setMessage(null);
    setError(null);
  }

  /* =======================================================
   * Subject Change
   * ======================================================= */
  function handleSubjectChange(value: string) {
    setSelectedSubjectId(value);
    setSelectedBranchId("");
    setCurriculumNodeId("");
    setMessage(null);
    setError(null);
  }

  /* =======================================================
   * Branch Change
   * ======================================================= */
  function handleBranchChange(value: string) {
    setSelectedBranchId(value);
    setCurriculumNodeId("");
    setMessage(null);
    setError(null);
  }

  /* =======================================================
   * Chapter Change
   * ======================================================= */
  function handleChapterChange(value: string) {
    setCurriculumNodeId(value);
    setMessage(null);
    setError(null);
  }

  /* =======================================================
   * Clear Imported Data
   * ======================================================= */
  function clearImportedData() {
    setJsonText("");
    setExcelQuestions(null);
    setExcelFileName(null);
    setExcelRowCount(0);
    setImportMode(null);
    setExcelValidationIssues([]);
  }

  /* =======================================================
   * Example JSON
   * ======================================================= */
  function loadExample() {
    const example: BulkMcqInput[] = [
      {
        questionText: "Which of the following numbers is irrational?",
        sourceType: "ORIGINAL",
        sourceReference: "",
        difficulty: "EASY",
        marks: 1,
        estimatedTimeMinutes: 1,
        solutionText: "$\\sqrt{2}$ is irrational.",
        mistakeInsight: "Do not confuse a non-terminating irrational number with a terminating decimal.",
        options: [
          { optionKey: "A", optionText: "0.25", displayOrder: 1, isCorrect: false },
          { optionKey: "B", optionText: "$\\frac{3}{4}$", displayOrder: 2, isCorrect: false },
          { optionKey: "C", optionText: "$\\sqrt{2}$", displayOrder: 3, isCorrect: true },
          { optionKey: "D", optionText: "2", displayOrder: 4, isCorrect: false },
        ],
      },
    ];
    setJsonText(JSON.stringify(example, null, 2));
    setExcelQuestions(null);
    setExcelFileName(null);
    setExcelRowCount(0);
    setImportMode("JSON");
    setExcelValidationIssues([]);
    setMessage("Example JSON loaded.");
    setError(null);
  }

  /* =======================================================
   * JSON File Import
   * ======================================================= */
  function handleJsonFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type && file.type !== "application/json" && !file.name.toLowerCase().endsWith(".json")) {
      setError("Please select a JSON file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        setError("Could not read the selected file.");
        return;
      }
      setJsonText(result);
      setExcelQuestions(null);
      setExcelFileName(null);
      setExcelRowCount(0);
      setImportMode("JSON");
      setExcelValidationIssues([]);
      setMessage(`Loaded ${file.name}. Review the JSON before importing.`);
      setError(null);
    };
    reader.onerror = () => {
      setError("Failed to read the selected file.");
    };
    reader.readAsText(file);
  }

  /* =======================================================
   * Excel File Import
   * ======================================================= */
  async function handleExcelFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      setError("Please select an Excel file (.xlsx or .xls).");
      return;
    }

    setMessage(null);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      if (workbook.SheetNames.length === 0) {
        throw new Error("The Excel workbook does not contain any worksheet.");
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "", raw: true });

      /* Normalize Excel headers before validation. */
      const normalizedRows = rawRows.map((rawRow) => {
        const normalizedRow: ExcelRow = {};
        Object.entries(rawRow).forEach(([key, value]) => {
          normalizedRow[normalizeHeader(key)] = value;
        });
        return normalizedRow;
      });

      if (normalizedRows.length === 0) {
        throw new Error("The first worksheet does not contain any MCQ data rows.");
      }

      const availableColumns = Object.keys(normalizedRows[0]);
      const missingColumns = REQUIRED_EXCEL_COLUMNS.filter((column) => !availableColumns.includes(column));

      if (missingColumns.length > 0) {
        throw new Error(`Excel file is missing required column(s): ${missingColumns.join(", ")}.`);
      }

      const { questions, issues } = parseExcelRows(normalizedRows);

      setExcelFileName(file.name);
      setExcelRowCount(questions.length);
      setExcelValidationIssues(issues);
      setExcelQuestions(issues.length === 0 ? questions : null);
      setJsonText("");
      setImportMode(issues.length === 0 ? "EXCEL" : null);

      if (issues.length > 0) {
        setMessage(null);
        return;
      }

      if (questions.length === 0) {
        setError("No valid MCQs were found in the Excel file.");
        return;
      }

      setMessage(`Loaded ${questions.length} MCQ(s) from ${file.name}. Review the import summary before importing.`);
      setError(null);
    } catch (excelError) {
      setExcelQuestions(null);
      setExcelFileName(null);
      setExcelRowCount(0);
      setExcelValidationIssues([]);
      setError(excelError instanceof Error ? excelError.message : "Failed to read or validate the Excel file.");
    }
  }

  /* =======================================================
   * Parse JSON
   * ======================================================= */
  function parseQuestions(): BulkMcqInput[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error("Invalid JSON. Please check the JSON syntax.");
    }
    if (!Array.isArray(parsed)) {
      throw new Error("Bulk MCQ data must be a JSON array.");
    }
    if (parsed.length === 0) {
      throw new Error("The JSON array cannot be empty.");
    }
    return parsed as BulkMcqInput[];
  }

  /* =======================================================
   * Submit
   * ======================================================= */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setMessage(null);
    setError(null);

    if (!selectedClassSlug) {
      setError("Please select a class.");
      return;
    }

    if (!selectedSubjectId || !selectedSubject) {
      setError("Please select a subject.");
      return;
    }

    if (availableBranches.length > 0 && !selectedBranchId) {
      setError("Please select a branch.");
      return;
    }

    if (!curriculumNodeId) {
      setError("Please select a chapter.");
      return;
    }

    let questions: BulkMcqInput[];
    try {
      if (importMode === "EXCEL") {
        if (!excelQuestions || excelQuestions.length === 0) {
          throw new Error("Please load and validate an Excel file first.");
        }
        questions = excelQuestions;
      } else {
        if (!jsonText.trim()) {
          throw new Error("Please provide the MCQ JSON data or load an Excel file.");
        }
        questions = parseQuestions();
      }
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Invalid bulk MCQ data.");
      return;
    }

    setSaving(true);

    try {
      const result = await bulkCreateAdminMcqs(curriculumNodeId, questions);
      if (!result.success) {
        throw new Error(result.message || "MCQ import failed.");
      }
      setMessage(`${result.importedCount} MCQ(s) imported successfully as Draft. Numbers: ${result.firstQuestionNumber}–${result.lastQuestionNumber}.`);
      clearImportedData();
    } catch (submitError) {
      console.error("Bulk MCQ import failed:", submitError);
      setError(submitError instanceof Error ? submitError.message : "Bulk MCQ import failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const hasExcelValidationErrors = excelValidationIssues.length > 0;
  const hasImportData = importMode === "EXCEL" ? Boolean(excelQuestions && excelQuestions.length > 0) : Boolean(jsonText.trim());

  /* =======================================================
   * UI
   * ======================================================= */
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* =================================================
       * Curriculum
       * ================================================= */}
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="bulk-class" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Class</label>
          <select id="bulk-class" value={selectedClassSlug} onChange={(event) => handleClassChange(event.target.value)} disabled={saving} className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <option value="">Select class</option>
            {chapters.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="bulk-subject" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Subject</label>
          <select id="bulk-subject" value={selectedSubjectId} onChange={(event) => handleSubjectChange(event.target.value)} disabled={saving || !selectedClass} className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <option value="">{selectedClass ? "Select subject" : "Select class first"}</option>
            {availableSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.display_name}</option>)}
          </select>
        </div>
        {selectedSubject && availableBranches.length > 0 && (
          <div>
            <label htmlFor="bulk-branch" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Branch</label>
            <select id="bulk-branch" value={selectedBranchId} onChange={(event) => handleBranchChange(event.target.value)} disabled={saving} className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              <option value="">Select branch</option>
              {availableBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.display_name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="bulk-chapter" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Chapter</label>
          <select id="bulk-chapter" value={curriculumNodeId} onChange={(event) => handleChapterChange(event.target.value)} disabled={saving || !selectedSubject || (availableBranches.length > 0 && !selectedBranch)} className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <option value="">{!selectedClass ? "Select class first" : !selectedSubject ? "Select subject first" : availableBranches.length > 0 && !selectedBranch ? "Select branch first" : "Select chapter"}</option>
            {availableChapters.map((chapter) => <option key={chapter.id} value={chapter.id}>Chapter {chapter.sequence_order ?? "—"} — {chapter.display_name}</option>)}
          </select>
        </div>
      </div>

      {/* =================================================
       * Selected Curriculum Information
       * ================================================= */}
      {selectedClass && selectedSubject && curriculumNodeId && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Import Target</p>
          <p className="mt-2 text-sm font-semibold text-blue-900 dark:text-blue-200">
            {selectedClass.name} · {selectedSubject.display_name}{selectedBranch ? ` · ${selectedBranch.display_name}` : ""} · {availableChapters.find((chapter) => chapter.id === curriculumNodeId)?.display_name}
          </p>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">All imported MCQs will be mapped to this chapter.</p>
        </div>
      )}

      {/* =================================================
       * JSON Import
       * ================================================= */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <label htmlFor="bulk-json" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              MCQ JSON
            </label>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Paste an array of MCQs. LaTeX can be included directly inside strings.
            </p>
          </div>
          <button type="button" onClick={loadExample} disabled={saving} className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900">
            Load Example
          </button>
        </div>
        <textarea
          id="bulk-json"
          value={jsonText}
          onChange={(event) => {
            setJsonText(event.target.value);
            setExcelQuestions(null);
            setExcelFileName(null);
            setExcelRowCount(0);
            setImportMode(event.target.value.trim() ? "JSON" : null);
            setMessage(null);
            setError(null);
          }}
          disabled={saving}
          rows={22}
          spellCheck={false}
          placeholder={`[\n  {\n    "questionText": "If $x=2$, find $x^2+3x$.",\n    "sourceType": "ORIGINAL",\n    "difficulty": "EASY",\n    "marks": 1,\n    "estimatedTimeMinutes": 1,\n    "solutionText": "$10$",\n    "mistakeInsight": "Substitute the given value carefully.",\n    "options": [\n      { "optionKey": "A", "optionText": "$8$", "displayOrder": 1, "isCorrect": false },\n      { "optionKey": "B", "optionText": "$10$", "displayOrder": 2, "isCorrect": true },\n      { "optionKey": "C", "optionText": "$12$", "displayOrder": 3, "isCorrect": false },\n      { "optionKey": "D", "optionText": "$14$", "displayOrder": 4, "isCorrect": false }\n    ]\n  }\n]`}
          className="mt-3 block w-full rounded-2xl border border-slate-300 bg-slate-950 px-4 py-4 font-mono text-xs leading-6 text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
        />
      </div>

      {/* =================================================
       * JSON File
       * ================================================= */}
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/40">
        <label htmlFor="bulk-json-file" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
          Load a JSON file
        </label>
        <input
          id="bulk-json-file"
          type="file"
          accept=".json,application/json"
          onChange={handleJsonFileChange}
          disabled={saving}
          className="mt-3 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-xs file:font-semibold dark:text-slate-400 dark:file:bg-slate-800"
        />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          JSON files remain supported.
        </p>
      </div>

      {/* =================================================
       * Excel Import
       * ================================================= */}
      <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/50 dark:bg-blue-950/20">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Excel Bulk Import
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Upload an Excel workbook (.xlsx or .xls). The first worksheet will be imported.
          </p>
        </div>
        <input
          id="bulk-excel-file"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleExcelFileChange}
          disabled={saving}
          className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-100 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-blue-800 dark:text-slate-400 dark:file:bg-blue-950 dark:file:text-blue-300"
        />
        <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4 dark:border-blue-900/50 dark:bg-slate-950">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            Required columns
          </p>
          <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-400">
            question_text · option_A · option_B · option_C · option_D · correct_option
          </p>
          <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-500">
            Optional: source_type, source_reference, difficulty, marks, estimated_time_minutes, solution_text, mistake_insight.
          </p>
        </div>
        {excelFileName && excelQuestions && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900/50 dark:bg-green-950/20">
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              Excel validated
            </p>
            <p className="mt-1 text-xs text-green-700 dark:text-green-400">
              {excelFileName} {" · "} {excelRowCount} MCQ(s) ready to import.
            </p>
          </div>
        )}
      </div>

      {/* =================================================
       * Excel Validation Errors
       * ================================================= */}
      {hasExcelValidationErrors && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                Excel validation failed
              </p>
              <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                {excelValidationIssues.length} issue{excelValidationIssues.length === 1 ? "" : "s"} found. Import is blocked until all issues are fixed.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
              {excelValidationIssues.length} issue{excelValidationIssues.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {excelValidationIssues.map((issue, index) => (
              <div key={`${issue.row}-${issue.field}-${index}`} className="rounded-xl border border-red-100 bg-white px-4 py-3 dark:border-red-900/40 dark:bg-slate-950">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                    Row {issue.row}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {issue.field}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-red-800 dark:text-red-300">
                  {issue.message}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-red-100 bg-red-100/50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/30">
            <p className="text-xs leading-5 text-red-700 dark:text-red-400">
              No MCQs from this Excel file have been imported. Fix the listed rows and upload the file again.
            </p>
          </div>
        </div>
      )}

      {/* =================================================
       * Excel Import Preview
       * ================================================= */}
      {importMode === "EXCEL" && excelQuestions && excelQuestions.length > 0 && (
        <ExcelMcqPreview questions={excelQuestions} fileName={excelFileName} />
      )}

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
          disabled={saving || chapters.length === 0 || !selectedClass || !curriculumNodeId || !hasImportData || hasExcelValidationErrors}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Importing MCQs...
            </>
          ) : (
            "Import MCQs"
          )}
        </button>
      </div>
    </form>
  );
}