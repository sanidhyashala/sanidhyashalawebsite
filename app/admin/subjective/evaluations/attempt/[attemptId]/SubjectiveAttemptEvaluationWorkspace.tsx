"use client";

import { useEffect, useMemo, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

import {
  AlertCircle,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileImage,
  FileText,
  ExternalLink,
  GraduationCap,
  Layers3,
  Loader2,
  Maximize2,
  Save,
  Sparkles,
  X,
  UserRound,
} from "lucide-react";

import type {
  SubjectiveAttemptEvaluationWorkspace,
  SubjectiveAttemptEvaluationQuestion,
} from "@/app/lib/teacher/subjective/subjective-attempt-evaluation.service";

import {
  startSubjectiveTeacherReview,
  saveSubjectiveTeacherEvaluationDraft,
} from "@/app/lib/teacher/subjective/subjective-evaluation.actions";

import {
  runSubjectiveAiEvaluation,
} from "@/app/lib/teacher/subjective/subjective-ai-evaluation.actions";

import {
  getSubjectiveSolutionFilePreviewUrl,
} from "@/app/lib/teacher/subjective/subjective-solution-preview.actions";

import {
  finalizeSubjectiveAttempt,
} from "@/app/lib/teacher/subjective/finalize-subjective-attempt.actions";

import {
  finalizeSubjectiveTeacherEvaluation,
} from "@/app/lib/teacher/subjective/subjective-teacher-finalization.actions";

import SubjectiveSolutionAnnotationViewer from "@/app/lib/teacher/subjective/SubjectiveSolutionAnnotationViewer";

/* =========================================================
 * Props
 * ========================================================= */

type Props = {
  workspace: SubjectiveAttemptEvaluationWorkspace;
};

/* =========================================================
 * AI Analysis Types
 * ========================================================= */

type SubjectiveAiAnalysis = {
  model?: string;
  provider?: string;
  fileCount?: number;
  correctness?: string;
  scoreReason?: string;
  conceptUnderstanding?: string;
  strengths?: string[];
  mistakes?: string[];
  missingSteps?: string[];
  evaluatedAt?: string;
};

function normalizeAiAnalysis(
  value: unknown,
): SubjectiveAiAnalysis | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;

  return {
    model:
      typeof raw.model === "string"
        ? raw.model
        : undefined,
    provider:
      typeof raw.provider === "string"
        ? raw.provider
        : undefined,
    fileCount:
      typeof raw.fileCount === "number"
        ? raw.fileCount
        : undefined,
    correctness:
      typeof raw.correctness === "string"
        ? raw.correctness
        : undefined,
    scoreReason:
      typeof raw.scoreReason === "string"
        ? raw.scoreReason
        : undefined,
    conceptUnderstanding:
      typeof raw.conceptUnderstanding === "string"
        ? raw.conceptUnderstanding
        : undefined,
    strengths: Array.isArray(raw.strengths)
      ? raw.strengths.filter(
          (item): item is string =>
            typeof item === "string",
        )
      : undefined,
    mistakes: Array.isArray(raw.mistakes)
      ? raw.mistakes.filter(
          (item): item is string =>
            typeof item === "string",
        )
      : undefined,
    missingSteps: Array.isArray(
      raw.missingSteps,
    )
      ? raw.missingSteps.filter(
          (item): item is string =>
            typeof item === "string",
        )
      : undefined,
    evaluatedAt:
      typeof raw.evaluatedAt === "string"
        ? raw.evaluatedAt
        : undefined,
  };
}

/* =========================================================
 * Math / Question Rendering
 * ========================================================= */

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMath(
  latex: string,
  displayMode: boolean,
): string {
  try {
    return katex.renderToString(
      latex.trim(),
      {
        displayMode,
        throwOnError: false,
        output: "htmlAndMathml",
      },
    );
  } catch {
    return escapeHtml(latex);
  }
}

/**
 * Render plain text mixed with:
 *
 * \( inline math \)
 * \[ block math \]
 * $$ block math $$
 * $ inline math $
 */
function renderQuestionHtml(
  source: string,
): string {
  if (!source) {
    return "";
  }

  let html = "";
  let cursor = 0;

  const pattern =
    /\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)|\$([^\n$]+?)\$/g;

  let match: RegExpExecArray | null;

  while (
    (match = pattern.exec(source)) !== null
  ) {
    const plainText =
      source.slice(cursor, match.index);

    html += renderPlainText(
      plainText,
    );

    if (
      match[1] !== undefined
    ) {
      html += `
        <div class="my-4 overflow-x-auto text-center">
          ${renderMath(match[1], true)}
        </div>
      `;
    } else if (
      match[2] !== undefined
    ) {
      html += `
        <div class="my-4 overflow-x-auto text-center">
          ${renderMath(match[2], true)}
        </div>
      `;
    } else if (
      match[3] !== undefined
    ) {
      html += `
        <span class="mx-0.5 inline-block align-middle">
          ${renderMath(match[3], false)}
        </span>
      `;
    } else if (
      match[4] !== undefined
    ) {
      html += `
        <span class="mx-0.5 inline-block align-middle">
          ${renderMath(match[4], false)}
        </span>
      `;
    }

    cursor =
      match.index + match[0].length;
  }

  html += renderPlainText(
    source.slice(cursor),
  );

  return html;
}

function renderPlainText(
  text: string,
): string {
  if (!text) {
    return "";
  }

  return escapeHtml(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "<br />");
}

/* =========================================================
 * Question Content
 * ========================================================= */

function QuestionContent({
  text,
}: {
  text: string;
}) {
  const html =
    renderQuestionHtml(text);

  return (
    <div
      className="
        text-[15px]
        leading-8
        text-slate-800
        dark:text-slate-200
        [&_.katex]:text-[1.05em]
        [&_.katex-display]:my-0
        [&_.katex-display]:overflow-x-auto
      "
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  );
}

/* =========================================================
 * Helpers
 * ========================================================= */

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function categoryLabel(
  category: string,
) {
  switch (category) {
    case "UNDERSTAND_APPLY":
      return "Understand & Apply";

    case "THINK_SOLVE":
      return "Think & Solve";

    case "CASE_BASED":
      return "Case Based";

    default:
      return category;
  }
}

function statusLabel(
  status: string,
) {
  switch (status) {
    case "PENDING":
      return "Choose Method";

    case "AI_ASSISTED":
      return "AI Assisted";

    case "TEACHER_REVIEW":
      return "Teacher Review";

    case "EVALUATED":
      return "Evaluated";

    default:
      return status;
  }
}

/* =========================================================
 * Status Badge
 * ========================================================= */

function EvaluationStatusBadge({
  status,
}: {
  status: string | null;
}) {
  if (!status) {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          bg-slate-100
          px-2.5
          py-1
          text-xs
          font-medium
          text-slate-600
          dark:bg-slate-800
          dark:text-slate-300
        "
      >
        No Evaluation
      </span>
    );
  }

  if (status === "PENDING") {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          bg-violet-50
          px-2.5
          py-1
          text-xs
          font-medium
          text-violet-700
          dark:bg-violet-950/40
          dark:text-violet-300
        "
      >
        <Sparkles className="h-3.5 w-3.5" />
        Awaiting AI
      </span>
    );
  }

  if (status === "AI_ASSISTED") {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          bg-blue-50
          px-2.5
          py-1
          text-xs
          font-medium
          text-blue-700
          dark:bg-blue-950/40
          dark:text-blue-300
        "
      >
        <BrainCircuit className="h-3.5 w-3.5" />
        AI Assisted
      </span>
    );
  }

  if (status === "TEACHER_REVIEW") {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          bg-amber-50
          px-2.5
          py-1
          text-xs
          font-medium
          text-amber-700
          dark:bg-amber-950/40
          dark:text-amber-300
        "
      >
        <Clock3 className="h-3.5 w-3.5" />
        Teacher Review
      </span>
    );
  }

  if (status === "EVALUATED") {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          bg-emerald-50
          px-2.5
          py-1
          text-xs
          font-medium
          text-emerald-700
          dark:bg-emerald-950/40
          dark:text-emerald-300
        "
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Evaluated
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        items-center
        gap-1.5
        rounded-full
        bg-slate-100
        px-2.5
        py-1
        text-xs
        font-medium
        text-slate-600
        dark:bg-slate-800
        dark:text-slate-300
      "
    >
      {statusLabel(status)}
    </span>
  );
}

/* =========================================================
 * Solution Files
 * ========================================================= */

