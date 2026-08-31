import Link from "next/link";

import AdminPage from "../../../components/layout/AdminPage";

import McqSetCreateForm from "./McqSetCreateForm";

import {
  getAdminMcqCurriculumClasses,
} from "@/app/lib/admin/mcq-bank/mcq-bank-curriculum.service";


export default async function AdminNewMcqSetPage() {
  const curriculumClasses =
    await getAdminMcqCurriculumClasses();

  return (
    <AdminPage
      title="New MCQ Set"
      description="Create a chapter-wise MCQ practice set and configure its assessment settings."
      actions={
        <Link
          href="/admin/mcq-bank"
          className="
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            py-2
            text-sm
            font-semibold
            text-slate-700
            transition
            hover:bg-slate-50
            dark:border-slate-700
            dark:bg-slate-900
            dark:text-slate-300
            dark:hover:bg-slate-800
          "
        >
          ← Back to MCQ Bank
        </Link>
      }
    >
      <McqSetCreateForm
        curriculumClasses={curriculumClasses}
      />
    </AdminPage>
  );
}