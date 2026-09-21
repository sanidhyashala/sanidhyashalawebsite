import Link from "next/link";
import { notFound } from "next/navigation";

import AdminPage from "@/app/admin/components/layout/AdminPage";
import LearningProductPriceControl from "@/app/admin/access-pricing/components/LearningProductPriceControl";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

type PageProps = {
  params: Promise<{
    classId: string;
    chapterId: string;
  }>;
};

type Program = {
  id: string;
  name: string;
};

type CurriculumVersion = {
  id: string;
  program_id: string;
  session: string;
};

type CurriculumNode = {
  id: string;
  curriculum_version_id: string;
  parent_node_id: string | null;
  display_name: string;
  description: string | null;
  sequence_order: number | null;
};

type Resource = {
  id: string;
  title: string;
  slug: string;
  resource_type:
    | "NOTE"
    | "MCQ"
    | "SUBJECTIVE"
    | "CASE_BASED"
    | "MOCK_TEST";
  access_type: "FREE" | "PREMIUM";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  display_order: number;
};

type LearningProduct = {
  id: string;
  curriculum_node_id: string;
  product_type: "SUBJECT" | "CHAPTER";
  title: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
};

type LearningProductPrice = {
  id: string;
  product_id: string;
  amount_paise: number | string;
  currency: string;
  active: boolean;
  valid_from: string;
  valid_until: string | null;
};

const RESOURCE_TYPE_LABELS: Record<
  Resource["resource_type"],
  string
> = {
  SUBJECTIVE: "Subjective",
  MCQ: "MCQ",
  NOTE: "Notes",
  CASE_BASED: "Case Based",
  MOCK_TEST: "Mock Test",
};

const RESOURCE_TYPE_ORDER: Resource["resource_type"][] = [
  "SUBJECTIVE",
  "MCQ",
  "NOTE",
  "CASE_BASED",
  "MOCK_TEST",
];

function getAccessBadgeClass(
  accessType: Resource["access_type"]
) {
  if (accessType === "PREMIUM") {
    return `
      bg-amber-50
      text-amber-700
      dark:bg-amber-950
      dark:text-amber-300
    `;
  }

  return `
    bg-emerald-50
    text-emerald-700
    dark:bg-emerald-950
    dark:text-emerald-300
  `;
}

function getStatusBadgeClass(
  status: Resource["status"]
) {
  if (status === "PUBLISHED") {
    return `
      bg-blue-50
      text-blue-700
      dark:bg-blue-950
      dark:text-blue-300
    `;
  }

  if (status === "ARCHIVED") {
    return `
      bg-slate-100
      text-slate-600
      dark:bg-slate-800
      dark:text-slate-400
    `;
  }

  return `
    bg-amber-50
    text-amber-700
    dark:bg-amber-950
    dark:text-amber-300
  `;
}

