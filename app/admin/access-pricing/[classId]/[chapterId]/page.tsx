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
  canonical_node_id: string;
  parent_node_id: string | null;
  display_name: string;
  description: string | null;
  sequence_order: number | null;
};

type CanonicalNode = {

  id: string;

  node_type: string;

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

function sortNodes(

  a: CurriculumNode,

  b: CurriculumNode

) {

  const aOrder =

    a.sequence_order ?? Number.MAX_SAFE_INTEGER;

  const bOrder =

    b.sequence_order ?? Number.MAX_SAFE_INTEGER;

  if (aOrder !== bOrder) {

    return aOrder - bOrder;

  }

  return a.display_name.localeCompare(

    b.display_name

  );

}

export default async function AccessPricingChapterPage({

  params,

}: PageProps) {

  const { classId, chapterId } = await params;

  const normalizedClassId = classId.trim();

  const normalizedNodeId = chapterId.trim();

  if (!normalizedClassId || !normalizedNodeId) {

    notFound();

  }

  const supabase = createAdminSupabaseClient();

  /* ---------------------------------------------------------

   * 1. Load Class

   * --------------------------------------------------------- */

  const {

    data: program,

    error: programError,

  } = await supabase

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

  const latestVersion = [

    ...curriculumVersions,

  ].sort((a, b) =>

    b.session.localeCompare(a.session)

  )[0] as CurriculumVersion;

  /* ---------------------------------------------------------

   * 3. Load current curriculum node

   * --------------------------------------------------------- */

  const {

    data: currentNode,

    error: currentNodeError,

  } = await supabase

    .from("curriculum_nodes")

    .select(

      `

        id,

        curriculum_version_id,
        canonical_node_id,
parent_node_id,

        display_name,

        description,

        sequence_order

      `

    )

    .eq("id", normalizedNodeId)

    .eq(

      "curriculum_version_id",

      latestVersion.id

    )

    .eq("status", "ACTIVE")

    .maybeSingle();

  if (currentNodeError) {

    throw new Error(

      `Failed to load curriculum node: ${currentNodeError.message}`

    );

  }

  if (!currentNode) {

    notFound();

  }

  const typedNode =

    currentNode as CurriculumNode;

  /* ---------------------------------------------------------

   * 4. Load parent node

   *

   * We no longer assume that the parent is Mathematics.

   * --------------------------------------------------------- */

  let parentNode: CurriculumNode | null = null;

  if (typedNode.parent_node_id) {

    const {

      data: parent,

      error: parentError,

    } = await supabase

      .from("curriculum_nodes")

      .select(

        `

          id,

          curriculum_version_id,


        canonical_node_id,
parent_node_id,

          display_name,

          description,

          sequence_order

        `

      )

      .eq("id", typedNode.parent_node_id)

      .eq(

        "curriculum_version_id",

        latestVersion.id

      )

      .eq("status", "ACTIVE")

      .maybeSingle();

    if (parentError) {

      throw new Error(

        `Failed to load parent curriculum node: ${parentError.message}`

      );

    }

    parentNode =

      (parent as CurriculumNode | null) ??

      null;

  }

  /* ---------------------------------------------------------

   * 5. Load canonical node type

   *

   * This tells us whether the current node is a

   * SUBJECT node such as:

   *

   * Mathematics

   * Science

   * Physics

   * Chemistry

   * Biology

   *

   * or another curriculum node.

   * --------------------------------------------------------- */

  const {

    data: canonicalNode,

    error: canonicalNodeError,

  } = await supabase

    .from("canonical_nodes")

    .select("id, node_type")

    .eq("id", typedNode.canonical_node_id)

    .maybeSingle();

  if (canonicalNodeError) {

    throw new Error(

      `Failed to load canonical node type: ${canonicalNodeError.message}`

    );

  }

  const typedCanonicalNode =

    (canonicalNode as CanonicalNode | null) ??

    null;

  const isSubjectNode =

    typedCanonicalNode?.node_type === "SUBJECT";

  /* ---------------------------------------------------------

   * 6. Load product attached to current node

   *

   * SUBJECT node → SUBJECT product

   * Chapter node → CHAPTER product

   * --------------------------------------------------------- */

  const expectedProductType = isSubjectNode

    ? "SUBJECT"

    : "CHAPTER";

  const {

    data: currentProduct,

    error: currentProductError,

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

      typedNode.id

    )

    .eq(

      "product_type",

      expectedProductType

    )

    .maybeSingle();

  if (currentProductError) {

    throw new Error(

      `Failed to load learning product: ${currentProductError.message}`

    );

  }

  const typedCurrentProduct =

    (currentProduct as LearningProduct | null) ??

    null;

  /* ---------------------------------------------------------

   * 7. Load active price

   * --------------------------------------------------------- */

  let currentProductPrice:

    | LearningProductPrice

    | null = null;

  if (typedCurrentProduct) {

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

        typedCurrentProduct.id

      )

      .eq("active", true)

      .order("valid_from", {

        ascending: false,

      })

      .limit(1)

      .maybeSingle();

    if (priceError) {

      throw new Error(

        `Failed to load product price: ${priceError.message}`

      );

    }

    currentProductPrice =

      (price as LearningProductPrice | null) ??

      null;

  }

  /* =========================================================

   * SUBJECT NODE FLOW

   *

   * Example:

   *

   * Science

   *   └── Physics

   *

   * Clicking Physics opens this route.

   *

   * Physics itself is a SUBJECT product.

   * Its children are actual chapters.

   * ========================================================= */

  if (isSubjectNode) {

    const {

      data: childNodes,

      error: childNodesError,

    } = await supabase

      .from("curriculum_nodes")

      .select(

        `

          id,

          curriculum_version_id,


        canonical_node_id,
parent_node_id,

          display_name,

          description,

          sequence_order

        `

      )

      .eq(

        "curriculum_version_id",

        latestVersion.id

      )

      .eq(

        "parent_node_id",

        typedNode.id

      )

      .eq("status", "ACTIVE");

    if (childNodesError) {

      throw new Error(

        `Failed to load subject chapters: ${childNodesError.message}`

      );

    }

    const subjectChildren =

      (childNodes ?? []) as CurriculumNode[];

    subjectChildren.sort(sortNodes);

    /* -------------------------------------------------------

     * Load CHAPTER products for subject children

     * ------------------------------------------------------- */

    const childIds = subjectChildren.map(

      (node) => node.id

    );

    let childProducts: LearningProduct[] = [];

    if (childIds.length > 0) {

      const {

        data: childProductRows,

        error: childProductsError,

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

        .in(

          "curriculum_node_id",

          childIds

        )

        .eq("product_type", "CHAPTER");

      if (childProductsError) {

        throw new Error(

          `Failed to load subject chapter products: ${childProductsError.message}`

        );

      }

      childProducts =

        (childProductRows ?? []) as LearningProduct[];

    }

    const childProductByNodeId =

      new Map<string, LearningProduct>();

    for (const product of childProducts) {

      childProductByNodeId.set(

        product.curriculum_node_id,

        product

      );

    }

    /* -------------------------------------------------------

     * Breadcrumb subject hierarchy

     * ------------------------------------------------------- */

    const rootSubjectName =

      parentNode?.display_name ??

      "Subject";

    return (

      <AdminPage

        title={typedNode.display_name}

        description={`Manage ${typedNode.display_name} subject-level access and pricing for this class.`}

        sectionTitle="Subject Access & Pricing"

        sectionDescription={`Class ${typedProgram.name.replace(

          /^Class\s+/i,

          ""

        )} · ${rootSubjectName} · Session ${latestVersion.session}`}

      >

        {/* Breadcrumb */}

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

          {parentNode ? (

            <>

              <span className="text-slate-400">

                /

              </span>

              <span className="font-medium text-slate-600 dark:text-slate-300">

                {parentNode.display_name}

              </span>

            </>

          ) : null}

          <span className="text-slate-400">

            /

          </span>

          <span className="text-slate-500 dark:text-slate-400">

            {typedNode.display_name}

          </span>

        </div>

        {/* Subject Header */}

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

                Subject

              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">

                {typedNode.display_name}

              </h2>

              {typedNode.description ? (

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">

                  {typedNode.description}

                </p>

              ) : null}

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

              ← Back to Subjects

            </Link>

          </div>

        </div>

        {/* Subject Product */}

        <section className="mb-10">

          <div className="mb-4">

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">

              Subject Product

            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

              This product controls paid access across

              the {typedNode.display_name} curriculum.

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

            {!typedCurrentProduct ? (

              <div

                className="

                  rounded-xl

                  border

                  border-dashed

                  border-slate-300

                  bg-slate-50

                  p-5

                  dark:border-slate-700

                  dark:bg-slate-800/40

                "

              >

                <p className="text-base font-bold text-slate-900 dark:text-white">

                  Subject Product Not Found

                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  No SUBJECT learning product is currently

                  attached to this curriculum subject.

                </p>

              </div>

            ) : (

              <div className="space-y-6">

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

                        SUBJECT PRODUCT

                      </span>

                      <span

                        className={`

                          rounded-full

                          px-3

                          py-1

                          text-xs

                          font-semibold

                          ${

                            typedCurrentProduct.status ===

                            "ACTIVE"

                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"

                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"

                          }

                        `}

                      >

                        {typedCurrentProduct.status}

                      </span>

                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">

                      {typedCurrentProduct.title}

                    </h3>

                    {typedCurrentProduct.description ? (

                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">

                        {typedCurrentProduct.description}

                      </p>

                    ) : null}

                    <p className="mt-3 break-all text-xs text-slate-400">

                      Product ID:{" "}

                      {typedCurrentProduct.id}

                    </p>

                  </div>

                  <div

                    className="

                      shrink-0

                      rounded-2xl

                      border

                      border-slate-200

                      bg-slate-50

                      px-6

                      py-5

                      dark:border-slate-700

                      dark:bg-slate-800/60

                    "

                  >

                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">

                      Current Price

                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">

                      {currentProductPrice

                        ? formatPrice(

                            currentProductPrice.amount_paise,

                            currentProductPrice.currency

                          )

                        : "Not configured"}

                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">

                      {currentProductPrice

                        ? "Active price"

                        : "No active price configured"}

                    </p>

                  </div>

                </div>

                <div className="border-t border-slate-200 pt-5 dark:border-slate-800">

                  <LearningProductPriceControl

                    productId={

                      typedCurrentProduct.id

                    }

                    currentAmountPaise={

                      currentProductPrice?.amount_paise ??

                      null

                    }

                    currency={

                      currentProductPrice?.currency ??

                      "INR"

                    }
                    productType="SUBJECT"

                  />

                </div>

              </div>

            )}

          </div>

        </section>

        {/* Subject Chapters */}

        <section>

          <div className="mb-4">

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">

              {typedNode.display_name} Chapters

            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

              Manage chapter-level products within this

              subject.

            </p>

          </div>

          {subjectChildren.length === 0 ? (

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

              <div className="text-4xl">📖</div>

              <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">

                No Chapters Available

              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">

                No direct chapters are currently

                configured under this subject.

              </p>

            </div>

          ) : (

            <div className="grid gap-4 md:grid-cols-2">

              {subjectChildren.map((child) => {

                const childProduct =

                  childProductByNodeId.get(

                    child.id

                  );

                return (

                  <Link

                    key={child.id}

                    href={`/admin/access-pricing/${typedProgram.id}/${child.id}`}

                    className="

                      group

                      rounded-2xl

                      border

                      border-slate-200

                      bg-white

                      p-5

                      shadow-sm

                      transition-all

                      duration-200

                      hover:-translate-y-0.5

                      hover:border-slate-300

                      hover:shadow-md

                      dark:border-slate-800

                      dark:bg-slate-900

                      dark:hover:border-slate-700

                    "

                  >

                    <div className="flex items-start gap-4">

                      <div

                        className="

                          flex

                          h-10

                          w-10

                          shrink-0

                          items-center

                          justify-center

                          rounded-xl

                          bg-slate-100

                          text-sm

                          font-bold

                          text-slate-700

                          dark:bg-slate-800

                          dark:text-slate-300

                        "

                      >

                        {child.sequence_order ??

                          "—"}

                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">

                          Chapter{" "}

                          {child.sequence_order ??

                            "—"}

                        </p>

                        <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">

                          {child.display_name}

                        </h3>

                        {child.description ? (

                          <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">

                            {child.description}

                          </p>

                        ) : null}

                        <div className="mt-4 flex flex-wrap items-center gap-2">

                          <span

                            className={`

                              rounded-full

                              px-3

                              py-1

                              text-xs

                              font-semibold

                              ${

                                childProduct

                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"

                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"

                              }

                            `}

                          >

                            {childProduct

                              ? "Chapter Product"

                              : "Product Missing"}

                          </span>

                          <span className="text-xs font-semibold text-slate-400 transition-colors group-hover:text-slate-700 dark:group-hover:text-slate-200">

                            Manage →

                          </span>

                        </div>

                      </div>

                      <span

                        className="

                          shrink-0

                          text-lg

                          text-slate-400

                          transition-transform

                          duration-200

                          group-hover:translate-x-0.5

                          group-hover:text-slate-700

                          dark:group-hover:text-white

                        "

                        aria-hidden="true"

                      >

                        →

                      </span>

                    </div>

                  </Link>

                );

              })}

            </div>

          )}

        </section>

      </AdminPage>

    );

  }

  /* =========================================================

   * CHAPTER NODE FLOW

   *

   * Mathematics → Chapter

   *

   * This preserves the existing working flow.

   * ========================================================= */

  const chapterName =

    parentNode?.display_name ??

    "Chapter";

  /* ---------------------------------------------------------

   * Load resources mapped to this chapter

   * --------------------------------------------------------- */

  const {

    data: resourceMappings,

    error: resourceMappingsError,

  } = await supabase

    .from("resource_curriculum_nodes")

    .select("resource_id")

    .eq(

      "curriculum_node_id",

      typedNode.id

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

   * Sort resources

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

      title={typedNode.display_name}

      description={`Manage chapter-level access and pricing for this ${chapterName} chapter.`}

      sectionTitle="Chapter Access & Pricing"

      sectionDescription={`Class ${typedProgram.name.replace(

        /^Class\s+/i,

        ""

      )} · ${chapterName} · Session ${latestVersion.session}`}

    >

      {/* Breadcrumb */}

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

          {chapterName}

        </span>

        <span className="text-slate-400">

          /

        </span>

        <span className="text-slate-500 dark:text-slate-400">

          {typedNode.display_name}

        </span>

      </div>

      {/* Chapter Header */}

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

              {chapterName} · Chapter{" "}

              {typedNode.sequence_order ?? "—"}

            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">

              {typedNode.display_name}

            </h2>

            {typedNode.description ? (

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">

                {typedNode.description}

              </p>

            ) : null}

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

      {/* Chapter Product */}

      <section className="mb-10">

        <div className="mb-4">

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">

            Chapter Product

          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

            This product controls paid access to

            learning content within this chapter.

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

          {!typedCurrentProduct ? (

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-base font-bold text-slate-900 dark:text-white">

                  Chapter Product Not Found

                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  No CHAPTER learning product is

                  currently attached to this curriculum

                  node.

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

                          typedCurrentProduct.status ===

                          "ACTIVE"

                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"

                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"

                        }

                      `}

                    >

                      {typedCurrentProduct.status}

                    </span>

                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">

                    {typedCurrentProduct.title}

                  </h3>

                  {typedCurrentProduct.description ? (

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">

                      {

                        typedCurrentProduct.description

                      }

                    </p>

                  ) : null}

                  <p className="mt-3 break-all text-xs text-slate-400">

                    Product ID:{" "}

                    {typedCurrentProduct.id}

                  </p>

                </div>

                <div

                  className="

                    shrink-0

                    rounded-2xl

                    border

                    border-slate-200

                    bg-slate-50

                    px-6

                    py-5

                    dark:border-slate-700

                    dark:bg-slate-800/60

                  "

                >

                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">

                    Current Price

                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">

                    {currentProductPrice

                      ? formatPrice(

                          currentProductPrice.amount_paise,

                          currentProductPrice.currency

                        )

                      : "Not configured"}

                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">

                    {currentProductPrice

                      ? "Active price"

                      : "No active price configured"}

                  </p>

                </div>

              </div>

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

                    {currentProductPrice

                      ? "Configured"

                      : "Not configured"}

                  </p>

                </div>

              </div>

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

                Chapter Product. Individual learning

                resources do not determine the chapter

                product price.

              </div>

              <LearningProductPriceControl

                productId={

                  typedCurrentProduct.id

                }

                currentAmountPaise={

                  currentProductPrice?.amount_paise ??

                  null

                }

                currency={

                  currentProductPrice?.currency ??

                  "INR"

                }
                productType="CHAPTER"

              />

            </div>

          )}

        </div>

      </section>

      {/* Content Overview */}

      <section>

        <div className="mb-4">

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">

            Chapter Content

          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

            Learning resources currently mapped to this

            chapter.

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

              No Subjective, MCQ, Notes, or other

              learning resources are currently mapped to

              this chapter.

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

                                href={`/admin/access-pricing/${typedProgram.id}/${typedNode.id}/${resource.id}`}

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