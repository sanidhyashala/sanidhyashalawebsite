import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

const PRODUCT_TYPES = ["SUBJECT", "CHAPTER"] as const;

type ProductType = (typeof PRODUCT_TYPES)[number];

type ProgramRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

type CurriculumVersionRow = {
  id: string;
  program_id: string;
  session: string;
  status: string;
};

type CurriculumNodeRow = {
  id: string;
  curriculum_version_id: string;
  parent_node_id: string | null;
  display_name: string;
  sequence_order: number | null;
  status: string;
};

type LearningProductRow = {
  id: string;
  curriculum_node_id: string;
  product_type: ProductType;
  title: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
};

type LearningProductPriceRow = {
  id: string;
  product_id: string;
  amount_paise: number;
  currency: string;
  active: boolean;
  valid_from: string;
  valid_until: string | null;
};

export type AccessPricingProductPrice = {
  id: string;
  amountPaise: number;
  currency: string;
  active: boolean;
  validFrom: string;
  validUntil: string | null;
};

export type AccessPricingProduct = {
  id: string;
  curriculumNodeId: string;
  productType: ProductType;
  title: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  price: AccessPricingProductPrice | null;
};

export type AccessPricingSubject = {
  id: string;
  name: string;
  parentNodeId: string | null;
  product: AccessPricingProduct | null;
};

export type AccessPricingClass = {
  id: string;
  name: string;
  slug: string;
  session: string;
  programStatus: string;
  curriculumVersionId: string;

  subjects: AccessPricingSubject[];

  chapterCount: number;
};

function isValidProductType(
  value: string
): value is ProductType {
  return PRODUCT_TYPES.includes(value as ProductType);
}

function normalizeProduct(
  product: LearningProductRow,
  price: LearningProductPriceRow | null
): AccessPricingProduct {
  return {
    id: product.id,
    curriculumNodeId: product.curriculum_node_id,
    productType: product.product_type,
    title: product.title,
    description: product.description,
    status: product.status,
    price: price
      ? {
          id: price.id,
          amountPaise: price.amount_paise,
          currency: price.currency,
          active: price.active,
          validFrom: price.valid_from,
          validUntil: price.valid_until,
        }
      : null,
  };
}

export async function getAccessPricingClasses(): Promise<
  AccessPricingClass[]
