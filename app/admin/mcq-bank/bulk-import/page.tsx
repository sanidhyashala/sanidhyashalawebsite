import Link from "next/link";

import AdminPage from "../../components/layout/AdminPage";

import {
  getAdminMcqCurriculumClasses,
} from "@/app/lib/admin/mcq-bank/mcq-bank-curriculum.service";

import BulkMcqImportForm from "./BulkMcqImportForm";

export default async function BulkMcqImportPage() {
  const chapters =
    await getAdminMcqCurriculumClasses();

  return (
    <AdminPage
      title="Bulk Import MCQs"
      description="Import multiple-choice questions in bulk and connect them to the appropriate class and chapter."
      sectionTitle="MCQ Bulk Import"
      sectionDescription="Upload or paste a JSON array of MCQs and map the complete import to one curriculum chapter."
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
      <div className="max-w-4xl">
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
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-blue-700
                dark:text-blue-400
              "
            >
              MCQ Bank
            </p>

            <h2
              className="
                mt-2
                text-xl
                font-bold
                text-slate-900
                dark:text-white
              "
            >
              Bulk Import
            </h2>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-600
                dark:text-slate-400
              "
            >
              Import multiple MCQs at once using
              JSON data or a JSON file. Every imported
              MCQ will be mapped to the selected
              curriculum chapter and created as a Draft.
            </p>
          </div>

          <BulkMcqImportForm
            chapters={chapters}
          />
        </div>
      </div>
    </AdminPage>
  );
}