import Link from "next/link";
import { notFound } from "next/navigation";

import AdminPage from "@/app/admin/components/layout/AdminPage";
import { getAccessPricingResource } from "@/app/lib/admin/access-pricing/access-pricing-resource.service";

type ResourcePageProps = {
  params: Promise<{
    classId: string;
    chapterId: string;
    resourceId: string;
  }>;
};

function resourceTypeLabel(resourceType: string) {
  switch (resourceType) {
    case "SUBJECTIVE":
      return "Subjective";

    case "MCQ":
      return "MCQ";

    case "NOTE":
      return "Notes";

    case "CASE_BASED":
      return "Case Based";

    case "MOCK_TEST":
      return "Mock Test";

    default:
      return resourceType;
  }
}

function accessBadgeClass(accessType: "FREE" | "PREMIUM") {
  return accessType === "PREMIUM"
    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
}

function statusBadgeClass(
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
) {
  switch (status) {
    case "PUBLISHED":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";

    case "ARCHIVED":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";

    default:
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }
}

function categoryLabel(category: string) {
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

export default async function AccessPricingResourcePage({
  params,
}: ResourcePageProps) {
  const { classId, chapterId, resourceId } = await params;

  const resource = await getAccessPricingResource(
    classId,
    chapterId,
    resourceId
  );

  if (!resource) {
    notFound();
  }

  const isSubjective = resource.resourceType === "SUBJECTIVE";

  return (
    <AdminPage
      title={resource.title}
      description="View the learning resource and its curriculum context. Access and pricing are controlled at the appropriate product level."
    >
      <div className="space-y-6">
        {/* -----------------------------------------------------
            Breadcrumb
        ----------------------------------------------------- */}

        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-sm text-slate-500"
        >
          <Link
            href="/admin/access-pricing"
            className="transition-colors hover:text-blue-600"
          >
            Access & Pricing
          </Link>

          <span>/</span>

          <Link
            href={`/admin/access-pricing/${resource.classInfo.id}`}
            className="transition-colors hover:text-blue-600"
          >
            {resource.classInfo.name}
          </Link>

          <span>/</span>

          <Link
            href={`/admin/access-pricing/${resource.classInfo.id}/${resource.chapter.id}`}
            className="transition-colors hover:text-blue-600"
          >
            {resource.chapter.name}
          </Link>

          <span>/</span>

          <span className="text-slate-700">
            {resource.title}
          </span>
        </nav>

        {/* -----------------------------------------------------
            Resource Header
        ----------------------------------------------------- */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {resourceTypeLabel(resource.resourceType)}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${accessBadgeClass(
                  resource.accessType
                )}`}
              >
                {resource.accessType}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(
                  resource.status
                )}`}
              >
                {resource.status}
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {resource.title}
            </h1>

            {resource.description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {resource.description}
              </p>
            )}
          </div>
        </section>

        {/* -----------------------------------------------------
            Learning Context
        ----------------------------------------------------- */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Learning Context
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              This resource belongs to the following curriculum path.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Class
              </p>

              <p className="mt-1 font-medium text-slate-900">
                {resource.classInfo.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Session {resource.classInfo.session}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Subject
              </p>

              <p className="mt-1 font-medium text-slate-900">
                {resource.subject.name}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Chapter
              </p>

              <p className="mt-1 font-medium text-slate-900">
                {resource.chapter.name}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Resource Type
              </p>

              <p className="mt-1 font-medium text-slate-900">
                {resourceTypeLabel(resource.resourceType)}
              </p>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------
            Access & Pricing Authority
        ----------------------------------------------------- */}

        <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Access & Pricing Authority
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            This learning resource does not control product pricing.
            Paid access is determined by the Chapter Product or
            Mathematics Subject Product associated with the curriculum.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-blue-100 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Chapter Product
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                {resource.chapter.name}
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Chapter-level paid access and pricing are managed from
                the Chapter Product workspace.
              </p>

              <Link
                href={`/admin/access-pricing/${resource.classInfo.id}/${resource.chapter.id}`}
                className="
                  mt-4
                  inline-flex
                  items-center
                  rounded-xl
                  bg-slate-900
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-slate-800
                "
              >
                Open Chapter Product →
              </Link>
            </div>

            <div className="rounded-xl border border-blue-100 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Resource Access Tag
              </p>

              <div className="mt-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${accessBadgeClass(
                    resource.accessType
                  )}`}
                >
                  {resource.accessType}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                This tag describes the resource content. It does not
                create a separate resource-level product price.
              </p>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------
            Subjective Sets
        ----------------------------------------------------- */}

        {isSubjective && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Subjective Sets
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Set access and publication are managed from the
                Subjective Set workspace, not from Access & Pricing.
              </p>
            </div>

            {resource.subjectiveSets.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                No Subjective Sets have been created for this resource
                yet.
              </div>
            ) : (
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Set
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Category
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Access
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Status
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Management
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200 bg-white">
                      {resource.subjectiveSets.map((set) => (
                        <tr key={set.id}>
                          <td className="px-4 py-4">
                            <p className="font-medium text-slate-900">
                              Set {set.setNumber}
                            </p>

                            <p className="mt-0.5 text-sm text-slate-500">
                              {set.title}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-700">
                            {categoryLabel(set.category)}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${accessBadgeClass(
                                set.accessType
                              )}`}
                            >
                              {set.accessType}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(
                                set.status
                              )}`}
                            >
                              {set.status}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <Link
                              href={`/admin/learning/subjective/${resource.id}/sets/${set.id}`}
                              className="
                                inline-flex
                                items-center
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
                              "
                            >
                              Open Set →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* -----------------------------------------------------
            Resource Role
        ----------------------------------------------------- */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Resource Role
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            This resource is a learning-content container mapped to a
            curriculum chapter. Content creation, question management,
            Subjective Set management, and product pricing remain
            separate responsibilities.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/admin/access-pricing/${resource.classInfo.id}/${resource.chapter.id}`}
              className="
                inline-flex
                items-center
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
              "
            >
              ← Back to Chapter
            </Link>

            {isSubjective && (
              <Link
                href={`/admin/learning/subjective/${resource.id}`}
                className="
                  inline-flex
                  items-center
                  rounded-xl
                  bg-slate-900
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-slate-800
                "
              >
                Open Subjective Workspace →
              </Link>
            )}
          </div>
        </section>
      </div>
    </AdminPage>
  );
}