> {
  const supabase = createAdminSupabaseClient();

  /* ---------------------------------------------------------
   * 1. Load programs
   * --------------------------------------------------------- */

  const {
    data: programs,
    error: programsError,
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
    .in("status", ["DRAFT", "PUBLISHED"])
    .order("name", {
      ascending: true,
    });

  if (programsError) {
    throw new Error(
      `Failed to load Access & Pricing classes: ${programsError.message}`
    );
  }

  if (!programs || programs.length === 0) {
    return [];
  }

  const typedPrograms = programs as ProgramRow[];

  /* ---------------------------------------------------------
   * 2. Load curriculum versions
   * --------------------------------------------------------- */

  const programIds = typedPrograms.map(
    (program) => program.id
  );

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
    .in("program_id", programIds)
    .in("status", ["DRAFT", "PUBLISHED"]);

  if (curriculumVersionsError) {
    throw new Error(
      `Failed to load curriculum versions: ${curriculumVersionsError.message}`
    );
  }

  if (
    !curriculumVersions ||
    curriculumVersions.length === 0
  ) {
    return [];
  }

  const typedVersions =
    curriculumVersions as CurriculumVersionRow[];

  /* ---------------------------------------------------------
   * 3. Select latest curriculum version per program
   * --------------------------------------------------------- */

  const latestVersionByProgram = new Map<
    string,
    CurriculumVersionRow
  >();

  for (const version of typedVersions) {
    const existing =
      latestVersionByProgram.get(version.program_id);

    if (
      !existing ||
      version.session.localeCompare(
        existing.session,
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        }
      ) > 0
    ) {
      latestVersionByProgram.set(
        version.program_id,
        version
      );
    }
  }

  const selectedVersions = Array.from(
    latestVersionByProgram.values()
  );

  if (selectedVersions.length === 0) {
    return [];
  }

  /* ---------------------------------------------------------
   * 4. Load curriculum nodes
   * --------------------------------------------------------- */

  const versionIds = selectedVersions.map(
    (version) => version.id
  );

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
        sequence_order,
        status
      `
    )
    .in(
      "curriculum_version_id",
      versionIds
    )
    .eq("status", "ACTIVE");

  if (curriculumNodesError) {
    throw new Error(
      `Failed to load curriculum nodes: ${curriculumNodesError.message}`
    );
  }

  const typedNodes =
    (curriculumNodes ?? []) as CurriculumNodeRow[];

  /* ---------------------------------------------------------
   * 5. Load Learning Products
   *
   * Products are attached directly to curriculum nodes.
   *
   * SUBJECT product:
   *   - Root subject node
   *   - Individual subject node such as Physics,
   *     Chemistry or Biology
   *
   * CHAPTER product:
   *   - Chapter node
   * --------------------------------------------------------- */

  const relevantNodeIds = typedNodes.map(
    (node) => node.id
  );

  let products: LearningProductRow[] = [];

  if (relevantNodeIds.length > 0) {
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
        relevantNodeIds
      )
      .in("product_type", PRODUCT_TYPES);

    if (productsError) {
      throw new Error(
        `Failed to load learning products: ${productsError.message}`
      );
    }

    products =
      (productRows ?? []) as LearningProductRow[];
  }

  /* ---------------------------------------------------------
   * 6. Load active prices for those products
   * --------------------------------------------------------- */

  const productIds = products.map(
    (product) => product.id
  );

  const pricesByProductId = new Map<
    string,
    LearningProductPriceRow
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
      .eq("active", true);

    if (pricesError) {
      throw new Error(
        `Failed to load learning product prices: ${pricesError.message}`
      );
    }

    const typedPrices =
      (priceRows ?? []) as LearningProductPriceRow[];

    for (const price of typedPrices) {
      pricesByProductId.set(
        price.product_id,
        price
      );
    }
  }

  /* ---------------------------------------------------------
   * 7. Normalize products
   * --------------------------------------------------------- */

  const productsByNodeId = new Map<
    string,
    AccessPricingProduct
  >();

  for (const product of products) {
    if (!isValidProductType(product.product_type)) {
      throw new Error(
        `Unsupported learning product type "${product.product_type}".`
      );
    }

    const price =
      pricesByProductId.get(product.id) ?? null;

    /*
     * Database constraint:
     *
     * UNIQUE (curriculum_node_id, product_type)
     *
     * Therefore one product per node + product type
     * is guaranteed at database level.
     */
    productsByNodeId.set(
      `${product.curriculum_node_id}:${product.product_type}`,
      normalizeProduct(product, price)
    );
  }

  /* ---------------------------------------------------------
   * 8. Build Class → Subject Products structure
   *
   * We deliberately do NOT hardcode:
   *
   *   SUBJECT_NAME = "Mathematics"
   *
   * Every root curriculum node is treated as a
   * top-level subject/product candidate.
   *
   * Example:
   *
   * Mathematics
   * Science
   *
   * Science's direct child subjects such as:
   *
   * Physics
   * Chemistry
   * Biology
   *
   * are also exposed through their own SUBJECT products.
   *
   * Chapter count remains based on direct children
   * of Mathematics, preserving the existing dashboard
   * meaning until the chapter UI is expanded further.
   * --------------------------------------------------------- */

  const classes: AccessPricingClass[] = [];

  for (const program of typedPrograms) {
    const version =
      latestVersionByProgram.get(program.id);

    if (!version) {
      continue;
    }

    const versionNodes = typedNodes.filter(
      (node) =>
        node.curriculum_version_id === version.id
    );

    /*
     * Root curriculum nodes are the top-level subjects
     * for the selected curriculum version.
     */
    const rootSubjectNodes = versionNodes
      .filter(
        (node) =>
          node.parent_node_id === null
      )
      .sort(
        (a, b) =>
          (a.sequence_order ?? 0) -
          (b.sequence_order ?? 0)
      );

    if (rootSubjectNodes.length === 0) {
      continue;
    }

    /*
     * Build the top-level subject products.
     */
    const subjects: AccessPricingSubject[] =
      rootSubjectNodes.map((subjectNode) => ({
        id: subjectNode.id,
        name: subjectNode.display_name,
        parentNodeId: subjectNode.parent_node_id,
        product:
          productsByNodeId.get(
            `${subjectNode.id}:SUBJECT`
          ) ?? null,
      }));

    /*
     * Mathematics chapter count is preserved from
     * the previous Access & Pricing behavior.
     *
     * We identify Mathematics by its root-node position
     * and display name only for this dashboard statistic.
     *
     * This does NOT control product discovery anymore.
     */
    const mathematicsNode =
      rootSubjectNodes.find(
        (node) =>
          node.display_name === "Mathematics"
      );

    const chapterCount = mathematicsNode
      ? versionNodes.filter(
          (node) =>
            node.parent_node_id ===
            mathematicsNode.id
        ).length
      : 0;

    /*
     * -------------------------------------------------------
     * Add direct subject children under Science
     * -------------------------------------------------------
     *
     * The current curriculum architecture has:
     *
     * Science
     * ├── Physics
     * ├── Chemistry
     * └── Biology
     *
     * These nodes already have their own SUBJECT products.
     *
     * We expose them as children of the Science subject
     * without changing the database model.
     */

    const scienceSubject =
      subjects.find(
        (subject) =>
          subject.name === "Science"
      );

    if (scienceSubject) {
      const scienceChildren =
        versionNodes
          .filter(
            (node) =>
              node.parent_node_id ===
                scienceSubject.id &&
              productsByNodeId.has(
                `${node.id}:SUBJECT`
              )
          )
          .sort(
            (a, b) =>
              (a.sequence_order ?? 0) -
              (b.sequence_order ?? 0)
          );

      /*
       * The public type currently represents a subject
       * with one product. Individual Science subjects
       * are therefore represented by adding them to the
       * main subjects collection below.
       *
       * This keeps the service contract simple for the
       * next UI step and avoids inventing a new DB model.
       */
      for (const child of scienceChildren) {
        subjects.push({
          id: child.id,
          name: child.display_name,
          parentNodeId: child.parent_node_id,
          product:
            productsByNodeId.get(
              `${child.id}:SUBJECT`
            ) ?? null,
        });
      }
    }

    classes.push({
      id: program.id,
      name: program.name,
      slug: program.slug,
      session: version.session,
      programStatus: program.status,
      curriculumVersionId: version.id,
      subjects,
      chapterCount,
    });
  }

  /* ---------------------------------------------------------
   * 9. Sort classes naturally
   * --------------------------------------------------------- */

  classes.sort((a, b) =>
    a.name.localeCompare(
      b.name,
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      }
    )
  );

  return classes;
}