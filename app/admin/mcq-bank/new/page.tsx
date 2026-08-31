import Link from "next/link";

import AdminPage from "../../components/layout/AdminPage";

import {
  getAdminMcqCurriculumClasses,
} from "@/app/lib/admin/mcq-bank/mcq-bank-curriculum.service";

import McqCreateForm from "./McqCreateForm";

export default async function NewMcqPage() {
  const chapters =
    await getAdminMcqCurriculumClasses();

  return (
    <AdminPage
      title="Create New MCQ"
      description="Create a multiple-choice question and connect it to the appropriate class and chapter."
      sectionTitle="MCQ Details"
      sectionDescription="Create the question, four answer options, correct answer and curriculum mapping."
      actions={
        <Link
          href="/admin/mcq-bank"
          className="
            rounded-xl
            border
            border-slate-300
            px-4
            py-2
            text-sm
            font-semibold
            text-slate-700
            transition
            hover:bg-slate-50
            dark:border-slate-700
            dark:text-slate-300
            dark:hover:bg-slate-800
          "
        >
          ← Back to MCQ Bank
        </Link>
      }
    >
      <div className="max-w-3xl">
        <div
          className="
            rounded-3xl
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
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              MCQ Bank
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
              Create MCQ
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Build a four-option multiple-choice
              question and assign it to the appropriate
              class and chapter.
            </p>
          </div>

          <McqCreateForm
            chapters={chapters}
          />
        </div>
      </div>
    </AdminPage>
  );
}