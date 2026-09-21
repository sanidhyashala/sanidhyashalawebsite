import Link from "next/link";
import { notFound } from "next/navigation";

import AdminPage from "../../components/layout/AdminPage";

import { getAdminLearningResourceContent } from "@/app/lib/admin/learning/learning-content.service";
import { getLearningResourcePdfVersions } from "@/app/lib/admin/learning/learning-pdf.actions";

import ResourceContentEditor from "@/components/learning/ResourceContentEditor";
import ResourcePdfUpload from "@/components/learning/ResourcePdfUpload";
import ResourceContentSourceSelector from "@/components/learning/ResourceContentSourceSelector";
import ResourceAccessTypeControl from "@/components/learning/ResourceAccessTypeControl";

type ResourceEditorPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ResourceEditorPage({
  params,
}: ResourceEditorPageProps) {
  const { id } = await params;

  const data =
    await getAdminLearningResourceContent(id);

  if (!data) {
    notFound();
  }

  const {
    resource,
    curriculum,
    latestDraft,
    latestPublished,
  } = data;

  const pdfVersions =
    await getLearningResourcePdfVersions(
      resource.id
    );

  const initialContent =
    latestDraft?.content_json ??
    latestPublished?.content_json ??
    {
      type: "doc",
      content: [],
    };

  return (
    <AdminPage
      title={resource.title}
      description="Write, edit and manage the learning content for this resource."
      sectionTitle="Resource Content"
      sectionDescription="Choose the primary student-facing content source and manage its content below."
      actions={
        <Link
          href="/admin/learning"
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
          ← Back to Resources
        </Link>
      }
    >
      <div className="space-y-8">

        {/* -------------------------------------------------
         * Resource information
         * ------------------------------------------------- */}

        <div className="grid gap-4 md:grid-cols-4">

          {/* Type */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Type
            </p>

            <p className="mt-2 font-semibold text-slate-900 dark:text-white">
              {resource.resource_type}
            </p>
          </div>

          {/* Access */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Access
            </p>

            <ResourceAccessTypeControl
              resourceId={resource.id}
              initialAccessType={
                resource.access_type === "PREMIUM"
                  ? "PREMIUM"
                  : "FREE"
              }
            />
          </div>

          {/* Status */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </p>

            <p className="mt-2 font-semibold text-slate-900 dark:text-white">
              {resource.status}
            </p>
          </div>

          {/* Curriculum */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Curriculum
            </p>

            <p className="mt-2 font-semibold text-slate-900 dark:text-white">
              {curriculum?.program?.name ?? "—"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {curriculum?.version?.session ?? "—"}
              {" · "}
              Chapter{" "}
              {curriculum?.node?.sequence_order ?? "—"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {curriculum?.node?.display_name ?? "—"}
            </p>
          </div>

        </div>

        {/* -------------------------------------------------
         * Student-facing content source
         * ------------------------------------------------- */}

        <ResourceContentSourceSelector
          resourceId={resource.id}
          initialSource={
            resource.content_source === "PDF"
              ? "PDF"
              : "EDITOR"
          }
        />

        {/* -------------------------------------------------
         * Editor content
         * ------------------------------------------------- */}

        <ResourceContentEditor
          resourceId={resource.id}
          initialContent={initialContent}
        />

        {/* -------------------------------------------------
         * PDF upload
         * ------------------------------------------------- */}

        <ResourcePdfUpload
          resourceId={resource.id}
          pdfVersions={pdfVersions}
        />

      </div>
    </AdminPage>
  );
}