function SolutionFiles({
  question,
}: {
  question: SubjectiveAttemptEvaluationQuestion;
}) {
  const evaluationId =
    question.evaluation?.id;

  if (!evaluationId) {
    return (
      <div
        className="
          rounded-xl
          border
          border-dashed
          border-slate-300
          bg-slate-50
          p-6
          text-center
          dark:border-slate-700
          dark:bg-slate-950
        "
      >
        <FileText
          className="
            mx-auto
            h-7
            w-7
            text-slate-400
          "
        />

        <p
          className="
            mt-2
            text-sm
            font-medium
            text-slate-600
            dark:text-slate-300
          "
        >
          Evaluation record is not available.
        </p>
      </div>
    );
  }

  return (
    <SubjectiveSolutionAnnotationViewer
      evaluationId={evaluationId}
      evaluationStatus={
        question.evaluation
          ?.evaluationStatus ??
        "PENDING"
      }
      files={question.files.map(
        (file) => ({
          id: file.id,
          file_path:
            file.filePath,
          file_name:
            file.fileName,
          mime_type:
            file.mimeType,
          page_number:
            file.pageNumber,
        }),
      )}
    />
  );
}

/* =========================================================
 * Evaluation Method + AI Assistance
 * ========================================================= */

type AiUpdatedValues = {
  aiSuggestedMarks: number | null;
  aiFeedback: string | null;
  aiAnalysis: SubjectiveAiAnalysis | null;
  evaluationStatus: "AI_ASSISTED" | "TEACHER_REVIEW";
};

