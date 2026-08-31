import Link from "next/link";
import { notFound } from "next/navigation";

import MathText from "@/components/learning/MathText";
import { getLearningTestResult } from "@/lib/learning/results";

type PageProps = {
  params: Promise<{
    attemptId: string;
  }>;
};

export default async function LearningResultPage({
  params,
}: PageProps) {
  const { attemptId } = await params;

  const result = await getLearningTestResult(attemptId);

  if (!result) {
    notFound();
  }

  const isSubmitted =
    result.status === "SUBMITTED";

  const totalQuestions =
    result.correctCount +
    result.incorrectCount +
    result.unansweredCount;

  const percentage =
    typeof result.percentage === "number"
      ? result.percentage
      : null;

  const score =
    typeof result.score === "number"
      ? result.score
      : null;

  const resultLabel =
    percentage !== null
      ? percentage >= 80
        ? "Excellent work"
        : percentage >= 60
          ? "Good progress"
          : percentage >= 40
            ? "Keep building"
            : "Keep practicing"
      : "Result available";

  const resourceTitle =
    result.resource?.title ??
    result.test?.title ??
    "MCQ Practice Result";

  const testTitle =
    result.test?.title ?? null;

  const setNumber =
    result.resource?.setNumber ?? null;

  const resourceId =
    result.test?.resourceId ??
    result.resource?.id ??
    null;

  return (
    <main className="px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* =================================================
            Breadcrumb / Back
            ================================================= */}

        <div>
          <Link
            href="/learning"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-blue-700
              transition
              hover:text-blue-900
              dark:text-blue-400
              dark:hover:text-blue-300
            "
          >
            ← Back to Learning
          </Link>
        </div>

        {/* =================================================
            Result Header
            ================================================= */}

        <section
          className="
            overflow-hidden
            rounded-3xl
            border
            border-slate-200
            bg-white
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
            dark:shadow-none
          "
        >
          <div
            className="
              bg-blue-50
              px-8
              py-10
              dark:bg-blue-950/30
              sm:px-10
              lg:px-12
            "
          >
            <div className="max-w-3xl">

              <div className="flex flex-wrap items-center gap-2">

                {setNumber !== null && (
                  <span
                    className="
                      rounded-full
                      bg-white
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-slate-700
                      shadow-sm
                      dark:bg-slate-900
                      dark:text-slate-300
                    "
                  >
                    Set {setNumber}
                  </span>
                )}

                <span
                  className="
                    rounded-full
                    bg-white
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-slate-700
                    shadow-sm
                    dark:bg-slate-900
                    dark:text-slate-300
                  "
                >
                  Attempt {result.attemptNumber}
                </span>
              </div>

              <p
                className="
                  mt-6
                  text-sm
                  font-semibold
                  uppercase
                  tracking-widest
                  text-blue-700
                  dark:text-blue-400
                "
              >
                Practice Result
              </p>

              <h1
                className="
                  mt-2
                  text-3xl
                  font-bold
                  tracking-tight
                  text-blue-950
                  dark:text-blue-200
                  sm:text-4xl
                "
              >
                {resourceTitle}
              </h1>

              {testTitle &&
                testTitle !== resourceTitle && (
                  <p
                    className="
                      mt-2
                      text-sm
                      text-slate-600
                      dark:text-slate-400
                    "
                  >
                    {testTitle}
                  </p>
                )}

              <p
                className="
                  mt-5
                  max-w-2xl
                  text-base
                  leading-7
                  text-slate-600
                  dark:text-slate-300
                "
              >
                {isSubmitted
                  ? resultLabel
                  : "This attempt has not been submitted yet."}
              </p>
            </div>
          </div>

          {/* =================================================
              Main Score
              ================================================= */}

          <div
            className="
              grid
              gap-6
              px-8
              py-8
              sm:grid-cols-2
              sm:px-10
              lg:grid-cols-4
              lg:px-12
            "
          >
            <ResultHighlight
              label="Score"
              value={
                score !== null
                  ? formatNumber(score)
                  : "—"
              }
            />

            <ResultHighlight
              label="Percentage"
              value={
                percentage !== null
                  ? `${formatNumber(percentage)}%`
                  : "—"
              }
            />

            <ResultHighlight
              label="Questions"
              value={totalQuestions}
            />

            <ResultHighlight
              label="Status"
              value={
                isSubmitted
                  ? "Completed"
                  : "In Progress"
              }
            />
          </div>
        </section>

        {/* =================================================
            Performance Summary
            ================================================= */}

        <section>
          <div className="mb-5">
            <p
              className="
                text-sm
                font-semibold
                uppercase
                tracking-widest
                text-blue-700
                dark:text-blue-400
              "
            >
              Performance
            </p>

            <h2
              className="
                mt-2
                text-2xl
                font-bold
                text-slate-900
                dark:text-slate-100
              "
            >
              How you performed
            </h2>
          </div>

          <div
            className="
              grid
              gap-4
              sm:grid-cols-3
            "
          >
            <PerformanceCard
              label="Correct"
              value={result.correctCount}
              description="Questions answered correctly"
              tone="success"
            />

            <PerformanceCard
              label="Incorrect"
              value={result.incorrectCount}
              description="Questions that need another look"
              tone="danger"
            />

            <PerformanceCard
              label="Unanswered"
              value={result.unansweredCount}
              description="Questions left unanswered"
              tone="neutral"
            />
          </div>
        </section>

        {/* =================================================
            Question-wise Review
            ================================================= */}

        <section>
          <div className="mb-5">
            <p
              className="
                text-sm
                font-semibold
                uppercase
                tracking-widest
                text-blue-700
                dark:text-blue-400
              "
            >
              Question Review
            </p>

            <h2
              className="
                mt-2
                text-2xl
                font-bold
                text-slate-900
                dark:text-slate-100
              "
            >
              Review your answers
            </h2>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-slate-500
                dark:text-slate-400
              "
            >
              Look at each question carefully. The goal
              is not only to know your score, but to
              understand where your thinking was right
              and where it needs more attention.
            </p>
          </div>

          {result.questions.length === 0 ? (
            <section
              className="
                rounded-3xl
                border
                border-dashed
                border-slate-300
                bg-white
                p-8
                text-center
                dark:border-slate-700
                dark:bg-slate-900
              "
            >
              <p
                className="
                  font-semibold
                  text-slate-800
                  dark:text-slate-200
                "
              >
                Question review is not available.
              </p>

              <p
                className="
                  mt-2
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                The attempt result is available, but
                question-wise data was not returned.
              </p>
            </section>
          ) : (
            <div className="space-y-5">
              {result.questions.map(
                (question, index) => (
                  <QuestionReviewCard
                    key={question.questionId}
                    question={question}
                    fallbackNumber={index + 1}
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* =================================================
            Final Result
            ================================================= */}

        <section
          className="
            rounded-3xl
            border
            border-blue-200
            bg-blue-50
            p-8
            dark:border-blue-900
            dark:bg-blue-950/30
            sm:p-10
          "
        >
          <div
            className="
              flex
              flex-col
              gap-6
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  uppercase
                  tracking-widest
                  text-blue-700
                  dark:text-blue-400
                "
              >
                Final Result
              </p>

              <h2
                className="
                  mt-2
                  text-2xl
                  font-bold
                  text-blue-950
                  dark:text-blue-200
                "
              >
                {isSubmitted
                  ? "Your attempt is complete."
                  : "Your attempt is still in progress."}
              </h2>

              <p
                className="
                  mt-2
                  max-w-2xl
                  text-sm
                  leading-6
                  text-blue-800
                  dark:text-blue-200
                "
              >
                {isSubmitted
                  ? "Take a moment to review the questions you missed. Understanding the mistake is part of the learning."
                  : "Return to your practice attempt to complete and submit it."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              {!isSubmitted && (
                <Link
                  href={
                    resourceId
                      ? `/learning/resources/${resourceId}/practice?attemptId=${encodeURIComponent(
                          result.id
                        )}`
                      : "/learning"
                  }
                  className="
                    inline-flex
                    items-center
                    justify-center
                    rounded-xl
                    bg-blue-700
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-blue-800
                    dark:bg-blue-600
                    dark:hover:bg-blue-500
                  "
                >
                  Continue Attempt →
                </Link>
              )}

              {isSubmitted && (
  <a
    href={`/learning/results/${encodeURIComponent(
      result.id
    )}/pdf`}
    className="
      inline-flex
      items-center
      justify-center
      rounded-xl
      border
      border-blue-200
      bg-white
      px-5
      py-2.5
      text-sm
      font-semibold
      text-blue-700
      shadow-sm
      transition
      hover:border-blue-300
      hover:bg-blue-50
      hover:text-blue-800
      dark:border-blue-800
      dark:bg-slate-900
      dark:text-blue-400
      dark:hover:bg-blue-950/40
    "
  >
    Download PDF
  </a>
)}

              <Link
                href="/learning"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-blue-200
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-blue-700
                  transition
                  hover:bg-white
                  dark:border-blue-800
                  dark:text-blue-400
                  dark:hover:bg-slate-900
                "
              >
                Back to Learning
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   Result Highlight
   ========================================================= */

function ResultHighlight({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-100
        bg-slate-50
        px-5
        py-5
        dark:border-slate-800
        dark:bg-slate-950
      "
    >
      <p
        className="
          text-xs
          font-medium
          uppercase
          tracking-wide
          text-slate-500
          dark:text-slate-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-2
          text-2xl
          font-bold
          text-blue-900
          dark:text-blue-300
        "
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   Performance Card
   ========================================================= */

function PerformanceCard({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  tone: "success" | "danger" | "neutral";
}) {
  const toneClasses = {
    success: {
      wrapper:
        "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30",
      value:
        "text-emerald-700 dark:text-emerald-400",
    },

    danger: {
      wrapper:
        "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30",
      value:
        "text-rose-700 dark:text-rose-400",
    },

    neutral: {
      wrapper:
        "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900",
      value:
        "text-slate-700 dark:text-slate-300",
    },
  };

  const classes = toneClasses[tone];

  return (
    <div
      className={`
        rounded-3xl
        border
        p-6
        ${classes.wrapper}
      `}
    >
      <p
        className="
          text-sm
          font-medium
          text-slate-600
          dark:text-slate-400
        "
      >
        {label}
      </p>

      <p
        className={`
          mt-2
          text-4xl
          font-bold
          ${classes.value}
        `}
      >
        {value}
      </p>

      <p
        className="
          mt-2
          text-sm
          leading-6
          text-slate-500
          dark:text-slate-400
        "
      >
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   Question Review Card
   ========================================================= */

function QuestionReviewCard({
  question,
  fallbackNumber,
}: {
  question: Awaited<
    ReturnType<typeof getLearningTestResult>
  > extends infer Result
    ? Result extends {
        questions: infer Questions;
      }
      ? Questions extends Array<infer Question>
        ? Question
        : never
      : never
    : never;

  fallbackNumber: number;
}) {
  const number =
    question.questionOrder ||
    fallbackNumber;

  const isCorrect =
    question.resultStatus === "CORRECT";

  const isIncorrect =
    question.resultStatus === "INCORRECT";

  const isUnanswered =
    question.resultStatus === "UNANSWERED";

  const statusLabel =
    isCorrect
      ? "Correct"
      : isIncorrect
        ? "Incorrect"
        : "Unanswered";

  const statusClasses =
    isCorrect
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
      : isIncorrect
        ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

  const answerTone =
    isCorrect
      ? "success"
      : isIncorrect
        ? "danger"
        : "neutral";

  return (
    <article
      className="
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-6
        shadow-sm
        dark:border-slate-800
        dark:bg-slate-900
        dark:shadow-none
        sm:p-7
      "
    >
      {/* Question header */}

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
        <p
          className="
            text-sm
            font-semibold
            text-slate-500
            dark:text-slate-400
          "
        >
          Question {number}
        </p>

        <span
          className={`
            inline-flex
            w-fit
            rounded-full
            px-3
            py-1
            text-xs
            font-semibold
            ${statusClasses}
          `}
        >
          {statusLabel}
        </span>
      </div>

      {/* Question text */}

      <div
        className="
          mt-5
          rounded-2xl
          bg-slate-50
          p-5
          dark:bg-slate-950
        "
      >
        <MathText
          value={question.questionText}
          className="
            text-base
            leading-7
          "
        />
      </div>

      {/* Options */}

      <div className="mt-5 space-y-3">
        {question.options.map((option) => {
          const isSelected =
            option.id ===
            question.selectedOptionId;

          const isCorrectOption =
            option.isCorrect;

          const optionClass =
            isCorrectOption
              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
              : isSelected
                ? "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

          return (
            <div
              key={option.id}
              className={`
                rounded-2xl
                border
                p-4
                ${optionClass}
              `}
            >
              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >
                <span
                  className="
                    flex
                    h-7
                    w-7
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-slate-100
                    text-xs
                    font-bold
                    text-slate-700
                    dark:bg-slate-800
                    dark:text-slate-300
                  "
                >
                  {option.optionKey}
                </span>

                <div className="min-w-0 flex-1">
                  <MathText
                    value={option.optionText}
                    className="
                      text-sm
                      leading-6
                    "
                  />

                  <div className="mt-2 flex flex-wrap gap-2">
                    {isSelected && (
                      <span
                        className="
                          rounded-full
                          bg-blue-100
                          px-2.5
                          py-1
                          text-xs
                          font-semibold
                          text-blue-700
                          dark:bg-blue-500/10
                          dark:text-blue-400
                        "
                      >
                        Your answer
                      </span>
                    )}

                    {isCorrectOption && (
                      <span
                        className="
                          rounded-full
                          bg-emerald-100
                          px-2.5
                          py-1
                          text-xs
                          font-semibold
                          text-emerald-700
                          dark:bg-emerald-500/10
                          dark:text-emerald-400
                        "
                      >
                        Correct answer
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Answer summary */}

      <div
        className="
          mt-5
          grid
          gap-4
          sm:grid-cols-2
        "
      >
        <AnswerBox
          label="Your Answer"
          value={
            question.selectedOptionText ??
            question.answerText ??
            "Not answered"
          }
          tone={answerTone}
        />

        <AnswerBox
          label="Correct Answer"
          value={
            question.correctOptionText ??
            "Not available"
          }
          tone="success"
        />
      </div>

      {/* Marks */}

      <div
        className="
          mt-5
          flex
          flex-wrap
          gap-3
        "
      >
        {question.marks !== null && (
          <span
            className="
              rounded-full
              bg-slate-100
              px-3
              py-1.5
              text-xs
              font-semibold
              text-slate-600
              dark:bg-slate-800
              dark:text-slate-300
            "
          >
            Marks:{" "}
            {formatNumber(
              question.marksAwarded ?? 0
            )}
            {" / "}
            {formatNumber(question.marks)}
          </span>
        )}

        {question.timeSpentSeconds !== null && (
          <span
            className="
              rounded-full
              bg-slate-100
              px-3
              py-1.5
              text-xs
              font-semibold
              text-slate-600
              dark:bg-slate-800
              dark:text-slate-300
            "
          >
            Time:{" "}
            {formatTime(
              question.timeSpentSeconds
            )}
          </span>
        )}

        {isUnanswered && (
          <span
            className="
              rounded-full
              bg-slate-100
              px-3
              py-1.5
              text-xs
              font-semibold
              text-slate-600
              dark:bg-slate-800
              dark:text-slate-300
            "
          >
            No answer submitted
          </span>
        )}
      </div>

      {/* Explanation */}

      {(question.solutionText ||
        question.mistakeInsight) && (
        <div
          className="
            mt-6
            space-y-4
            border-t
            border-slate-200
            pt-6
            dark:border-slate-800
          "
        >
          {question.solutionText && (
            <div>
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-widest
                  text-blue-700
                  dark:text-blue-400
                "
              >
                Explanation
              </p>

              <MathText
                value={question.solutionText}
                className="
                  mt-2
                  text-sm
                  leading-7
                "
              />
            </div>
          )}

          {question.mistakeInsight &&
            isIncorrect && (
              <div
                className="
                  rounded-2xl
                  border
                  border-amber-200
                  bg-amber-50
                  p-4
                  dark:border-amber-900
                  dark:bg-amber-950/20
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-widest
                    text-amber-700
                    dark:text-amber-400
                  "
                >
                  Learning Insight
                </p>

                <MathText
                  value={question.mistakeInsight}
                  className="
                    mt-2
                    text-sm
                    leading-7
                  "
                />
              </div>
            )}
        </div>
      )}
    </article>
  );
}

/* =========================================================
   Answer Box
   ========================================================= */

function AnswerBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "neutral";
}) {
  const classes = {
    success:
      "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20",

    danger:
      "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/20",

    neutral:
      "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950",
  };

  return (
    <div
      className={`
        rounded-2xl
        border
        p-4
        ${classes[tone]}
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
        {label}
      </p>

      <MathText
        value={value}
        className="
          mt-2
          text-sm
          font-medium
          leading-6
        "
      />
    </div>
  );
}

/* =========================================================
   Number Formatter
   ========================================================= */

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? value.toString()
    : value
        .toFixed(2)
        .replace(/0+$/, "")
        .replace(/\.$/, "");
}

/* =========================================================
   Time Formatter
   ========================================================= */

function formatTime(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}