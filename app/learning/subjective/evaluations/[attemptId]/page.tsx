import Link from "next/link";
import { notFound } from "next/navigation";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  MessageSquareText,
  NotebookPen,
} from "lucide-react";

import SubjectiveSolutionAnnotationViewer from "@/app/lib/teacher/subjective/SubjectiveSolutionAnnotationViewer";
import {
  getStudentSubjectiveEvaluation,
  type StudentSubjectiveEvaluationQuestion,
} from "@/lib/learning/subjective/student-evaluations";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMath(latex: string, displayMode: boolean) {
  try {
    return katex.renderToString(latex.trim(), {
      displayMode,
      throwOnError: false,
      output: "htmlAndMathml",
    });
  } catch {
    return escapeHtml(latex);
  }
}

function renderPlainText(text: string) {
  return escapeHtml(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "<br />");
}

function renderMathHtml(source: string) {
  if (!source) return "";

  let html = "";
  let cursor = 0;

  const pattern =
    /\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)|\$([^\n$]+?)\$/g;

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    html += renderPlainText(source.slice(cursor, match.index));

    if (match[1] !== undefined) {
      html += `<div class="my-4 overflow-x-auto text-center">${renderMath(match[1], true)}</div>`;
    } else if (match[2] !== undefined) {
      html += `<div class="my-4 overflow-x-auto text-center">${renderMath(match[2], true)}</div>`;
    } else if (match[3] !== undefined) {
      html += `<span class="mx-0.5 inline-block align-middle">${renderMath(match[3], false)}</span>`;
    } else if (match[4] !== undefined) {
      html += `<span class="mx-0.5 inline-block align-middle">${renderMath(match[4], false)}</span>`;
    }

    cursor = match.index + match[0].length;
  }

  html += renderPlainText(source.slice(cursor));
  return html;
}

function MathContent({
  text,
  muted = false,
}: {
  text: string | null | undefined;
  muted?: boolean;
}) {
  if (!text) return null;

  return (
    <div
      className={`text-[15px] leading-8 ${
        muted
          ? "text-slate-600 dark:text-slate-400"
          : "text-slate-800 dark:text-slate-200"
      } [&_.katex]:text-[1.05em] [&_.katex-display]:my-0 [&_.katex-display]:overflow-x-auto`}
      dangerouslySetInnerHTML={{ __html: renderMathHtml(text) }}
    />
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function percentage(marks: number, maxMarks: number) {
  if (maxMarks <= 0) return 0;
  return Math.round((marks / maxMarks) * 100);
}

function QuestionSection({
  question,
}: {
  question: StudentSubjectiveEvaluationQuestion;
}) {
  const obtained = question.evaluation?.marks_obtained ?? 0;
  const hasFiles = question.files.length > 0;
  const fileUrls = Object.fromEntries(
    question.files
      .filter((file) => Boolean(file.signed_url))
      .map((file) => [file.id, file.signed_url as string]),
  );

  return (
    <section
      id={`question-${question.attempt_question_id}`}
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-700 dark:bg-slate-950/60 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
              {question.question_order}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Question {question.question_order}
              </p>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Maximum marks: {question.marks}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50 px-4 py-2 text-right dark:bg-emerald-950/30">
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Marks Obtained
            </p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {obtained} / {question.marks}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <BookOpen className="h-4 w-4 text-blue-600" />
            Question
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <MathContent text={question.question_text} />
          </div>
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <NotebookPen className="h-4 w-4 text-slate-500" />
            Your Answer
          </h2>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/60">
            {question.submission?.answer_text ? (
              <MathContent text={question.submission.answer_text} />
            ) : (
              <p className="text-sm italic text-slate-400">
                No typed answer was submitted. Your handwritten answer is shown in the checked copy below.
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <MessageSquareText className="h-4 w-4 text-blue-600" />
            Teacher&apos;s Feedback
          </h2>
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            {question.evaluation?.teacher_feedback ? (
              <MathContent text={question.evaluation.teacher_feedback} />
            ) : (
              <p className="text-sm italic text-slate-400">
                No additional feedback was written for this question.
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Ideal Solution
          </h2>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900 dark:bg-emerald-950/15">
            {question.ideal_solution ? (
              <MathContent text={question.ideal_solution} />
            ) : (
              <p className="text-sm italic text-slate-400">
                Ideal solution is not available for this question.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <FileText className="h-4 w-4 text-red-600" />
                Checked Copy
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Your submitted copy with the teacher&apos;s markings and corrections.
              </p>
            </div>
          </div>

          {hasFiles ? (
            <SubjectiveSolutionAnnotationViewer
              evaluationId={question.evaluation?.id ?? ""}
              evaluationStatus="EVALUATED"
              forceReadOnly
              initialAnnotations={question.annotations}
              initialFileUrls={fileUrls}
              files={question.files.map((file) => ({
                id: file.id,
                file_path: file.file_path,
                file_name: file.file_name,
                mime_type: file.mime_type,
                page_number: file.page_number,
              }))}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-950">
              <FileText className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                No uploaded copy is available for this question.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function StudentSubjectiveEvaluationPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const evaluation = await getStudentSubjectiveEvaluation(attemptId);

  if (!evaluation) {
    notFound();
  }

  const maxMarks = evaluation.questions.reduce(
    (total, question) => total + Number(question.marks || 0),
    0,
  );
  const finalMarks = evaluation.questions.reduce(
    (total, question) =>
      total + Number(question.evaluation?.marks_obtained ?? 0),
    0,
  );
  const percent = percentage(finalMarks, maxMarks);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/learning"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Learning
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Checked
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Attempt {evaluation.attempt.attempt_number}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {evaluation.set.title}
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Checked on {formatDate(evaluation.attempt.evaluated_at)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs text-slate-400">Final Marks</p>
              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {finalMarks} / {maxMarks}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Score</p>
              <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {percent}%
              </p>
            </div>
          </div>
        </div>

        {evaluation.attempt.teacher_note && (
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Teacher&apos;s Overall Note
            </p>
            <div className="mt-2">
              <MathContent text={evaluation.attempt.teacher_note} />
            </div>
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 px-1">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Questions
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Jump to a question
              </p>
            </div>

            <nav className="space-y-1.5">
              {evaluation.questions.map((question) => {
                const obtained = question.evaluation?.marks_obtained ?? 0;

                return (
                  <a
                    key={question.attempt_question_id}
                    href={`#question-${question.attempt_question_id}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {question.question_order}
                      </span>
                      <span className="truncate">Question {question.question_order}</span>
                    </span>
                    <span className="ml-2 shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {obtained}/{question.marks}
                    </span>
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 space-y-6">
          {evaluation.questions.map((question) => (
            <QuestionSection
              key={question.attempt_question_id}
              question={question}
            />
          ))}
        </main>
      </div>
    </div>
  );
}
