import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getLearningTestAttempt,
} from "@/lib/learning/attempts";

import {
  getLearningTestQuestions,
} from "@/lib/learning/questions";

import PracticeClient from "./PracticeClient";


type PageProps = {
  params: Promise<{
    resourceId: string;
  }>;

  searchParams: Promise<{
    attemptId?: string;
  }>;
};


export default async function McqPracticePage({
  params,
  searchParams,
}: PageProps) {

  const {
    resourceId,
  } = await params;

  const {
    attemptId,
  } = await searchParams;


  if (!attemptId) {
    notFound();
  }


  const attempt =
    await getLearningTestAttempt(
      attemptId
    );


  if (!attempt) {
    notFound();
  }


  if (
    attempt.status !==
    "IN_PROGRESS"
  ) {
    notFound();
  }


  const questions =
    await getLearningTestQuestions(
      attempt.test_id
    );


  if (
    !questions ||
    questions.length === 0
  ) {
    notFound();
  }


  return (
    <main className="px-6 py-12">
      <div className="mx-auto max-w-4xl">

        <div className="mb-8">

          <Link
            href={`/learning/resources/${resourceId}`}
            className="
              text-sm
              font-medium
              text-blue-700
              hover:text-blue-800
              dark:text-blue-400
              dark:hover:text-blue-300
            "
          >
            ← Back to Set
          </Link>


          <div className="mt-6">

            <p
              className="
                text-sm
                font-medium
                text-slate-500
                dark:text-slate-400
              "
            >
              Attempt{" "}
              {attempt.attempt_number}
            </p>


            <h1
              className="
                mt-2
                text-3xl
                font-bold
                tracking-tight
                text-blue-900
                dark:text-blue-400
              "
            >
              MCQ Practice
            </h1>


            <p
              className="
                mt-2
                text-slate-600
                dark:text-slate-400
              "
            >
              Answer each question carefully.
            </p>

          </div>

        </div>


        <PracticeClient
          attemptId={attempt.id}
          resourceId={resourceId}
          questions={questions}
        />

      </div>
    </main>
  );
}