import Link from "next/link";
import { notFound } from "next/navigation";

import AdminPage from "@/app/admin/components/layout/AdminPage";
import LearningProductPriceControl from "@/app/admin/access-pricing/components/LearningProductPriceControl";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

type PageProps = {
  params: Promise<{
    classId: string;
  }>;
};

type Program = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

type CurriculumVersion = {
  id: string;
  program_id: string;
  session: string;
  status: string;
};

type CurriculumNode = {
  id: string;
  curriculum_version_id: string;
  parent_node_id: string | null;
  display_name: string;
  description: string | null;
  sequence_order: number | null;
  status: string;
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

type SubjectView = {
  node: CurriculumNode;
  product: LearningProduct | null;
  price: LearningProductPrice | null;
  children: CurriculumNode[];
};

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

export default async function AccessPricingClassPage({
  params,
}: PageProps) {
  const { classId } = await params;

  const normalizedClassId = classId.trim();

  if (!normalizedClassId) {
    notFound();
  }

  const supabase = createAdminSupabaseClient();

  /* ---------------------------------------------------------
   * 1. Load Class / Program
   * --------------------------------------------------------- */

  const {
    data: program,
    error: programError,
  } = await supabase
    .from("programs")
    .select(
      `
        id,
        name,
        slug,
        status
      `
    )
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
    .select(
      `
        id,
        program_id,
        session,
        status
      `
    )
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
    return (
      <AdminPage
        title={typedProgram.name}
        description="Manage learning access and pricing for this class."
        sectionTitle="Curriculum"
        sectionDescription="No active curriculum version is currently available."
      >
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
          <div className="text-4xl">📚</div>

          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            No Curriculum Available
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            This class does not currently have an active
            curriculum version.
          </p>
        </div>
      </AdminPage>
    );
  }

  const latestVersion = [...curriculumVersions].sort(
    (a, b) => b.session.localeCompare(a.session)
  )[0] as CurriculumVersion;

  /* ---------------------------------------------------------
   * 3. Load curriculum nodes
   * --------------------------------------------------------- */

  const {
    data: curriculumNodes,
    error: curriculumNodesError,
  } = await supabase
    .from("curriculum_nodes")
    .select(
      `
        id,
        curriculum_version_id,
        parent_node_id,
        display_name,
        description,
        sequence_order,
        status
      `
    )
    .eq(
      "curriculum_version_id",
      latestVersion.id
    )
    .eq("status", "ACTIVE")
    .order("sequence_order", {
      ascending: true,
    });

  if (curriculumNodesError) {
    throw new Error(
      `Failed to load curriculum nodes: ${curriculumNodesError.message}`
    );
  }

  const typedNodes =
    (curriculumNodes ?? []) as CurriculumNode[];

  /* ---------------------------------------------------------
   * 4. Find all root subject nodes
   *
   * Example:
   *
   * Mathematics
   * Science
   * --------------------------------------------------------- */

  const rootSubjects = typedNodes
    .filter(
      (node) =>
        node.parent_node_id === null
    )
    .sort(sortNodes);

  /* ---------------------------------------------------------
   * 5. Find all subject-level nodes
   *
   * A SUBJECT product may belong to:
   *
   * Mathematics
   * Science
   * Physics
   * Chemistry
   * Biology
   *
   * We identify subject nodes by curriculum hierarchy,
   * not by hard-coded product names.
   * --------------------------------------------------------- */

  const subjectNodes = typedNodes
    .filter(
      (node) =>
        rootSubjects.some(
          (root) => root.id === node.id
        ) ||
        rootSubjects.some(
          (root) =>
            node.parent_node_id === root.id
        )
    )
    .sort(sortNodes);

  /* ---------------------------------------------------------
   * 6. Load Learning Products
   * --------------------------------------------------------- */

  const relevantNodeIds = subjectNodes.map(
    (node) => node.id
  );

  /*
   * We also need chapter products for every direct child
   * of every subject node.
   */
  const chapterNodes = typedNodes.filter((node) =>
    subjectNodes.some(
      (subject) =>
        node.parent_node_id === subject.id
    )
  );

  const productNodeIds = Array.from(
    new Set([
      ...subjectNodes.map((node) => node.id),
      ...chapterNodes.map((node) => node.id),
    ])
  );

  let products: LearningProduct[] = [];

  if (productNodeIds.length > 0) {
    const {
      data: productRows,
      error: productsError,
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
        productNodeIds
      )
      .in("product_type", [
        "SUBJECT",
        "CHAPTER",
      ]);

    if (productsError) {
      throw new Error(
        `Failed to load learning products: ${productsError.message}`
      );
    }

    products =
      (productRows ?? []) as LearningProduct[];
  }

  /* ---------------------------------------------------------
   * 7. Load active prices
   * --------------------------------------------------------- */

  const productIds = products.map(
    (product) => product.id
  );

  const pricesByProductId = new Map<
    string,
    LearningProductPrice
  >();

  if (productIds.length > 0) {
    const {
      data: priceRows,
      error: pricesError,
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
      .in("product_id", productIds)
      .eq("active", true)
      .order("valid_from", {
        ascending: false,
      });

    if (pricesError) {
      throw new Error(
        `Failed to load learning product prices: ${pricesError.message}`
      );
    }

    const typedPrices =
      (priceRows ?? []) as LearningProductPrice[];

    /*
     * Keep only the latest active price per product.
     */
    for (const price of typedPrices) {
      if (
        !pricesByProductId.has(
          price.product_id
        )
      ) {
        pricesByProductId.set(
          price.product_id,
          price
        );
      }
    }
  }

  /* ---------------------------------------------------------
   * 8. Create product lookup
   * --------------------------------------------------------- */

  const productByNodeAndType = new Map<
    string,
    LearningProduct
  >();

  for (const product of products) {
    productByNodeAndType.set(
      `${product.curriculum_node_id}:${product.product_type}`,
      product
    );
  }

  /* ---------------------------------------------------------
   * 9. Build subject view
   * --------------------------------------------------------- */

  const subjects: SubjectView[] =
    rootSubjects.map((rootSubject) => {
      const directChildren = typedNodes
        .filter(
          (node) =>
            node.parent_node_id ===
            rootSubject.id
        )
        .sort(sortNodes);

      const product =
        productByNodeAndType.get(
          `${rootSubject.id}:SUBJECT`
        ) ?? null;

      return {
        node: rootSubject,
        product,
        price: product
          ? pricesByProductId.get(product.id) ??
            null
          : null,
        children: directChildren,
      };
    });

  /* ---------------------------------------------------------
   * 10. Build nested subject products
   *
   * Example:
   *
   * Science
   * ├── Physics
   * ├── Chemistry
   * └── Biology
   *
   * Each can independently have a SUBJECT product.
   * --------------------------------------------------------- */

  const childSubjectViews = new Map<
    string,
    SubjectView[]
  >();

  for (const rootSubject of rootSubjects) {
    const children = typedNodes
      .filter(
        (node) =>
          node.parent_node_id ===
          rootSubject.id
      )
      .sort(sortNodes)
      .map((node) => {
        const product =
          productByNodeAndType.get(
            `${node.id}:SUBJECT`
          ) ?? null;

        const directChildren = typedNodes
          .filter(
            (child) =>
              child.parent_node_id ===
              node.id
          )
          .sort(sortNodes);

        return {
          node,
          product,
          price: product
            ? pricesByProductId.get(
                product.id
              ) ?? null
            : null,
          children: directChildren,
        };
      });

    childSubjectViews.set(
      rootSubject.id,
      children
    );
  }

  /* ---------------------------------------------------------
   * 11. Render
   * --------------------------------------------------------- */

  return (
    <AdminPage
      title={typedProgram.name}
      description="Manage subject-level and chapter-level learning access and pricing for this class."
      sectionTitle="Learning Access & Pricing"
      sectionDescription={`Session ${latestVersion.session}`}
    >
      {/* -----------------------------------------------------
          Back
      ----------------------------------------------------- */}

      <div className="mb-6">
        <Link
          href="/admin/access-pricing"
          className="
            text-sm
            font-semibold
            text-blue-700
            hover:text-blue-900
            dark:text-blue-400
            dark:hover:text-blue-300
          "
        >
          ← Back to Classes
        </Link>
      </div>

      {/* -----------------------------------------------------
          Class Header
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
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Class
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {typedProgram.name}
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Curriculum session: {latestVersion.session}
            </p>
          </div>

          <div
            className="
              inline-flex
              w-fit
              items-center
              rounded-full
              bg-slate-100
              px-4
              py-2
              text-xs
              font-semibold
              text-slate-600
              dark:bg-slate-800
              dark:text-slate-300
            "
          >
            {rootSubjects.length} Subjects
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------
          Subject Products
      ----------------------------------------------------- */}

      <section className="mb-10">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Subject Products
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Configure subject-level access and pricing.
            A subject product grants access across the
            curriculum subtree belonging to that subject.
          </p>
        </div>

        <div className="space-y-6">
          {subjects.map((subject) => {
            const product =
              subject.product;

            const price =
              subject.price;

            const childSubjects =
              childSubjectViews.get(
                subject.node.id
              ) ?? [];

            return (
              <div
                key={subject.node.id}
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
                {/* Subject header */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Subject
                    </p>

                    <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                      {subject.node.display_name}
                    </h3>

                    {subject.node.description ? (
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {subject.node.description}
                      </p>
                    ) : null}
                  </div>

                  <span
                    className={`
                      inline-flex
                      w-fit
                      rounded-full
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      ${
                        product?.status ===
                        "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }
                    `}
                  >
                    {product
                      ? product.status
                      : "PRODUCT NOT SET"}
                  </span>
                </div>

                {/* Product */}

                <div className="mt-6">
                  {!product ? (
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
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Subject Product Not Found
                      </p>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        No SUBJECT learning product is
                        currently attached to this
                        curriculum subject.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="
                        rounded-2xl
                        border
                        border-slate-200
                        bg-slate-50
                        p-5
                        dark:border-slate-700
                        dark:bg-slate-800/50
                      "
                    >
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
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
                              className="
                                rounded-full
                                bg-emerald-50
                                px-3
                                py-1
                                text-xs
                                font-semibold
                                text-emerald-700
                                dark:bg-emerald-950
                                dark:text-emerald-300
                              "
                            >
                              ACTIVE
                            </span>
                          </div>

                          <h4 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                            {product.title}
                          </h4>

                          {product.description ? (
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                              {product.description}
                            </p>
                          ) : null}

                          <p className="mt-3 break-all text-xs text-slate-400">
                            Product ID: {product.id}
                          </p>
                        </div>

                        <div
                          className="
                            shrink-0
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            px-6
                            py-5
                            dark:border-slate-700
                            dark:bg-slate-900
                          "
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Current Price
                          </p>

                          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                            {price
                              ? formatPrice(
                                  price.amount_paise,
                                  price.currency
                                )
                              : "Not configured"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {price
                              ? "Active price"
                              : "No active price configured"}
                          </p>
                        </div>
                      </div>

                      <div
                        className="
                          mt-5
                          grid
                          gap-3
                          border-t
                          border-slate-200
                          pt-5
                          sm:grid-cols-2
                          dark:border-slate-700
                        "
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                            Product Type
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {subject.node.display_name}{" "}
                            Subject
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                            Pricing Status
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {price
                              ? "Configured"
                              : "Not configured"}
                          </p>
                        </div>
                      </div>

                      <div
                        className="
                          mt-5
                          rounded-xl
                          border
                          border-dashed
                          border-slate-300
                          bg-white
                          px-4
                          py-3
                          text-sm
                          text-slate-600
                          dark:border-slate-700
                          dark:bg-slate-900/50
                          dark:text-slate-400
                        "
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Pricing authority:
                        </span>{" "}
                        This subject product controls
                        subject-level paid access. Chapter
                        products remain independently
                        configurable.
                      </div>

                      <div className="mt-5">
                        <LearningProductPriceControl
                          productId={product.id}
                          currentAmountPaise={
                            price?.amount_paise ??
                            null
                          }
                          currency={
                            price?.currency ??
                            "INR"
                          }
                          productType="SUBJECT"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* -------------------------------------------------
                    Nested Subject Products
                    Example: Science → Physics/Chemistry/Biology
                ------------------------------------------------- */}

                {childSubjects.length > 0 ? (
                  <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700">
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Individual Subject Products
                      </p>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        These products provide access to an
                        individual subject within this
                        subject hierarchy.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {childSubjects.map(
                        (childSubject) => {
                          const childProduct =
                            childSubject.product;

                          const childPrice =
                            childSubject.price;

                          return (
                            <div
                              key={
                                childSubject.node.id
                              }
                              className="
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-5
                                dark:border-slate-700
                                dark:bg-slate-900
                              "
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                                    Subject
                                  </p>

                                  <h4 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                                    {
                                      childSubject
                                        .node
                                        .display_name
                                    }
                                  </h4>
                                </div>

                                <span
                                  className={`
                                    rounded-full
                                    px-2.5
                                    py-1
                                    text-[10px]
                                    font-bold
                                    ${
                                      childProduct
                                        ?.status ===
                                      "ACTIVE"
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                        : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                    }
                                  `}
                                >
                                  {childProduct
                                    ? childProduct.status
                                    : "MISSING"}
                                </span>
                              </div>

                              {childProduct ? (
                                <>
                                  <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {
                                      childProduct.title
                                    }
                                  </p>

                                  <div className="mt-4">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      Current Price
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                                      {childPrice
                                        ? formatPrice(
                                            childPrice.amount_paise,
                                            childPrice.currency
                                          )
                                        : "Not configured"}
                                    </p>
                                  </div>

                                  <p className="mt-2 text-xs text-slate-400">
                                    Individual subject access
                                  </p>

                                  <div className="mt-5">
                                    <LearningProductPriceControl
                                      productId={
                                        childProduct.id
                                      }
                                      currentAmountPaise={
                                        childPrice?.amount_paise ??
                                        null
                                      }
                                      currency={
                                        childPrice?.currency ??
                                        "INR"
                                      }
                                      productType="SUBJECT"
                                    />
                                  </div>
                                </>
                              ) : (
                                <div
                                  className="
                                    mt-4
                                    rounded-xl
                                    border
                                    border-dashed
                                    border-slate-300
                                    p-4
                                    text-sm
                                    text-slate-500
                                    dark:border-slate-700
                                    dark:text-slate-400
                                  "
                                >
                                  No SUBJECT product is
                                  currently configured for
                                  this curriculum node.
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* -----------------------------------------------------
          Chapter Products
      ----------------------------------------------------- */}

      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Chapter Products
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Manage chapter-level access and pricing from
            the relevant curriculum subject.
          </p>
        </div>

        {subjects.every(
          (subject) =>
            subject.children.length === 0
        ) ? (
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
              No direct curriculum children are currently
              available under the configured subjects.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {subjects.map((subject) => {
              if (
                subject.children.length === 0
              ) {
                return null;
              }

              return (
                <div
                  key={subject.node.id}
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
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Subject
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {subject.node.display_name}
                    </h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {subject.children.map(
                      (chapter) => (
                        <Link
                          key={chapter.id}
                          href={`/admin/access-pricing/${typedProgram.id}/${chapter.id}`}
                          className="
                            group
                            rounded-2xl
                            border
                            border-slate-200
                            bg-slate-50
                            p-5
                            transition-all
                            duration-200
                            hover:-translate-y-0.5
                            hover:border-slate-300
                            hover:bg-white
                            hover:shadow-md
                            dark:border-slate-700
                            dark:bg-slate-800/50
                            dark:hover:border-slate-600
                            dark:hover:bg-slate-800
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
                                bg-white
                                text-sm
                                font-bold
                                text-slate-700
                                transition-colors
                                group-hover:bg-slate-900
                                group-hover:text-white
                                dark:bg-slate-700
                                dark:text-slate-300
                                dark:group-hover:bg-white
                                dark:group-hover:text-slate-900
                              "
                            >
                              {chapter.sequence_order ??
                                "—"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Chapter{" "}
                                {chapter.sequence_order ??
                                  "—"}
                              </p>

                              <h4 className="mt-1 text-base font-bold leading-6 text-slate-900 dark:text-white">
                                {chapter.display_name}
                              </h4>

                              {chapter.description ? (
                                <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
                                  {
                                    chapter.description
                                  }
                                </p>
                              ) : null}

                              <div className="mt-4 flex items-center gap-2">
                                <span
                                  className="
                                    rounded-full
                                    bg-white
                                    px-3
                                    py-1
                                    text-xs
                                    font-semibold
                                    text-slate-600
                                    dark:bg-slate-700
                                    dark:text-slate-300
                                  "
                                >
                                  Chapter Product
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
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AdminPage>
  );
}