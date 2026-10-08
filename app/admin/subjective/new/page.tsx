import Link from "next/link";

import AdminPage from "../../components/layout/AdminPage";

import { getAdminLearningCurriculum } from "@/app/lib/admin/learning/learning-curriculum.service";

import { createSubjectiveResource } from "@/app/lib/admin/subjective/subjective-resource.actions";

type CurriculumNode = Awaited<
  ReturnType<typeof getAdminLearningCurriculum>
>[number];

type PageProps = {
  searchParams: Promise<{
    curriculumNodeId?: string;
  }>;
};

/* =========================================================
 * Helpers
 * ========================================================= */

function getNodeHierarchy(
  node: CurriculumNode,
  curriculum: CurriculumNode[],
) {
  const nodeById = new Map(
    curriculum.map((item) => [item.id, item]),
  );

  const parentNode = node.parent_node_id
    ? nodeById.get(node.parent_node_id) ?? null
    : null;

  /*
   * Mathematics:
   *
   * Mathematics
   *   └── Chapter
   *
   * parentNode = Mathematics
   *
   *
   * Science:
   *
   * Science
   *   └── Physics
   *       └── Chapter
   *
   * parentNode = Physics
   * parentNode.parent = Science
   */

  if (!parentNode) {
    return {
      subject: null,
      branch: null,
    };
  }

  const grandParentNode = parentNode.parent_node_id
    ? nodeById.get(parentNode.parent_node_id) ?? null
    : null;

  if (!grandParentNode) {
    return {
      subject: parentNode,
      branch: null,
    };
  }

  return {
    subject: grandParentNode,
    branch: parentNode,
  };
}

/* =========================================================
 * Page
 * ========================================================= */