function AiAnalysisCard({
  question,
  aiSuggestedMarks,
  aiFeedback,
  aiAnalysis,
}: {
  question: SubjectiveAttemptEvaluationQuestion;
  aiSuggestedMarks: number | null;
  aiFeedback: string | null;
  aiAnalysis: SubjectiveAiAnalysis | null;
}) {
  const correctnessLabel =
    aiAnalysis?.correctness ===
    "PARTIALLY_CORRECT"
      ? "Partially Correct"
      : aiAnalysis?.correctness === "CORRECT"
        ? "Correct"
        : aiAnalysis?.correctness ===
            "INCORRECT"
          ? "Incorrect"
          : aiAnalysis?.correctness ??
            "AI Assessment";

  const correctnessClass =
    aiAnalysis?.correctness === "CORRECT"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
      : aiAnalysis?.correctness ===
          "INCORRECT"
        ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
        : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";

  const hasDetails =
    Boolean(
      aiAnalysis?.scoreReason ||
        aiAnalysis?.conceptUnderstanding ||
        aiAnalysis?.strengths?.length ||
        aiAnalysis?.mistakes?.length ||
        aiAnalysis?.missingSteps?.length,
    );

  return (
    <div
      className="
        overflow-hidden
        rounded-2xl
        border
        border-violet-200
        bg-white
        shadow-sm
        dark:border-violet-900
        dark:bg-slate-900
      "
    >
      <div
        className="
          border-b
          border-violet-100
          bg-violet-50/70
          px-5
          py-4
          dark:border-violet-900
          dark:bg-violet-950/20
        "
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-violet-600
                text-white
                dark:bg-violet-500
              "
            >
              <BrainCircuit className="h-5 w-5" />
            </div>

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-violet-950
                  dark:text-violet-100
                "
              >
                AI Evaluation
              </p>

              <p
                className="
                  mt-0.5
                  text-xs
                  leading-5
                  text-violet-700
                  dark:text-violet-300
                "
              >
                Review the AI assessment below. Teacher remains
                the final authority.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {aiAnalysis?.correctness && (
              <span
                className={`
                  inline-flex
                  items-center
                  rounded-full
                  px-2.5
                  py-1
                  text-xs
                  font-semibold
                  ${correctnessClass}
                `}
              >
                {correctnessLabel}
              </span>
            )}

            {aiSuggestedMarks !== null &&
              aiSuggestedMarks !== undefined && (
                <span
                  className="
                    inline-flex
                    items-center
                    rounded-full
                    bg-violet-100
                    px-3
                    py-1
                    text-sm
                    font-semibold
                    text-violet-900
                    dark:bg-violet-900/50
                    dark:text-violet-100
                  "
                >
                  AI Suggested: {aiSuggestedMarks} /{" "}
                  {question.marks}
                </span>
              )}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {aiFeedback && (
          <div
            className="
              rounded-xl
              border
              border-violet-100
              bg-violet-50/50
              p-4
              dark:border-violet-900
              dark:bg-violet-950/20
            "
          >
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-violet-600
                dark:text-violet-400
              "
            >
              AI Feedback / Suggested Teacher Feedback
            </p>

            <div
              className="
                mt-2
                text-sm
                leading-7
                text-slate-700
                dark:text-slate-300
                [&_.katex]:text-[1.02em]
                [&_.katex-display]:my-2
                [&_.katex-display]:overflow-x-auto
              "
              dangerouslySetInnerHTML={{
                __html: renderQuestionHtml(
                  aiFeedback,
                ),
              }}
            />
          </div>
        )}

        {hasDetails && (
          <div className="space-y-5">
            {aiAnalysis?.scoreReason && (
              <AiAnalysisTextSection
                title="Why these marks?"
                text={aiAnalysis.scoreReason}
              />
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              {Boolean(
                aiAnalysis?.strengths?.length,
              ) && (
                <AiAnalysisListSection
                  title="Correct Steps / Strengths"
                  items={
                    aiAnalysis?.strengths ?? []
                  }
                  tone="success"
                />
              )}

              {Boolean(
                aiAnalysis?.mistakes?.length,
              ) && (
                <AiAnalysisListSection
                  title="Issues / Mistakes"
                  items={
                    aiAnalysis?.mistakes ?? []
                  }
                  tone="danger"
                />
              )}
            </div>

            {Boolean(
              aiAnalysis?.missingSteps?.length,
            ) && (
              <AiAnalysisListSection
                title="Missing Steps"
                items={
                  aiAnalysis?.missingSteps ?? []
                }
                tone="warning"
              />
            )}

            {aiAnalysis?.conceptUnderstanding && (
              <AiAnalysisTextSection
                title="Concept Understanding"
                text={
                  aiAnalysis.conceptUnderstanding
                }
              />
            )}
          </div>
        )}

        {(aiAnalysis?.model ||
          aiAnalysis?.provider ||
          aiAnalysis?.fileCount !==
            undefined ||
          aiAnalysis?.evaluatedAt) && (
          <div
            className="
              flex
              flex-wrap
              items-center
              gap-x-4
              gap-y-1
              border-t
              border-slate-100
              pt-3
              text-[11px]
              text-slate-400
              dark:border-slate-800
              dark:text-slate-500
            "
          >
            {aiAnalysis.model && (
              <span>
                Model: {aiAnalysis.model}
              </span>
            )}

            {aiAnalysis.provider && (
              <span>
                Provider: {aiAnalysis.provider}
              </span>
            )}

            {aiAnalysis.fileCount !==
              undefined && (
              <span>
                Files: {aiAnalysis.fileCount}
              </span>
            )}

            {aiAnalysis.evaluatedAt && (
              <span>
                Evaluated:{" "}
                {formatDate(
                  aiAnalysis.evaluatedAt,
                )}
              </span>
            )}
          </div>
        )}

        {!hasDetails && !aiFeedback && (
          <p
            className="
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            AI analysis details are not available for
            this evaluation.
          </p>
        )}
      </div>
    </div>
  );
}

function AiAnalysisTextSection({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div>
      <p
        className="
          text-xs
          font-semibold
          uppercase
          tracking-wide
          text-slate-500
          dark:text-slate-400
        "
      >
        {title}
      </p>

      <div
        className="
          mt-2
          rounded-xl
          border
          border-slate-200
          bg-slate-50
          p-4
          text-sm
          leading-7
          text-slate-700
          dark:border-slate-700
          dark:bg-slate-950
          dark:text-slate-300
          [&_.katex]:text-[1.02em]
          [&_.katex-display]:my-2
          [&_.katex-display]:overflow-x-auto
        "
        dangerouslySetInnerHTML={{
          __html: renderQuestionHtml(text),
        }}
      />
    </div>
  );
}

function AiAnalysisListSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "success" | "danger" | "warning";
}) {
  const toneClasses =
    tone === "success"
      ? {
          border:
            "border-emerald-200 dark:border-emerald-900",
          bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
          icon:
            "text-emerald-600 dark:text-emerald-400",
          text:
            "text-slate-700 dark:text-slate-300",
        }
      : tone === "danger"
        ? {
            border:
              "border-red-200 dark:border-red-900",
            bg: "bg-red-50/50 dark:bg-red-950/20",
            icon:
              "text-red-600 dark:text-red-400",
            text:
              "text-slate-700 dark:text-slate-300",
          }
        : {
            border:
              "border-amber-200 dark:border-amber-900",
            bg: "bg-amber-50/50 dark:bg-amber-950/20",
            icon:
              "text-amber-600 dark:text-amber-400",
            text:
              "text-slate-700 dark:text-slate-300",
          };

  return (
    <div
      className={`
        rounded-xl
        border
        p-4
        ${toneClasses.border}
        ${toneClasses.bg}
      `}
    >
      <p
        className="
          text-xs
          font-semibold
          uppercase
          tracking-wide
          text-slate-500
          dark:text-slate-400
        "
      >
        {title}
      </p>

      <ul className="mt-3 space-y-2.5">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="flex items-start gap-2.5"
          >
            {tone === "danger" ? (
              <AlertCircle
                className={`
                  mt-0.5
                  h-4
                  w-4
                  shrink-0
                  ${toneClasses.icon}
                `}
              />
            ) : tone === "warning" ? (
              <Clock3
                className={`
                  mt-0.5
                  h-4
                  w-4
                  shrink-0
                  ${toneClasses.icon}
                `}
              />
            ) : (
              <CheckCircle2
                className={`
                  mt-0.5
                  h-4
                  w-4
                  shrink-0
                  ${toneClasses.icon}
                `}
              />
            )}

            <div
              className={`
                min-w-0
                text-sm
                leading-6
                ${toneClasses.text}
                [&_.katex]:text-[1.02em]
                [&_.katex-display]:my-1
                [&_.katex-display]:overflow-x-auto
              `}
              dangerouslySetInnerHTML={{
                __html: renderQuestionHtml(item),
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function EvaluationMethodPanel({
  question,
  onUpdated,
  readOnly = false,
}: {
  question: SubjectiveAttemptEvaluationQuestion;
  readOnly?: boolean;
  onUpdated: (
    evaluationId: string,
    values: AiUpdatedValues,
  ) => void;
}) {
  const evaluationRecord = question.evaluation;

  const [running, setRunning] = useState(false);
  const [startingReview, setStartingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!evaluationRecord) {
    return (
      <div
        className="
          rounded-xl
          border
          border-dashed
          border-slate-300
          bg-slate-50
          p-5
          text-sm
          text-slate-500
          dark:border-slate-700
          dark:bg-slate-950
          dark:text-slate-400
        "
      >
        No evaluation record is available for this question.
      </div>
    );
  }

  /*
   * Capture the values needed by handlers/JSX as stable
   * local snapshots. TypeScript can lose the null-narrowing
   * of evaluationRecord inside nested async callbacks.
   */
  const evaluationId = evaluationRecord.id;
  const evaluationStatus = evaluationRecord.evaluationStatus;
  const aiSuggestedMarks =
    evaluationRecord.aiSuggestedMarks;
  const aiFeedback =
    evaluationRecord.aiFeedback;
  const aiAnalysis =
    normalizeAiAnalysis(
      evaluationRecord.aiAnalysis,
    );

  const hasAiResult =
    aiSuggestedMarks !== null &&
    aiSuggestedMarks !== undefined;

  async function handleRunAiEvaluation() {
    if (readOnly || running || startingReview) {
      return;
    }

    setRunning(true);
    setError(null);
    setMessage(null);

    try {
      const result = await runSubjectiveAiEvaluation(
        evaluationId,
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      /*
       * AI evaluation has succeeded. Capture the complete analysis
       * returned by the AI action, then immediately move the
       * evaluation into TEACHER_REVIEW so the teacher can review
       * the AI suggestion and enter teacher marks / feedback
       * without another click.
       */
      const resultAiAnalysis =
        normalizeAiAnalysis(
          (
            result as typeof result & {
              aiAnalysis?: unknown;
            }
          ).aiAnalysis,
        );

      setStartingReview(true);

      const reviewResult =
        await startSubjectiveTeacherReview(
          evaluationId,
        );

      if (!reviewResult.success) {
        /*
         * AI evaluation itself succeeded, so preserve that result
         * and leave the evaluation in AI_ASSISTED if teacher review
         * could not be started.
         */
        onUpdated(evaluationId, {
          aiSuggestedMarks: result.aiSuggestedMarks,
          aiFeedback: result.aiFeedback,
          aiAnalysis: resultAiAnalysis,
          evaluationStatus: "AI_ASSISTED",
        });

        setError(
          `AI evaluation completed, but teacher review could not be started. ${reviewResult.error}`,
        );
        return;
      }

      /*
       * Both operations succeeded:
       * PENDING -> AI_ASSISTED -> TEACHER_REVIEW
       *
       * TeacherReviewForm will now open automatically while the
       * AI suggestion remains visible above it.
       */
      onUpdated(evaluationId, {
        aiSuggestedMarks: result.aiSuggestedMarks,
        aiFeedback: result.aiFeedback,
        aiAnalysis: resultAiAnalysis,
        evaluationStatus: "TEACHER_REVIEW",
      });

      setMessage(
        "AI evaluation completed. Review the AI suggestion and enter your teacher assessment.",
      );
    } catch (caughtError) {
      console.error(
        "Failed to run Subjective AI evaluation:",
        caughtError,
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to run AI evaluation.",
      );
    } finally {
      setRunning(false);
      setStartingReview(false);
    }
  }

  async function handleStartTeacherReview() {
    if (
      readOnly ||
      startingReview ||
      running ||
      evaluationStatus === "EVALUATED"
    ) {
      return;
    }

    setStartingReview(true);
    setError(null);
    setMessage(null);

    try {
      const result =
        await startSubjectiveTeacherReview(
          evaluationId,
        );

      if (!result.success) {
        setError(result.error);
        return;
      }

      /*
       * The server has moved the evaluation to TEACHER_REVIEW.
       * The workspace handler promotes the local state using
       * the same shared update path.
       */
      onUpdated(evaluationId, {
        aiSuggestedMarks,
        aiFeedback,
        aiAnalysis,
        evaluationStatus:
          "TEACHER_REVIEW",
      });

      setMessage(
        "Teacher review started. You can now make the final assessment.",
      );
    } catch (caughtError) {
      console.error(
        "Failed to start teacher review:",
        caughtError,
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to start teacher review.",
      );
    } finally {
      setStartingReview(false);
    }
  }

  /*
   * Once teacher review has started, this panel only shows
   * the AI assistance result. The actual teacher controls
   * live in TeacherReviewForm below.
   */
  if (evaluationStatus === "TEACHER_REVIEW") {
    if (!hasAiResult) {
      return (
        <div
          className="
            rounded-xl
            border
            border-amber-200
            bg-amber-50/60
            p-4
            text-sm
            text-amber-800
            dark:border-amber-900
            dark:bg-amber-950/20
            dark:text-amber-200
          "
        >
          Manual evaluation is active for this question.
          No AI assistance was requested.
        </div>
      );
    }

    return (
      <AiAnalysisCard
        question={question}
        aiSuggestedMarks={aiSuggestedMarks}
        aiFeedback={aiFeedback}
        aiAnalysis={aiAnalysis}
      />
    );
  }

  /*
   * Once the attempt is locked, EVALUATED questions are
   * read-only. Their final result is rendered by the
   * TeacherReviewForm.
   */
  if (evaluationStatus === "EVALUATED") {
    return null;
  }

  /*
   * Initial state: the teacher chooses exactly one route.
   *
   * AI:
   * PENDING -> AI_ASSISTED -> TEACHER_REVIEW
   *
   * Manual:
   * PENDING -> TEACHER_REVIEW
   */
  return (
    <div className="space-y-3">
      <div
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          dark:border-slate-700
          dark:bg-slate-900
        "
      >
        <div>
          <p
            className="
              text-base
              font-semibold
              text-slate-900
              dark:text-white
            "
          >
            How would you like to evaluate this solution?
          </p>

          <p
            className="
              mt-1
              text-sm
              leading-6
              text-slate-500
              dark:text-slate-400
            "
          >
            Choose AI assistance if you want a first
            assessment, or evaluate the solution directly
            yourself.
          </p>
        </div>

        <div
          className="
            mt-4
            grid
            gap-3
            md:grid-cols-2
          "
        >
          {/* AI method */}
          <button
            type="button"
            onClick={handleRunAiEvaluation}
            disabled={
              readOnly ||
              running ||
              startingReview
            }
            className="
              group
              rounded-2xl
              border
              border-violet-200
              bg-violet-50/60
              p-4
              text-left
              transition
              hover:border-violet-300
              hover:bg-violet-50
              disabled:cursor-not-allowed
              disabled:opacity-60
              dark:border-violet-900
              dark:bg-violet-950/20
              dark:hover:border-violet-700
              dark:hover:bg-violet-950/30
            "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-violet-600
                  text-white
                  dark:bg-violet-500
                "
              >
                {running ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="
                    text-sm
                    font-semibold
                    text-violet-900
                    dark:text-violet-100
                  "
                >
                  {running
                    ? "Analysing & Preparing Review..."
                    : "AI Assisted Evaluation"}
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-violet-700
                    dark:text-violet-300
                  "
                >
                  Let AI inspect the question,
                  reference solution and student&apos;s
                  submitted work first.
                </p>

                <span
                  className="
                    mt-3
                    inline-flex
                    items-center
                    gap-1.5
                    text-xs
                    font-semibold
                    text-violet-700
                    dark:text-violet-300
                  "
                >
                  {running
                    ? "Preparing teacher review..."
                    : "Use AI Assistance →"}
                </span>
              </div>
            </div>
          </button>

          {/* Manual method */}
          <button
            type="button"
            onClick={handleStartTeacherReview}
            disabled={
              readOnly ||
              running ||
              startingReview
            }
            className="
              group
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              p-4
              text-left
              transition
              hover:border-slate-300
              hover:bg-slate-100
              disabled:cursor-not-allowed
              disabled:opacity-60
              dark:border-slate-700
              dark:bg-slate-950
              dark:hover:border-slate-600
              dark:hover:bg-slate-800
            "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-900
                  text-white
                  dark:bg-white
                  dark:text-slate-900
                "
              >
                {startingReview ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <GraduationCap className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="
                    text-sm
                    font-semibold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {startingReview
                    ? "Starting Manual Evaluation..."
                    : "Manual Evaluation"}
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Evaluate the student&apos;s work yourself
                  using the marking tools and teacher
                  assessment.
                </p>

                <span
                  className="
                    mt-3
                    inline-flex
                    items-center
                    gap-1.5
                    text-xs
                    font-semibold
                    text-slate-700
                    dark:text-slate-300
                  "
                >
                  {startingReview
                    ? "Please wait..."
                    : "Evaluate Manually →"}
                </span>
              </div>
            </div>
          </button>
        </div>

        <div
          className="
            mt-4
            rounded-xl
            border
            border-blue-100
            bg-blue-50/60
            px-3
            py-2.5
            text-xs
            leading-5
            text-blue-700
            dark:border-blue-900
            dark:bg-blue-950/20
            dark:text-blue-300
          "
        >
          <span className="font-semibold">
            Teacher remains the final authority.
          </span>{" "}
          AI only provides assistance and suggestions.
        </div>
      </div>

      {error && (
        <div
          className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-3
            py-2.5
            text-sm
            text-red-700
            dark:border-red-900
            dark:bg-red-950/30
            dark:text-red-300
          "
        >
          <p>{error}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRunAiEvaluation}
              disabled={
                readOnly ||
                running ||
                startingReview
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-violet-600
                px-3
                py-2
                text-xs
                font-semibold
                text-white
                transition
                hover:bg-violet-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {running ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Try AI Again
            </button>

            <button
              type="button"
              onClick={handleStartTeacherReview}
              disabled={
                readOnly ||
                running ||
                startingReview
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-slate-900
                px-3
                py-2
                text-xs
                font-semibold
                text-white
                transition
                hover:bg-slate-800
                disabled:cursor-not-allowed
                disabled:opacity-50
                dark:bg-white
                dark:text-slate-900
                dark:hover:bg-slate-200
              "
            >
              {startingReview ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <GraduationCap className="h-3.5 w-3.5" />
              )}
              Evaluate Manually
            </button>
          </div>
        </div>
      )}

      {message && (
        <div
          className="
            rounded-xl
            border
            border-emerald-200
            bg-emerald-50
            px-3
            py-2.5
            text-sm
            text-emerald-700
            dark:border-emerald-900
            dark:bg-emerald-950/30
            dark:text-emerald-300
          "
        >
          {message}
        </div>
      )}
    </div>
  );
}

/* =========================================================
 * Teacher Review Form
 * ========================================================= */

function TeacherReviewForm({
  question,
  onUpdated,
  readOnly = false,
}: {
  question: SubjectiveAttemptEvaluationQuestion;
  readOnly?: boolean;
  onUpdated: (
    evaluationId: string,
    values: {
      teacherMarks: number | null;
      teacherFeedback: string | null;
      teacherNote: string | null;
      evaluationStatus?:
        | "PENDING"
        | "AI_ASSISTED"
        | "TEACHER_REVIEW"
        | "EVALUATED";
      finalMarks?: number | null;
    },
  ) => void;
}) {
  /*
   * IMPORTANT:
   * Keep all hooks unconditional. The previous implementation returned
   * before the state hooks when evaluationRecord was missing, which could
   * make the hook order unstable when switching questions.
   */
  const evaluationRecord = question.evaluation;

  const evaluationId = evaluationRecord?.id ?? "";
  const evaluationStatus =
    evaluationRecord?.evaluationStatus ?? null;

  const initialTeacherMarks =
    evaluationRecord?.teacherMarks ?? null;
  const initialTeacherFeedback =
    evaluationRecord?.teacherFeedback ?? null;
  const initialTeacherNote =
    evaluationRecord?.teacherNote ?? null;

  const [saving, setSaving] = useState(false);
  const [message, setMessage] =
    useState<string | null>(null);
  const [error, setError] =
    useState<string | null>(null);

  const [teacherMarks, setTeacherMarks] =
    useState<number | string>(
      initialTeacherMarks ?? "",
    );

  const [teacherFeedback, setTeacherFeedback] =
    useState(
      initialTeacherFeedback ?? "",
    );

  const [teacherNote, setTeacherNote] =
    useState(
      initialTeacherNote ?? "",
    );

  /*
   * The evaluation object is server-backed data. When the page is
   * refreshed, or when the parent receives the latest evaluation record,
   * synchronize the controlled form fields with the authoritative values
   * coming from the server.
   *
   * This also fixes stale local state when moving between questions.
   * User typing is not overwritten because this effect only runs when the
   * actual evaluation record values change.
   */
  useEffect(() => {
    setTeacherMarks(
      evaluationRecord?.teacherMarks ?? "",
    );
    setTeacherFeedback(
      evaluationRecord?.teacherFeedback ?? "",
    );
    setTeacherNote(
      evaluationRecord?.teacherNote ?? "",
    );
  }, [
    evaluationRecord?.id,
    evaluationRecord?.teacherMarks,
    evaluationRecord?.teacherFeedback,
    evaluationRecord?.teacherNote,
  ]);

  const isEvaluated =
    evaluationStatus === "EVALUATED";

  const isTeacherReview =
    evaluationStatus === "TEACHER_REVIEW";

  if (!evaluationRecord) {
    return (
      <div
        className="
          rounded-xl
          border
          border-dashed
          border-slate-300
          bg-slate-50
          p-5
          dark:border-slate-700
          dark:bg-slate-950
        "
      >
        <p
          className="
            text-sm
            text-slate-500
            dark:text-slate-400
          "
        >
          No evaluation record is available for this question.
        </p>
      </div>
    );
  }

  if (
    evaluationStatus === "PENDING" ||
    evaluationStatus === "AI_ASSISTED"
  ) {
    return null;
  }

  async function handleSaveDraft() {
    if (
      readOnly ||
      isEvaluated ||
      !isTeacherReview
    ) {
      return;
    }

    const normalizedMarks =
      teacherMarks === ""
        ? null
        : Number(teacherMarks);

    if (
      normalizedMarks !== null &&
      (
        Number.isNaN(normalizedMarks) ||
        normalizedMarks < 0 ||
        normalizedMarks > question.marks
      )
    ) {
      setError(
        `Teacher marks must be between 0 and ${question.marks}.`,
      );
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const result =
        await saveSubjectiveTeacherEvaluationDraft(
          evaluationId,
          normalizedMarks,
          teacherFeedback,
          teacherNote,
        );

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessage(
        "Teacher evaluation draft saved.",
      );

      onUpdated(evaluationId, {
        teacherMarks:
          result.teacherMarks,
        teacherFeedback:
          result.teacherFeedback,
        teacherNote:
          result.teacherNote,
        evaluationStatus:
          "TEACHER_REVIEW",
      });
    } catch (caughtError) {
      console.error(
        "Failed to save teacher evaluation draft:",
        caughtError,
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save the teacher evaluation draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="
        rounded-xl
        border
        border-slate-200
        bg-slate-50
        p-4
        dark:border-slate-700
        dark:bg-slate-950
      "
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap
            className="
              h-4
              w-4
              text-slate-500
            "
          />

          <span
            className="
              text-sm
              font-semibold
              text-slate-800
              dark:text-slate-200
            "
          >
            Teacher Evaluation
          </span>
        </div>

        <EvaluationStatusBadge
          status={evaluationStatus}
        />
      </div>

      {isTeacherReview && (
        <div className="mt-4 space-y-4">
          <div
            className="
              grid
              gap-4
              sm:grid-cols-[160px_minmax(0,1fr)]
            "
          >
            {/* Teacher Marks */}

            <div>
              <label
                htmlFor={`marks-${evaluationId}`}
                className="
                  text-xs
                  font-medium
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Teacher Marks
              </label>

              <div className="mt-1 flex items-center gap-2">
                <input
                  id={`marks-${evaluationId}`}
                  type="number"
                  min={0}
                  max={question.marks}
                  step="0.5"
                  value={teacherMarks}
                  onChange={(event) =>
                    setTeacherMarks(
                      event.target.value,
                    )
                  }
                  disabled={readOnly}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    bg-white
                    px-3
                    py-2.5
                    text-sm
                    text-slate-900
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                    disabled:cursor-not-allowed
                    disabled:bg-slate-100
                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:text-white
                    dark:focus:ring-blue-950
                    dark:disabled:bg-slate-800
                  "
                />

                <span
                  className="
                    shrink-0
                    text-sm
                    text-slate-400
                  "
                >
                  / {question.marks}
                </span>
              </div>
            </div>

            {/* Teacher Feedback */}

            <div>
              <label
                htmlFor={`feedback-${evaluationId}`}
                className="
                  text-xs
                  font-medium
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Teacher Feedback
              </label>

              <textarea
                id={`feedback-${evaluationId}`}
                value={teacherFeedback}
                onChange={(event) =>
                  setTeacherFeedback(
                    event.target.value,
                  )
                }
                disabled={readOnly}
                rows={3}
                placeholder="Write feedback for the student..."
                className="
                  mt-1
                  w-full
                  resize-y
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  leading-6
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                  disabled:cursor-not-allowed
                  disabled:bg-slate-100
                  dark:border-slate-700
                  dark:bg-slate-900
                  dark:text-white
                  dark:focus:ring-blue-950
                  dark:disabled:bg-slate-800
                "
              />
            </div>
          </div>

          {/* Teacher Note */}

          <div>
            <label
              htmlFor={`note-${evaluationId}`}
              className="
                text-xs
                font-medium
                text-slate-500
                dark:text-slate-400
              "
            >
              Teacher Note
            </label>

            <textarea
              id={`note-${evaluationId}`}
              value={teacherNote}
              onChange={(event) =>
                setTeacherNote(
                  event.target.value,
                )
              }
              disabled={readOnly}
              rows={2}
              placeholder="Optional private note for this question..."
              className="
                mt-1
                w-full
                resize-y
                rounded-xl
                border
                border-slate-300
                bg-white
                px-3
                py-2.5
                text-sm
                leading-6
                text-slate-900
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
                disabled:cursor-not-allowed
                disabled:bg-slate-100
                dark:border-slate-700
                dark:bg-slate-900
                dark:text-white
                dark:focus:ring-blue-950
                dark:disabled:bg-slate-800
              "
            />
          </div>

          {error && (
            <div
              className="
                rounded-xl
                border
                border-red-200
                bg-red-50
                px-3
                py-2.5
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

          {message && (
            <div
              className="
                rounded-xl
                border
                border-emerald-200
                bg-emerald-50
                px-3
                py-2.5
                text-sm
                text-emerald-700
                dark:border-emerald-900
                dark:bg-emerald-950/30
                dark:text-emerald-300
              "
            >
              {message}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={
                readOnly ||
                saving
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-blue-600
                px-4
                py-2.5
                text-sm
                font-medium
                text-white
                transition
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {saving ? (
                <>
                  <Loader2
                    className="
                      h-4
                      w-4
                      animate-spin
                    "
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Draft
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {isEvaluated && (
        <div className="mt-4">
          <div
            className="
              grid
              gap-4
              sm:grid-cols-[160px_minmax(0,1fr)]
            "
          >
            {/* Final Marks */}

            <div>
              <p
                className="
                  text-xs
                  text-slate-400
                "
              >
                Final Marks
              </p>

              <p
                className="
                  mt-1
                  text-lg
                  font-semibold
                  text-slate-900
                  dark:text-white
                "
              >
                {evaluationRecord.finalMarks ??
                  evaluationRecord.teacherMarks ??
                  "—"}

                <span
                  className="
                    ml-1
                    text-xs
                    font-normal
                    text-slate-400
                  "
                >
                  / {question.marks}
                </span>
              </p>
            </div>

            {/* Teacher Feedback */}

            <div>
              <p
                className="
                  text-xs
                  text-slate-400
                "
              >
                Teacher Feedback
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-slate-700
                  dark:text-slate-300
                "
              >
                {evaluationRecord.teacherFeedback ||
                  "No feedback recorded."}
              </p>
            </div>

            <div>
              <p
                className="
                  text-xs
                  text-slate-400
                "
              >
                Teacher Note
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-slate-700
                  dark:text-slate-300
                "
              >
                {evaluationRecord.teacherNote ||
                  "No teacher note recorded."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
 * Question Card
 * ========================================================= */

function QuestionCard({
  question,
  onUpdated,
  onAiUpdated,
  readOnly = false,
}: {
  question: SubjectiveAttemptEvaluationQuestion;
  readOnly?: boolean;
  onUpdated: (
    evaluationId: string,
    values: {
      teacherMarks: number | null;
      teacherFeedback: string | null;
      teacherNote: string | null;
      evaluationStatus?: "PENDING" | "AI_ASSISTED" | "TEACHER_REVIEW" | "EVALUATED";
      finalMarks?: number | null;
    },
  ) => void;
  onAiUpdated: (
    evaluationId: string,
    values: AiUpdatedValues,
  ) => void;
}) {
  const evaluationStatus =
    question.evaluation
      ?.evaluationStatus ?? null;

  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
        dark:border-slate-700
        dark:bg-slate-900
      "
    >
      {/* Header */}

      <div
        className="
          border-b
          border-slate-200
          bg-slate-50/80
          px-5
          py-4
          dark:border-slate-700
          dark:bg-slate-950/50
        "
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-slate-900
                text-sm
                font-semibold
                text-white
                dark:bg-white
                dark:text-slate-900
              "
            >
              {question.questionOrder}
            </span>

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-slate-900
                  dark:text-white
                "
              >
                Question{" "}
                {question.questionOrder}
              </p>

              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-400
                "
              >
                Maximum marks:{" "}
                {question.marks}
              </p>
            </div>
          </div>

          <EvaluationStatusBadge
            status={evaluationStatus}
          />
        </div>
      </div>

      <div className="space-y-6 p-5">
        {/* Question */}

        <div>
          <div
            className="
              mb-2
              flex
              items-center
              gap-2
              text-xs
              font-medium
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            <BookOpen className="h-3.5 w-3.5" />
            Question
          </div>

          <div
            className="
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-5
              py-4
              dark:border-slate-700
              dark:bg-slate-950
            "
          >
            <QuestionContent
              text={
                question.questionText
              }
            />
          </div>
        </div>

        {/* Student Solution */}

        <div>
          <div
            className="
              mb-2
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                text-xs
                font-medium
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              <FileText className="h-3.5 w-3.5" />
              Student Solution
            </div>

            {question.submission && (
              <span
                className="
                  text-xs
                  text-slate-400
                "
              >
                {question.submission.status}
              </span>
            )}
          </div>

          {question.submission
            ?.answerText ? (
            <div
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                p-4
                text-sm
                leading-6
                text-slate-700
                dark:border-slate-700
                dark:bg-slate-950
                dark:text-slate-300
              "
            >
              {question.submission.answerText}
            </div>
          ) : (
            <div
              className="
                rounded-xl
                border
                border-dashed
                border-slate-300
                bg-slate-50
                px-4
                py-3
                text-sm
                text-slate-400
                dark:border-slate-700
                dark:bg-slate-950
              "
            >
              No written response text.
            </div>
          )}

          <div className="mt-3">
            <SolutionFiles
              question={question}
            />
          </div>
        </div>

        {/* Evaluation Method / AI Assistance */}

        <EvaluationMethodPanel
          question={question}
          onUpdated={onAiUpdated}
          readOnly={readOnly}
        />

        {/* Teacher Evaluation */}

        <TeacherReviewForm
          key={question.evaluation?.id ?? question.attemptQuestionId}
          question={question}
          onUpdated={onUpdated}
          readOnly={readOnly}
        />
      </div>
    </section>
  );
}

/* =========================================================
 * Main Workspace
 * ========================================================= */

function isQuestionEvaluated(
  question: SubjectiveAttemptEvaluationQuestion,
): boolean {
  const evaluation = question.evaluation;

  if (!evaluation) {
    return false;
  }

  return (
    evaluation.evaluationStatus === "EVALUATED" ||
    evaluation.teacherMarks !== null
  );
}

function getQuestionEvaluationMethod(
  question: SubjectiveAttemptEvaluationQuestion,
): "AI Assisted Evaluation" | "Manual Evaluation" | null {
  const evaluation = question.evaluation;

  if (!evaluation) {
    return null;
  }

  if (
    evaluation.aiSuggestedMarks !== null &&
    evaluation.aiSuggestedMarks !== undefined
  ) {
    return "AI Assisted Evaluation";
  }

  if (
    evaluation.teacherMarks !== null &&
    evaluation.teacherMarks !== undefined
  ) {
    return "Manual Evaluation";
  }

  return null;
}

export default function SubjectiveAttemptEvaluationWorkspace({
  workspace,
}: Props) {
  const [
    selectedQuestionIndex,
    setSelectedQuestionIndex,
  ] = useState(0);

  /*
   * Keep a local copy of questions so that
   * teacher review / draft changes appear
   * immediately without a page refresh.
   */
  const [
    questions,
    setQuestions,
  ] = useState(
    workspace.questions,
  );

  /*
   * Attempt-level finalization is intentionally separate
   * from question-level Save Draft.
   *
   * The database remains the source of truth. This local
   * flag immediately locks the current workspace after the
   * finalization RPC succeeds.
   */
  const initialAttemptFinalized =
    ("status" in workspace.attempt &&
      workspace.attempt.status === "EVALUATED") ||
    ("attemptStatus" in workspace.attempt &&
      workspace.attempt.attemptStatus ===
        "EVALUATED");

  const [
    attemptFinalized,
    setAttemptFinalized,
  ] = useState(initialAttemptFinalized);

  const [
    finishingEvaluation,
    setFinishingEvaluation,
  ] = useState(false);

  const [
    finishMessage,
    setFinishMessage,
  ] = useState<string | null>(null);

  const [
    finishError,
    setFinishError,
  ] = useState<string | null>(null);

  const [
    overallTeacherNote,
    setOverallTeacherNote,
  ] = useState("");

  const selectedQuestion =
    questions[
      selectedQuestionIndex
    ];

  // UI-level evaluation means the teacher has actually entered marks
  // or the question has already been finalized. This is intentionally
  // separate from EVALUATED, which remains the attempt-finalization state.
  const evaluatedQuestionCount =
    questions.filter(isQuestionEvaluated).length;

  // AI-assisted means an AI suggestion exists, even when the question
  // has subsequently moved into TEACHER_REVIEW.
  const aiAssistedCount =
    questions.filter(
      (question) =>
        question.evaluation
          ?.aiSuggestedMarks !== null &&
        question.evaluation
          ?.aiSuggestedMarks !== undefined,
    ).length;

  const manualEvaluationCount =
    questions.filter(
      (question) =>
        question.evaluation
          ?.teacherMarks !== null &&
        question.evaluation
          ?.teacherMarks !== undefined &&
        (question.evaluation
          ?.aiSuggestedMarks === null ||
          question.evaluation
            ?.aiSuggestedMarks === undefined),
    ).length;

  const teacherReviewCount =
    questions.filter(
      (question) =>
        question.evaluation
          ?.evaluationStatus ===
        "TEACHER_REVIEW" &&
        !isQuestionEvaluated(question),
    ).length;

  const pendingCount =
    questions.filter(
      (question) =>
        !isQuestionEvaluated(question),
    ).length;

  // This is the authoritative count required before Finish Evaluation.
  // Keep it separate so the existing finalization contract does not change.
  const finalMarks =
    questions.reduce(
      (total, question) => {
        const marks =
          question.evaluation
            ?.finalMarks ??
          question.evaluation
            ?.teacherMarks ??
          0;

        return total + Number(marks);
      },
      0,
    );

  const progressPercent =
    useMemo(() => {
      if (
        questions.length ===
        0
      ) {
        return 0;
      }

      return Math.round(
        (evaluatedQuestionCount /
          questions.length) *
          100,
      );
    }, [
      evaluatedQuestionCount,
      questions.length,
    ]);

  const hasPrevious =
    selectedQuestionIndex > 0;

  const hasNext =
    selectedQuestionIndex <
    questions.length - 1;

  function handleQuestionUpdated(
    evaluationId: string,
    values: {
      teacherMarks: number | null;
      teacherFeedback: string | null;
      teacherNote: string | null;
      evaluationStatus?: "PENDING" | "AI_ASSISTED" | "TEACHER_REVIEW" | "EVALUATED";
      finalMarks?: number | null;
    },
  ) {
    setQuestions(
      (currentQuestions) =>
        currentQuestions.map(
          (question) => {
            if (
              question.evaluation
                ?.id !==
              evaluationId
            ) {
              return question;
            }

            return {
              ...question,
              evaluation: {
                ...question.evaluation,
                teacherMarks:
                  values.teacherMarks,
                teacherFeedback:
                  values.teacherFeedback,
                teacherNote:
                  values.teacherNote,
                finalMarks:
                  values.finalMarks ??
                  question.evaluation.finalMarks,
                evaluationStatus:
                  values.evaluationStatus ??
                  (question.evaluation
                    .evaluationStatus ===
                  "PENDING"
                    ? "TEACHER_REVIEW"
                    : question.evaluation
                        .evaluationStatus ===
                      "AI_ASSISTED"
                    ? "TEACHER_REVIEW"
                    : question.evaluation
                        .evaluationStatus),
              },
            };
          },
        ),
    );
  }

  function handleQuestionAiUpdated(
    evaluationId: string,
    values: AiUpdatedValues,
  ) {
    setQuestions(
      (currentQuestions) =>
        currentQuestions.map(
          (question) => {
            if (
              question.evaluation
                ?.id !==
              evaluationId
            ) {
              return question;
            }

            return {
              ...question,
              evaluation: {
                ...question.evaluation,
                aiSuggestedMarks:
                  values.aiSuggestedMarks,
                aiFeedback:
                  values.aiFeedback,
                aiAnalysis:
                  values.aiAnalysis,
                evaluationStatus:
                  values.evaluationStatus,
              },
            };
          },
        ),
    );
  }

  async function handleFinishEvaluation() {
    if (attemptFinalized || finishingEvaluation) {
      return;
    }

    if (
      questions.length === 0 ||
      evaluatedQuestionCount !== questions.length
    ) {
      setFinishError(
        `All ${questions.length} questions must be evaluated before finishing the set.`,
      );
      setFinishMessage(null);
      return;
    }

    const confirmed = window.confirm(
      "All questions have been evaluated. Do you want to finish this student's evaluation? After finishing, teacher evaluation and annotations will be locked.",
    );

    if (!confirmed) {
      return;
    }

    setFinishingEvaluation(true);
    setFinishError(null);
    setFinishMessage(null);

    try {
      const attemptId =
        "attemptId" in workspace.attempt &&
        typeof workspace.attempt.attemptId === "string"
          ? workspace.attempt.attemptId
          : "id" in workspace.attempt &&
              typeof workspace.attempt.id === "string"
            ? workspace.attempt.id
            : "";

      if (!attemptId) {
        setFinishError(
          "Subjective attempt ID is not available.",
        );
        return;
      }

      /*
       * Save Draft intentionally keeps question-level evaluations in
       * TEACHER_REVIEW. Finish Evaluation is the final teacher action, so
       * first promote every reviewed question that has teacher marks to
       * EVALUATED using the existing secure teacher-finalization action.
       */
      const questionsToFinalize =
        questions.filter((question) => {
          const evaluation = question.evaluation;

          return (
            evaluation?.evaluationStatus ===
              "TEACHER_REVIEW" &&
            evaluation.teacherMarks !== null
          );
        });

      for (const question of questionsToFinalize) {
        const evaluation = question.evaluation;

        if (!evaluation) {
          continue;
        }

        const questionResult =
          await finalizeSubjectiveTeacherEvaluation(
            evaluation.id,
            Number(evaluation.teacherMarks),
            evaluation.teacherFeedback ?? "",
            evaluation.teacherNote ?? "",
          );

        if (!questionResult.success) {
          setFinishError(
            `Unable to finalize Question ${question.questionOrder}: ${questionResult.error}`,
          );
          return;
        }

        setQuestions((currentQuestions) =>
          currentQuestions.map((currentQuestion) => {
            if (
              currentQuestion.evaluation?.id !==
              evaluation.id
            ) {
              return currentQuestion;
            }

            return {
              ...currentQuestion,
              evaluation: {
                ...currentQuestion.evaluation,
                teacherMarks: questionResult.teacherMarks,
                teacherFeedback: questionResult.teacherFeedback,
                teacherNote: questionResult.teacherNote,
                evaluationStatus: "EVALUATED",
                finalMarks: questionResult.finalMarks,
                evaluatedBy: questionResult.evaluatedBy,
                evaluatedAt: questionResult.evaluatedAt,
              },
            };
          }),
        );
      }

      const result =
        await finalizeSubjectiveAttempt(
          attemptId,
          overallTeacherNote,
        );

      if (!result.success) {
        setFinishError(result.error);
        return;
      }

      /*
       * The attempt finalization RPC is the authoritative final step.
       * Reflect the complete evaluated state locally so the current page
       * immediately becomes read-only without requiring a refresh.
       */
      setQuestions((currentQuestions) =>
        currentQuestions.map((question) => {
          if (!question.evaluation) {
            return question;
          }

          return {
            ...question,
            evaluation: {
              ...question.evaluation,
              evaluationStatus: "EVALUATED",
              finalMarks:
                question.evaluation.teacherMarks ??
                question.evaluation.finalMarks,
            },
          };
        }),
      );

      setAttemptFinalized(true);
      setFinishMessage(
        "Student evaluation completed successfully. The checked copy is now ready for the student dashboard.",
      );
    } catch (caughtError) {
      console.error(
        "Failed to finish Subjective attempt evaluation:",
        caughtError,
      );

      setFinishError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to finish the student's evaluation.",
      );
    } finally {
      setFinishingEvaluation(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* =====================================================
          Header
         ===================================================== */}

      <section
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-sm
          dark:border-slate-700
          dark:bg-slate-900
        "
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  bg-blue-50
                  px-2.5
                  py-1
                  text-xs
                  font-medium
                  text-blue-700
                  dark:bg-blue-950/40
                  dark:text-blue-300
                "
              >
                <Layers3 className="h-3.5 w-3.5" />

                {workspace.set
                  ? `Set ${workspace.set.setNumber}`
                  : "Subjective Set"}
              </span>

              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  bg-slate-100
                  px-2.5
                  py-1
                  text-xs
                  font-medium
                  text-slate-600
                  dark:bg-slate-800
                  dark:text-slate-300
                "
              >
                Attempt{" "}
                {
                  workspace.attempt
                    .attemptNumber
                }
              </span>
            </div>

            <h1
              className="
                mt-3
                text-2xl
                font-semibold
                tracking-tight
                text-slate-900
                dark:text-white
              "
            >
              {workspace.set?.title ??
                "Subjective Evaluation"}
            </h1>

            <div
              className="
                mt-3
                flex
                flex-wrap
                items-center
                gap-x-5
                gap-y-2
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="h-4 w-4" />
                Student:{" "}
                {workspace.attempt.studentName ?? workspace.attempt.userId}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {
                  workspace.resource
                    ?.chapterName ??
                  "Subjective Chapter"
                }
              </span>

              <span>
                {categoryLabel(
                  workspace.set
                    ?.category ?? "",
                )}
              </span>
            </div>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              px-5
              py-4
              dark:border-slate-700
              dark:bg-slate-950
            "
          >
            <p
              className="
                text-xs
                font-medium
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Submitted
            </p>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                text-slate-800
                dark:text-slate-200
              "
            >
              {formatDate(
                workspace.attempt
                  .submittedAt,
              )}
            </p>
          </div>
        </div>

        {/* Progress */}

        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p
                className="
                  text-sm
                  font-medium
                  text-slate-700
                  dark:text-slate-300
                "
              >
                Evaluation Progress
              </p>

              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-400
                "
              >
                {evaluatedQuestionCount}{" "}
                of{" "}
                {questions.length}{" "}
                questions evaluated
              </p>
            </div>

            <span
              className="
                text-sm
                font-semibold
                text-slate-900
                dark:text-white
              "
            >
              {progressPercent}%
            </span>
          </div>

          <div
            className="
              mt-3
              h-2
              overflow-hidden
              rounded-full
              bg-slate-100
              dark:bg-slate-800
            "
          >
            <div
              className="
                h-full
                rounded-full
                bg-blue-600
                transition-all
              "
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          Summary Cards
         ===================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          icon={BookOpen}
          label="Questions"
          value={questions.length}
        />

        <SummaryCard
          icon={FileText}
          label="Solutions"
          value={
            workspace.summary
              .submittedQuestionCount
          }
        />

        <SummaryCard
          icon={CheckCircle2}
          label="Evaluated"
          value={
            evaluatedQuestionCount
          }
        />

        <SummaryCard
          icon={BrainCircuit}
          label="AI Assisted"
          value={aiAssistedCount}
        />

        <SummaryCard
          icon={UserRound}
          label="Manual Evaluation"
          value={manualEvaluationCount}
        />

        <SummaryCard
          icon={GraduationCap}
          label="Final Marks"
          value={`${finalMarks} / ${workspace.summary.maxMarks}`}
        />
      </section>

      {/* =====================================================
          Teacher Evaluation Summary
         ===================================================== */}

      <section
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
          dark:border-slate-700
          dark:bg-slate-900
        "
      >
        <div
          className="
            border-b
            border-slate-200
            bg-slate-50/80
            px-5
            py-4
            dark:border-slate-700
            dark:bg-slate-950/50
          "
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-slate-900
                  dark:text-white
                "
              >
                Evaluation Summary
              </p>
              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Quick view of this student&apos;s current evaluation progress.
              </p>
            </div>

            <span
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-blue-50
                px-3
                py-1.5
                text-xs
                font-semibold
                text-blue-700
                dark:bg-blue-950/40
                dark:text-blue-300
              "
            >
              <UserRound className="h-3.5 w-3.5" />
              {workspace.attempt.studentName ?? workspace.attempt.userId}
            </span>
          </div>
        </div>

        <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4 dark:bg-slate-700">
          <div className="bg-white px-5 py-4 dark:bg-slate-900">
            <p className="text-xs text-slate-400">Student</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {workspace.attempt.studentName ?? workspace.attempt.userId}
            </p>
          </div>

          <div className="bg-white px-5 py-4 dark:bg-slate-900">
            <p className="text-xs text-slate-400">Manual Evaluated</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {manualEvaluationCount}
              <span className="ml-1 text-xs font-normal text-slate-400">
                questions
              </span>
            </p>
          </div>

          <div className="bg-white px-5 py-4 dark:bg-slate-900">
            <p className="text-xs text-slate-400">AI Assisted</p>
            <p className="mt-1 text-lg font-semibold text-violet-700 dark:text-violet-300">
              {aiAssistedCount}
              <span className="ml-1 text-xs font-normal text-slate-400">
                questions
              </span>
            </p>
          </div>

          <div className="bg-white px-5 py-4 dark:bg-slate-900">
            <p className="text-xs text-slate-400">Marks So Far</p>
            <p className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-300">
              {finalMarks} / {workspace.summary.maxMarks}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          Evaluation State Notice
         ===================================================== */}

      {(pendingCount > 0 ||
        teacherReviewCount > 0) && (
        <section
          className="
            rounded-2xl
            border
            border-blue-200
            bg-blue-50/70
            px-5
            py-4
            dark:border-blue-900
            dark:bg-blue-950/20
          "
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-blue-600" />

              <span
                className="
                  text-sm
                  font-medium
                  text-blue-800
                  dark:text-blue-200
                "
              >
                Evaluation status
              </span>
            </div>

            {pendingCount > 0 && (
              <span className="text-xs text-blue-700 dark:text-blue-300">
                {pendingCount} awaiting method
              </span>
            )}

            {teacherReviewCount > 0 && (
              <span className="text-xs text-amber-700 dark:text-amber-300">
                {teacherReviewCount} in teacher review
              </span>
            )}
          </div>
        </section>
      )}

      {/* =====================================================
          Attempt-Level Finalization
         ===================================================== */}

      <section
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
          dark:border-slate-700
          dark:bg-slate-900
        "
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="
                  h-4
                  w-4
                  text-emerald-600
                  dark:text-emerald-400
                "
              />
              <h2
                className="
                  text-sm
                  font-semibold
                  text-slate-900
                  dark:text-white
                "
              >
                Finish Evaluation
              </h2>
            </div>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-slate-500
                dark:text-slate-400
              "
            >
              Question-level work is saved with Save Draft.
              Finish the student&apos;s complete set only after every
              question has been evaluated.
            </p>
          </div>

          <div
            className="
              shrink-0
              rounded-xl
              bg-slate-50
              px-4
              py-3
              text-right
              dark:bg-slate-950
            "
          >
            <p className="text-xs text-slate-400">
              Evaluation Progress
            </p>
            <p
              className="
                mt-0.5
                text-sm
                font-semibold
                text-slate-800
                dark:text-slate-200
              "
            >
              {evaluatedQuestionCount} / {questions.length}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="overall-teacher-note"
            className="
              text-xs
              font-medium
              text-slate-500
              dark:text-slate-400
            "
          >
            Overall Teacher&apos;s Note
          </label>

          <textarea
            id="overall-teacher-note"
            value={overallTeacherNote}
            onChange={(event) =>
              setOverallTeacherNote(
                event.target.value,
              )
            }
            disabled={attemptFinalized}
            rows={3}
            placeholder="Write an overall note for the student about this complete set..."
            className="
              mt-1
              w-full
              resize-y
              rounded-xl
              border
              border-slate-300
              bg-white
              px-3
              py-2.5
              text-sm
              leading-6
              text-slate-900
              outline-none
              transition
              placeholder:text-slate-400
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
              disabled:cursor-not-allowed
              disabled:bg-slate-100
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-white
              dark:focus:ring-blue-950
              dark:disabled:bg-slate-800
            "
          />
        </div>

        {finishError && (
          <div
            className="
              mt-4
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-3
              py-2.5
              text-sm
              text-red-700
              dark:border-red-900
              dark:bg-red-950/30
              dark:text-red-300
            "
          >
            {finishError}
          </div>
        )}

        {finishMessage && (
          <div
            className="
              mt-4
              rounded-xl
              border
              border-emerald-200
              bg-emerald-50
              px-3
              py-2.5
              text-sm
              text-emerald-700
              dark:border-emerald-900
              dark:bg-emerald-950/30
              dark:text-emerald-300
            "
          >
            {finishMessage}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p
            className="
              text-xs
              leading-5
              text-slate-400
              dark:text-slate-500
            "
          >
            {attemptFinalized
              ? "This complete evaluation is locked."
              : evaluatedQuestionCount === questions.length
                ? "All questions are evaluated. You can now finish this set."
                : `${questions.length - evaluatedQuestionCount} question(s) still need evaluation.`}
          </p>

          <button
            type="button"
            onClick={handleFinishEvaluation}
            disabled={
              attemptFinalized ||
              finishingEvaluation ||
              questions.length === 0 ||
              evaluatedQuestionCount !==
                questions.length
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-emerald-600
              px-5
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-emerald-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {finishingEvaluation ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Finishing...
              </>
            ) : attemptFinalized ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Evaluation Finished
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Finish Evaluation
              </>
            )}
          </button>
        </div>
      </section>

      {/* =====================================================
          Main Evaluation Area
         ===================================================== */}

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Question Navigation */}

        <aside
          className="
            h-fit
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-3
            shadow-sm
            dark:border-slate-700
            dark:bg-slate-900
            lg:sticky
            lg:top-6
          "
        >
          <div className="px-2 pb-3 pt-1">
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Questions
            </p>
          </div>

          <div className="space-y-1.5">
            {questions.map(
              (
                question,
                index,
              ) => {
                const active =
                  index ===
                  selectedQuestionIndex;

                const evaluated =
                  isQuestionEvaluated(question);

                const method =
                  getQuestionEvaluationMethod(question);

                return (
                  <button
                    key={
                      question.attemptQuestionId
                    }
                    type="button"
                    onClick={() =>
                      setSelectedQuestionIndex(
                        index,
                      )
                    }
                    className={`
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      transition
                      ${
                        active
                          ? evaluated
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-blue-600 text-white shadow-sm"
                          : evaluated
                            ? "bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
                            : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      }
                    `}
                  >
                    <span
                      className={`
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        text-xs
                        font-semibold
                        ${
                          active
                            ? "bg-white/15 text-white"
                            : evaluated
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }
                      `}
                    >
                      {
                        question.questionOrder
                      }
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        Question{" "}
                        {
                          question.questionOrder
                        }
                      </p>

                      <p
                        className={`
                          mt-0.5
                          text-[11px]
                          font-medium
                          ${
                            active
                              ? "text-white/90"
                              : evaluated
                                ? "text-emerald-700 dark:text-emerald-300"
                                : "text-slate-400"
                          }
                        `}
                      >
                        {evaluated
                          ? "Evaluated"
                          : "Not Evaluated"}
                      </p>

                      {method && (
                        <p
                          className={`
                            mt-0.5
                            text-[10px]
                            ${
                              active
                                ? "text-white/75"
                                : evaluated
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-slate-400"
                            }
                          `}
                        >
                          {method}
                        </p>
                      )}
                    </div>

                    {evaluated && (
                      <CheckCircle2
                        className="
                          h-4
                          w-4
                          shrink-0
                        "
                      />
                    )}
                  </button>
                );
              },
            )}
          </div>
        </aside>

        {/* Selected Question */}

        <main className="min-w-0 space-y-4">
          {selectedQuestion ? (
            <QuestionCard
              question={
                selectedQuestion
              }
              onUpdated={
                handleQuestionUpdated
              }
              onAiUpdated={
                handleQuestionAiUpdated
              }
              readOnly={attemptFinalized}
            />
          ) : (
            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-slate-300
                bg-white
                p-12
                text-center
                dark:border-slate-700
                dark:bg-slate-900
              "
            >
              <AlertCircle
                className="
                  mx-auto
                  h-8
                  w-8
                  text-slate-400
                "
              />

              <p
                className="
                  mt-3
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                No question is available
                for this attempt.
              </p>
            </div>
          )}

          {/* Navigation */}

          {selectedQuestion && (
            <div
              className="
                flex
                items-center
                justify-between
                gap-3
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-3
                shadow-sm
                dark:border-slate-700
                dark:bg-slate-900
              "
            >
              <button
                type="button"
                disabled={!hasPrevious}
                onClick={() =>
                  setSelectedQuestionIndex(
                    (index) =>
                      Math.max(
                        0,
                        index - 1,
                      ),
                  )
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-slate-700
                  transition
                  hover:bg-slate-50
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  dark:border-slate-700
                  dark:text-slate-300
                  dark:hover:bg-slate-800
                "
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span
                className="
                  text-xs
                  text-slate-400
                "
              >
                Question{" "}
                {
                  selectedQuestion.questionOrder
                }{" "}
                of{" "}
                {questions.length}
              </span>

              <button
                type="button"
                disabled={!hasNext}
                onClick={() =>
                  setSelectedQuestionIndex(
                    (index) =>
                      Math.min(
                        questions.length -
                          1,
                        index + 1,
                      ),
                  )
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-slate-900
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-slate-800
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  dark:bg-white
                  dark:text-slate-900
                  dark:hover:bg-slate-200
                "
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* =========================================================
 * Summary Card
 * ========================================================= */

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number | string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-4
        shadow-sm
        dark:border-slate-700
        dark:bg-slate-900
      "
    >
      <div className="flex items-center gap-3">
        <div
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            bg-slate-100
            text-slate-600
            dark:bg-slate-800
            dark:text-slate-300
          "
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p
            className="
              text-xs
              text-slate-400
            "
          >
            {label}
          </p>

          <p
            className="
              mt-0.5
              text-lg
              font-semibold
              text-slate-900
              dark:text-white
            "
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
