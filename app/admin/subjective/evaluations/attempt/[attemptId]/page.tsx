import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import {
  getTeacherSubjectiveAttemptEvaluationWorkspace,
} from "@/app/lib/teacher/subjective/subjective-attempt-evaluation.service";

import SubjectiveAttemptEvaluationWorkspace from "./SubjectiveAttemptEvaluationWorkspace";

type PageProps = {
  params: Promise<{
    attemptId: string;
  }>;
};

export default async function SubjectiveAttemptEvaluationPage({
  params,
}: PageProps) {
  const { attemptId } = await params;

  const workspace =
    await getTeacherSubjectiveAttemptEvaluationWorkspace(
      attemptId,
    );

  if (!workspace) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/admin/subjective/evaluations"
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            text-slate-500
            transition
            hover:text-blue-600
            dark:text-slate-400
            dark:hover:text-blue-400
          "
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Evaluation
        </Link>

        <div
          className="
            mt-8
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
          <h1
            className="
              text-lg
              font-semibold
              text-slate-900
              dark:text-white
            "
          >
            Attempt Not Found
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            The requested Subjective attempt could not be
            found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* =====================================================
          BREADCRUMB
         ===================================================== */}

      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link
          href="/admin/subjective/evaluations"
          className="
            text-slate-500
            transition
            hover:text-blue-600
            dark:text-slate-400
            dark:hover:text-blue-400
          "
        >
          Evaluation
        </Link>

        <span className="text-slate-300 dark:text-slate-600">
          /
        </span>

        <Link
          href={`/admin/subjective/evaluations/set/${workspace.attempt.setId}`}
          className="
            text-slate-500
            transition
            hover:text-blue-600
            dark:text-slate-400
            dark:hover:text-blue-400
          "
        >
          Set {workspace.set?.setNumber ?? "—"}
        </Link>

        <span className="text-slate-300 dark:text-slate-600">
          /
        </span>

        <span className="font-medium text-slate-900 dark:text-white">
          Attempt {workspace.attempt.attemptNumber}
        </span>
      </div>

      <SubjectiveAttemptEvaluationWorkspace
        workspace={workspace}
      />
    </div>
  );
}