export default async function NewSubjectiveResourcePage({
  searchParams,
}: PageProps) {
  const { curriculumNodeId } = await searchParams;

  const curriculum = await getAdminLearningCurriculum();

  if (!curriculumNodeId) {
    return (
      <AdminPage
        title="Create Subjective Resource"
        description="Create a Subjective resource for a curriculum chapter."
        sectionTitle="Subjective Resource"
        sectionDescription="A valid curriculum chapter is required."
      >
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
          <h2 className="text-lg font-bold text-red-800 dark:text-red-300">
            Curriculum chapter not selected
          </h2>

          <p className="mt-2 text-sm leading-6 text-red-700 dark:text-red-400">
            Please return to the Subjective Engine and select a chapter
            before creating a Subjective resource.
          </p>

          <Link
            href="/admin/subjective"
            className="
              mt-5
              inline-flex
              items-center
              rounded-xl
              bg-slate-900
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-slate-800
              dark:bg-white
              dark:text-slate-900
              dark:hover:bg-slate-200
            "
          >
            ← Back to Subjective Engine
          </Link>
        </div>
      </AdminPage>
    );
  }

  const chapter = curriculum.find(
    (node) => node.id === curriculumNodeId,
  );

  if (!chapter) {
    return (
      <AdminPage
        title="Create Subjective Resource"
        description="Create a Subjective resource for a curriculum chapter."
        sectionTitle="Subjective Resource"
        sectionDescription="The selected curriculum chapter could not be found."
      >
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
          <h2 className="text-lg font-bold text-red-800 dark:text-red-300">
            Chapter not found
          </h2>

          <p className="mt-2 text-sm leading-6 text-red-700 dark:text-red-400">
            The selected curriculum node is not available in the current
            curriculum.
          </p>

          <Link
            href="/admin/subjective"
            className="
              mt-5
              inline-flex
              items-center
              rounded-xl
              bg-slate-900
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-slate-800
              dark:bg-white
              dark:text-slate-900
              dark:hover:bg-slate-200
            "
          >
            ← Back to Subjective Engine
          </Link>
        </div>
      </AdminPage>
    );
  }

  /*
   * Only CHAPTER nodes are valid targets for a
   * Subjective resource.
   */

  if (chapter.node_type !== "CHAPTER") {
    return (
      <AdminPage
        title="Create Subjective Resource"
        description="Create a Subjective resource for a curriculum chapter."
        sectionTitle="Invalid Curriculum Selection"
        sectionDescription="Subjective resources can only be attached to chapters."
      >
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/30">
          <h2 className="text-lg font-bold text-amber-800 dark:text-amber-300">
            Invalid curriculum selection
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-700 dark:text-amber-400">
            Please select a chapter, not a subject or branch.
          </p>

          <Link
            href="/admin/subjective"
            className="
              mt-5
              inline-flex
              items-center
              rounded-xl
              bg-slate-900
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-slate-800
              dark:bg-white
              dark:text-slate-900
              dark:hover:bg-slate-200
            "
          >
            ← Back to Subjective Engine
          </Link>
        </div>
      </AdminPage>
    );
  }

  const hierarchy = getNodeHierarchy(
    chapter,
    curriculum,
  );

  const subjectName =
    hierarchy.subject?.display_name ?? "—";

  const branchName =
    hierarchy.branch?.display_name ?? null;

  const className =
    chapter.program?.name ??
    chapter.program?.slug ??
    "—";

  const session =
    chapter.curriculum_version?.session ??
    "—";

  return (
    <AdminPage
      title="Create Subjective Resource"
      description="Create a Subjective resource for a specific curriculum chapter."
      sectionTitle="Subjective Resource"
      sectionDescription="This resource will become the container for Subjective practice sets."
    >
      <div className="mx-auto max-w-3xl">
        {/* =====================================================
         * Back
         * ===================================================== */}

        <div className="mb-6">
          <Link
            href="/admin/subjective"
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
            ← Back to Subjective Engine
          </Link>
        </div>

        {/* =====================================================
         * Curriculum Context
         * ===================================================== */}

        <section
          className="
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
            sm:p-8
          "
        >
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
              {session}
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              Create Subjective Resource
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Create the Subjective resource that will contain the
              practice sets for this chapter.
            </p>
          </div>

          {/* ===================================================
           * Curriculum Information
           * =================================================== */}

          <div className="grid gap-4 sm:grid-cols-2">
            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                p-4
                dark:border-slate-800
                dark:bg-slate-950
              "
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Class
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {className}
              </p>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                p-4
                dark:border-slate-800
                dark:bg-slate-950
              "
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Subject
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {subjectName}
              </p>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                p-4
                dark:border-slate-800
                dark:bg-slate-950
              "
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Branch
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {branchName ?? "—"}
              </p>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                p-4
                dark:border-slate-800
                dark:bg-slate-950
              "
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Chapter
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {chapter.display_name}
              </p>
            </div>
          </div>

          {/* ===================================================
           * Creation Form
           * =================================================== */}

          <form
            action={createSubjectiveResource}
            className="mt-8 space-y-6"
          >
            {/* -----------------------------------------------
             * Hidden curriculum node
             * ----------------------------------------------- */}

            <input
              type="hidden"
              name="curriculum_node_id"
              value={chapter.id}
            />

            {/* -----------------------------------------------
             * Resource Title
             * ----------------------------------------------- */}

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                Resource Title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder={`${chapter.display_name} — Subjective Practice`}
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-white
                  dark:placeholder:text-slate-500
                "
              />

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                This is the main Subjective resource name. Individual
                practice sets will be created inside it.
              </p>
            </div>

            {/* -----------------------------------------------
             * Description
             * ----------------------------------------------- */}

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder={`Subjective practice sets for ${chapter.display_name}.`}
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  text-sm
                  leading-6
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-white
                  dark:placeholder:text-slate-500
                "
              />
            </div>

            {/* -----------------------------------------------
             * Access
             * ----------------------------------------------- */}

            <div>
              <label
                htmlFor="access_type"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                Access
              </label>

              <select
                id="access_type"
                name="access_type"
                defaultValue="FREE"
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-white
                "
              >
                <option value="FREE">
                  Free
                </option>

                <option value="PREMIUM">
                  Premium
                </option>
              </select>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                This controls the access level of the Subjective resource.
              </p>
            </div>

            {/* -----------------------------------------------
             * Submit
             * ----------------------------------------------- */}

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                The resource will be created as a draft. You can then
                create and manage its Subjective Sets.
              </p>

              <button
                type="submit"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-900
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:-translate-y-0.5
                  hover:bg-slate-800
                  hover:shadow
                  dark:bg-white
                  dark:text-slate-900
                  dark:hover:bg-slate-200
                "
              >
                Create Subjective Resource
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminPage>
  );
}