function formatPrice(
  amountPaise: number | string,
  currency: string
) {
  const amount = Number(amountPaise) / 100;

  if (!Number.isFinite(amount)) {
    return "Not configured";
  }

  if (currency.toUpperCase() === "INR") {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `${currency.toUpperCase()} ${amount.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

export default async function AccessPricingChapterPage({
  params,
}: PageProps) {
  const { classId, chapterId } = await params;

  const normalizedClassId = classId.trim();
  const normalizedChapterId = chapterId.trim();

  if (!normalizedClassId || !normalizedChapterId) {
    notFound();
  }

  const supabase = createAdminSupabaseClient();

  /* ---------------------------------------------------------
   * 1. Load Class
   * --------------------------------------------------------- */

  const { data: program, error: programError } =
    await supabase
      .from("programs")
      .select("id, name")
      .eq("id", normalizedClassId)
      .maybeSingle();

  if (programError) {
    throw new Error(
      `Failed to load class: ${programError.message}`
    );
  }

  if (!program) {
    notFound();
  }

  const typedProgram = program as Program;

  /* ---------------------------------------------------------
   * 2. Load latest curriculum version
   * --------------------------------------------------------- */

  const {
    data: curriculumVersions,
    error: curriculumVersionsError,
  } = await supabase
    .from("curriculum_versions")
    .select("id, program_id, session")
    .eq("program_id", typedProgram.id)
    .in("status", ["DRAFT", "PUBLISHED"]);

  if (curriculumVersionsError) {
    throw new Error(
      `Failed to load curriculum version: ${curriculumVersionsError.message}`
    );
  }

  if (
    !curriculumVersions ||
    curriculumVersions.length === 0
  ) {
    notFound();
  }

  const latestVersion =
    [...curriculumVersions]
      .sort((a, b) =>
        b.session.localeCompare(a.session)
      )[0] as CurriculumVersion;

  /* ---------------------------------------------------------
   * 3. Load chapter
   * --------------------------------------------------------- */

  const { data: chapter, error: chapterError } =
    await supabase
      .from("curriculum_nodes")
      .select(
        `
          id,
          curriculum_version_id,
          parent_node_id,
          display_name,
          description,
          sequence_order
        `
      )
      .eq("id", normalizedChapterId)
      .eq(
        "curriculum_version_id",
        latestVersion.id
      )
      .eq("status", "ACTIVE")
      .maybeSingle();

  if (chapterError) {
    throw new Error(
      `Failed to load chapter: ${chapterError.message}`
    );
  }

  if (!chapter) {
    notFound();
  }

  const typedChapter = chapter as CurriculumNode;

  /* ---------------------------------------------------------
   * 4. Verify chapter belongs directly to Mathematics
   * --------------------------------------------------------- */

  if (!typedChapter.parent_node_id) {
    notFound();
  }

  const { data: parentNode, error: parentError } =
    await supabase
      .from("curriculum_nodes")
      .select(
        `
          id,
          display_name
        `
      )
      .eq("id", typedChapter.parent_node_id)
      .eq(
        "curriculum_version_id",
        latestVersion.id
      )
      .maybeSingle();

  if (parentError) {
    throw new Error(
      `Failed to verify chapter subject: ${parentError.message}`
    );
  }

  if (
    !parentNode ||
    parentNode.display_name !== "Mathematics"
  ) {
    notFound();
  }

  /* ---------------------------------------------------------
   * 5. Load Chapter Product
   *
   * Access & Pricing works at the product level.
   * This page resolves the CHAPTER product attached
   * to the current curriculum node.
   * --------------------------------------------------------- */

  const {
    data: chapterProduct,
    error: chapterProductError,
  } = await supabase
    .from("learning_products")
    .select(
      `
        id,
        curriculum_node_id,
        product_type,
        title,
        description,
        status
      `
    )
    .eq(
      "curriculum_node_id",
      typedChapter.id
    )
    .eq("product_type", "CHAPTER")
    .maybeSingle();

  if (chapterProductError) {
    throw new Error(
      `Failed to load chapter product: ${chapterProductError.message}`
    );
  }

  const typedChapterProduct =
    chapterProduct as LearningProduct | null;

  /* ---------------------------------------------------------
   * 6. Load active Chapter Product Price
   * --------------------------------------------------------- */

  let chapterProductPrice:
    | LearningProductPrice
    | null = null;

  if (typedChapterProduct) {
    const {
      data: price,
      error: priceError,
    } = await supabase
      .from("learning_product_prices")
      .select(
        `
          id,
          product_id,
          amount_paise,
          currency,
          active,
          valid_from,
          valid_until
        `
      )
      .eq(
        "product_id",
        typedChapterProduct.id
      )
      .eq("active", true)
      .order("valid_from", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (priceError) {
      throw new Error(
        `Failed to load chapter product price: ${priceError.message}`
      );
    }

    chapterProductPrice =
      (price as LearningProductPrice | null) ?? null;
  }

  /* ---------------------------------------------------------
   * 7. Load resources mapped to this chapter
   *
   * Resources remain visible as content overview.
   * Resource-level pricing does not determine the
   * chapter product price.
   * --------------------------------------------------------- */

  const {
    data: resourceMappings,
    error: resourceMappingsError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .select("resource_id")
    .eq(
      "curriculum_node_id",
      typedChapter.id
    );

  if (resourceMappingsError) {
    throw new Error(
      `Failed to load chapter resources: ${resourceMappingsError.message}`
    );
  }

  const resourceIds = Array.from(
    new Set(
      (resourceMappings ?? []).map(
        (mapping) => mapping.resource_id
      )
    )
  );

  let resources: Resource[] = [];

  if (resourceIds.length > 0) {
    const {
      data: resourceRows,
      error: resourcesError,
    } = await supabase
      .from("resources")
      .select(
        `
          id,
          title,
          slug,
          resource_type,
          access_type,
          status,
          display_order
        `
      )
      .in("id", resourceIds);

    if (resourcesError) {
      throw new Error(
        `Failed to load chapter resources: ${resourcesError.message}`
      );
    }

    resources =
      (resourceRows ?? []) as Resource[];
  }

  /* ---------------------------------------------------------
   * 8. Sort resources
   * --------------------------------------------------------- */

  resources.sort((a, b) => {
    const typeOrderA =
      RESOURCE_TYPE_ORDER.indexOf(
        a.resource_type
      );

    const typeOrderB =
      RESOURCE_TYPE_ORDER.indexOf(
        b.resource_type
      );

    if (typeOrderA !== typeOrderB) {
      return typeOrderA - typeOrderB;
    }

    if (
      a.display_order !==
      b.display_order
    ) {
      return (
        a.display_order -
        b.display_order
      );
    }

    return a.title.localeCompare(
      b.title
    );
  });

  const resourcesByType =
    new Map<
      Resource["resource_type"],
      Resource[]
    >();

  for (const resource of resources) {
    const existing =
      resourcesByType.get(
        resource.resource_type
      ) ?? [];

    existing.push(resource);

    resourcesByType.set(
      resource.resource_type,
      existing
    );
  }

  const contentTypes =
    RESOURCE_TYPE_ORDER.filter(
      (type) =>
        resourcesByType.has(type)
    );

  return (
    <AdminPage
      title={typedChapter.display_name}
      description="Manage chapter-level access and pricing for this Mathematics chapter."
      sectionTitle="Chapter Access & Pricing"
      sectionDescription={`Class ${typedProgram.name.replace(
        /^Class\s+/i,
        ""
      )} · Mathematics · Session ${latestVersion.session}`}
    >
      {/* -----------------------------------------------------
          Breadcrumb
      ----------------------------------------------------- */}

      <div className="mb-8 flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/admin/access-pricing"
          className="
            font-semibold
            text-blue-700
            hover:text-blue-900
            dark:text-blue-400
            dark:hover:text-blue-300
          "
        >
          Access & Pricing
        </Link>

        <span className="text-slate-400">
          /
        </span>

        <Link
          href={`/admin/access-pricing/${typedProgram.id}`}
          className="
            font-semibold
            text-blue-700
            hover:text-blue-900
            dark:text-blue-400
            dark:hover:text-blue-300
          "
        >
          {typedProgram.name}
        </Link>

        <span className="text-slate-400">
          /
        </span>

        <span className="font-medium text-slate-600 dark:text-slate-300">
          Mathematics
        </span>

        <span className="text-slate-400">
          /
        </span>

        <span className="text-slate-500 dark:text-slate-400">
          {typedChapter.display_name}
        </span>
      </div>

      {/* -----------------------------------------------------
          Chapter Header
      ----------------------------------------------------- */}

      <div
        className="
          mb-8
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-sm
          dark:border-slate-800
          dark:bg-slate-900
        "
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Mathematics · Chapter{" "}
              {typedChapter.sequence_order ?? "—"}
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {typedChapter.display_name}
            </h2>

            {typedChapter.description && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                {typedChapter.description}
              </p>
            )}
          </div>

          <Link
            href={`/admin/access-pricing/${typedProgram.id}`}
            className="
              inline-flex
              w-fit
              shrink-0
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
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-300
              dark:hover:bg-slate-800
            "
          >
            ← Back to Chapters
          </Link>
        </div>
      </div>

      {/* -----------------------------------------------------
          Chapter Product
      ----------------------------------------------------- */}

      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Chapter Product
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            This product controls paid access to learning content
            within this chapter.
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          {!typedChapterProduct ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  Chapter Product Not Found
                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  No CHAPTER learning product is currently attached
                  to this curriculum node.
                </p>
              </div>

              <span
                className="
                  inline-flex
                  w-fit
                  rounded-full
                  bg-amber-50
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-amber-700
                  dark:bg-amber-950
                  dark:text-amber-300
                "
              >
                NOT CONFIGURED
              </span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product Summary */}

              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="
                        rounded-full
                        bg-blue-50
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        text-blue-700
                        dark:bg-blue-950
                        dark:text-blue-300
                      "
                    >
                      CHAPTER PRODUCT
                    </span>

                    <span
                      className={`
                        rounded-full
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        ${
                          typedChapterProduct.status ===
                          "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }
                      `}
                    >
                      {typedChapterProduct.status}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                    {typedChapterProduct.title}
                  </h3>

                  {typedChapterProduct.description && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {typedChapterProduct.description}
                    </p>
                  )}

                  <p className="mt-3 break-all text-xs text-slate-400">
                    Product ID: {typedChapterProduct.id}
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-700 dark:bg-slate-800/60">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Current Price
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {chapterProductPrice
                      ? formatPrice(
                          chapterProductPrice.amount_paise,
                          chapterProductPrice.currency
                        )
                      : "Not configured"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {chapterProductPrice
                      ? "Active price"
                      : "No active price configured"}
                  </p>
                </div>
              </div>

              {/* Product Information */}

              <div
                className="
                  grid
                  gap-3
                  border-t
                  border-slate-200
                  pt-5
                  sm:grid-cols-2
                  dark:border-slate-800
                "
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Product Type
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Chapter
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Pricing Status
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {chapterProductPrice
                      ? "Configured"
                      : "Not configured"}
                  </p>
                </div>
              </div>

              {/* Pricing Authority */}

              <div
                className="
                  rounded-xl
                  border
                  border-dashed
                  border-slate-300
                  bg-slate-50
                  px-4
                  py-3
                  text-sm
                  text-slate-600
                  dark:border-slate-700
                  dark:bg-slate-800/40
                  dark:text-slate-400
                "
              >
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Pricing authority:
                </span>{" "}
                Chapter Product. Individual learning resources do
                not determine the chapter product price.
              </div>

              {/* Price Control */}

              <LearningProductPriceControl
                productId={typedChapterProduct.id}
                currentAmountPaise={
                  chapterProductPrice?.amount_paise ??
                  null
                }
                currency={
                  chapterProductPrice?.currency ??
                  "INR"
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* -----------------------------------------------------
          Content Overview
      ----------------------------------------------------- */}

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Chapter Content
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Learning resources currently mapped to this chapter.
            Their access tags and publishing status are shown for
            content visibility only.
          </p>
        </div>

        {resources.length === 0 ? (
          <div
            className="
              rounded-2xl
              border
              border-dashed
              border-slate-300
              bg-white
              p-10
              text-center
              dark:border-slate-700
              dark:bg-slate-900
            "
          >
            <div className="text-4xl">📦</div>

            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              No Learning Content Mapped
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              No Subjective, MCQ, Notes, or other learning
              resources are currently mapped to this chapter.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {contentTypes.map((type) => {
              const typeResources =
                resourcesByType.get(type) ?? [];

              return (
                <section
                  key={type}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {RESOURCE_TYPE_LABELS[type]}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {typeResources.length}{" "}
                      {typeResources.length === 1
                        ? "resource"
                        : "resources"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {typeResources.map(
                      (resource) => (
                        <div
                          key={resource.id}
                          className="
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            p-5
                            shadow-sm
                            dark:border-slate-800
                            dark:bg-slate-900
                          "
                        >
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                {resource.title}
                              </h4>

                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {resource.slug}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`
                                  rounded-full
                                  px-3
                                  py-1
                                  text-xs
                                  font-semibold
                                  ${getAccessBadgeClass(
                                    resource.access_type
                                  )}
                                `}
                              >
                                {resource.access_type}
                              </span>

                              <span
                                className={`
                                  rounded-full
                                  px-3
                                  py-1
                                  text-xs
                                  font-semibold
                                  ${getStatusBadgeClass(
                                    resource.status
                                  )}
                                `}
                              >
                                {resource.status}
                              </span>

                              <Link
                                href={`/admin/access-pricing/${typedProgram.id}/${typedChapter.id}/${resource.id}`}
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
                                View Resource →
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
    </AdminPage>
  );
}