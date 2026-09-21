import Link from "next/link";
import AdminPage from "@/app/admin/components/layout/AdminPage";
import { getAdminLearningResources } from "@/app/lib/admin/learning/learning-resources.service";
import { getAdminMcqCurriculumClasses } from "@/app/lib/admin/mcq-bank/mcq-bank-curriculum.service";
import SubjectiveQuestionCreateForm from "./SubjectiveQuestionCreateForm";

type PageProps = {
  params: Promise<{
    resourceId: string;
  }>;
};

export default async function NewSubjectiveQuestionPage({
  params,
}: PageProps) {
  const { resourceId } = await params;

  const [resources, curriculumClasses] = await Promise.all([
    getAdminLearningResources(),
    getAdminMcqCurriculumClasses(),
  ]);

  const resource = resources.find(
    (item) =>
      item.id === resourceId &&
      item.resource_type === "SUBJECTIVE"
  );

  if (!resource) {
    return (
      <AdminPage title="Subjective Resource Not Found">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            The requested Subjective resource could not be found.
          </p>

          <Link
            href="/admin/subjective"
            className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Back to Subjective
          </Link>
        </div>
      </AdminPage>
    );
  }

  const curriculumNodeId =
    resource.curriculum?.node?.id ?? null;

  if (!curriculumNodeId) {
    return (
      <AdminPage title="Curriculum Mapping Missing">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This Subjective resource is not mapped to a valid
            curriculum chapter.
          </p>

          <Link
            href={`/admin/learning/subjective/${resourceId}`}
            className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Back to Resource
          </Link>
        </div>
      </AdminPage>
    );
  }

  const curriculumClass = curriculumClasses.find((item) =>
    item.chapters.some(
      (chapter) => chapter.id === curriculumNodeId
    )
  );

  if (!curriculumClass) {
    return (
      <AdminPage title="Curriculum Class Not Found">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            The curriculum class for this Subjective resource
            could not be resolved.
          </p>

          <Link
            href={`/admin/learning/subjective/${resourceId}`}
            className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Back to Resource
          </Link>
        </div>
      </AdminPage>
    );
  }

  const curriculumChapter = curriculumClass.chapters.find(
    (chapter) => chapter.id === curriculumNodeId
  );

  if (!curriculumChapter) {
    return (
      <AdminPage title="Curriculum Chapter Not Found">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            The curriculum chapter for this Subjective resource
            could not be resolved.
          </p>

          <Link
            href={`/admin/learning/subjective/${resourceId}`}
            className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Back to Resource
          </Link>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage title="Create Subjective Question">
      <div className="space-y-6">
        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 text-sm text-slate-500">
              Subjective Questions
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Create New Question
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Create a new Subjective question for this
              curriculum chapter.
            </p>
          </div>

          <Link
            href={`/admin/learning/subjective/${resourceId}`}
            className="inline-flex w-fit items-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            ← Back to Resource
          </Link>
        </div>

        {/* Curriculum Context */}

        <div className="rounded-xl border bg-slate-50 p-5">
          <div className="mb-3 text-sm font-semibold text-slate-900">
            Curriculum Context
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Class
              </div>

              <div className="mt-1 text-sm font-medium text-slate-900">
                {curriculumClass.name}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Chapter
              </div>

              <div className="mt-1 text-sm font-medium text-slate-900">
                {curriculumChapter.display_name}
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            The curriculum chapter is fixed by the Subjective
            resource and cannot be changed here.
          </div>
        </div>

        {/* Question Form */}

        <div className="rounded-xl border bg-white p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Question Details
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              New questions are created as DRAFT and are not
              student-facing until published.
            </p>
          </div>

          <SubjectiveQuestionCreateForm
            curriculumNodeId={curriculumNodeId}
            curriculumClassName={curriculumClass.name}
            curriculumChapterName={
              curriculumChapter.display_name
            }
          />
        </div>
      </div>
    </AdminPage>
  );
}