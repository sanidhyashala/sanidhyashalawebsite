import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

const RESOURCE_TYPES = [
  "SUBJECTIVE",
  "MCQ",
  "NOTE",
  "CASE_BASED",
  "MOCK_TEST",
] as const;

type ResourceType = (typeof RESOURCE_TYPES)[number];

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
  canonical_node_id: string;
  parent_node_id: string | null;
  display_name: string;
  sequence_order: number | null;
  status: string;
};

type CanonicalNodeRow = {
  id: string;
  node_type: string;
};

type ResourceRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  resource_type: ResourceType;
  access_type: "FREE" | "PREMIUM";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  display_order: number | null;
  content_source: string | null;
};

type SubjectiveSetRow = {
  id: string;
  resource_id: string;
  title: string;
  set_number: number;
  category: string;
  access_type: "FREE" | "PREMIUM";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

type SubjectiveSetQuestionRow = {
  set_id: string;
};

export type AccessPricingResource = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  resourceType: ResourceType;
  accessType: "FREE" | "PREMIUM";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  displayOrder: number | null;
  contentSource: string | null;

  classInfo: {
    id: string;
    name: string;
    slug: string;
    session: string;
  };

  subject: {
    id: string;
    name: string;
  };

  chapter: {
    id: string;
    name: string;
  };

  subjectiveSets: Array<{
    id: string;
    title: string;
    setNumber: number;
    category: string;
    accessType: "FREE" | "PREMIUM";
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    questionCount: number;
  }>;
};

function isValidResourceType(
  value: string
): value is ResourceType {
  return RESOURCE_TYPES.includes(value as ResourceType);
}

/**
 * Loads one resource for the Access & Pricing workspace.
 *
 * Important:
 * - This function is READ-ONLY.
 * - It verifies the complete curriculum hierarchy:
 *   Class → Curriculum Version → Subject → Chapter → Resource
 * - Subject is discovered from the chapter's actual parent node.
 * - No subject name is hardcoded.
 * - Resource-level pricing is intentionally NOT loaded here.
 * - Product pricing belongs to learning_products and
 *   learning_product_prices.
 * - For Subjective resources, Subjective Sets and their
 *   question counts are loaded as a read-only content overview.
 */
export async function getAccessPricingResource(
  classId: string,
  chapterId: string,
  resourceId: string
): Promise<AccessPricingResource | null> {
  const supabase = createAdminSupabaseClient();

  // ------------------------------------------------------------
  // 1. Load class / program
  // ------------------------------------------------------------

  const {
    data: program,
    error: programError,
  } = await supabase
    .from("programs")
    .select("id, name, slug, status")
    .eq("id", classId)
    .maybeSingle();

  if (programError) {
    throw new Error(
      `Failed to load Access & Pricing class: ${programError.message}`
    );
  }

  if (!program) {
    return null;
  }

  const typedProgram = program as ProgramRow;

  // ------------------------------------------------------------
  // 2. Load latest active curriculum version for this class
  // ------------------------------------------------------------

  const {
    data: curriculumVersions,
    error: curriculumVersionsError,
  } = await supabase
    .from("curriculum_versions")
    .select("id, program_id, session, status")
    .eq("program_id", classId)
    .in("status", ["DRAFT", "PUBLISHED"]);

  if (curriculumVersionsError) {
    throw new Error(
      `Failed to load curriculum version: ${curriculumVersionsError.message}`
    );
  }

  const typedVersions =
    (curriculumVersions ?? []) as CurriculumVersionRow[];

  if (typedVersions.length === 0) {
    return null;
  }

  typedVersions.sort((a, b) =>
    b.session.localeCompare(a.session, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );

  const curriculumVersion = typedVersions[0];

  // ------------------------------------------------------------
  // 3. Load curriculum nodes for this version
  // ------------------------------------------------------------

  const {
    data: curriculumNodes,
    error: curriculumNodesError,
  } = await supabase
    .from("curriculum_nodes")
    .select(
      `
        id,
        curriculum_version_id,
        canonical_node_id,
        parent_node_id,
        display_name,
        sequence_order,
        status
      `
    )
    .eq("curriculum_version_id", curriculumVersion.id)
    .eq("status", "ACTIVE");

  if (curriculumNodesError) {
    throw new Error(
      `Failed to load curriculum nodes: ${curriculumNodesError.message}`
    );
  }

  const typedNodes =
    (curriculumNodes ?? []) as CurriculumNodeRow[];

  // ------------------------------------------------------------
  // 4. Find requested chapter
  //
  // We do NOT assume Mathematics.
  // The chapter's actual parent will determine the Subject.
  // ------------------------------------------------------------

  const chapterNode = typedNodes.find(
    (node) => node.id === chapterId
  );

  if (!chapterNode) {
    return null;
  }

  // ------------------------------------------------------------
  // 5. Verify chapter has a parent Subject node
  // ------------------------------------------------------------

  if (!chapterNode.parent_node_id) {
    return null;
  }

  const subjectNode = typedNodes.find(
    (node) => node.id === chapterNode.parent_node_id
  );

  if (!subjectNode) {
    return null;
  }

  // ------------------------------------------------------------
  // 6. Verify the parent node is actually a SUBJECT
  //
  // This is intentionally resolved through canonical_nodes.
  // No subject name is hardcoded.
  // ------------------------------------------------------------

  const {
    data: subjectCanonicalNode,
    error: subjectCanonicalNodeError,
  } = await supabase
    .from("canonical_nodes")
    .select("id, node_type")
    .eq("id", subjectNode.canonical_node_id)
    .maybeSingle();

  if (subjectCanonicalNodeError) {
    throw new Error(
      `Failed to load subject canonical node type: ${subjectCanonicalNodeError.message}`
    );
  }

  const typedSubjectCanonicalNode =
    (subjectCanonicalNode as CanonicalNodeRow | null) ?? null;

  if (
    !typedSubjectCanonicalNode ||
    typedSubjectCanonicalNode.node_type !== "SUBJECT"
  ) {
    return null;
  }

  // ------------------------------------------------------------
  // 7. Load requested resource
  // ------------------------------------------------------------

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select(
      `
        id,
        title,
        slug,
        description,
        resource_type,
        access_type,
        status,
        display_order,
        content_source
      `
    )
    .eq("id", resourceId)
    .maybeSingle();

  if (resourceError) {
    throw new Error(
      `Failed to load Access & Pricing resource: ${resourceError.message}`
    );
  }

  if (!resource) {
    return null;
  }

  const typedResource = resource as ResourceRow;

  if (!isValidResourceType(typedResource.resource_type)) {
    throw new Error(
      `Unsupported resource type "${typedResource.resource_type}".`
    );
  }

  // ------------------------------------------------------------
  // 8. Verify resource is actually mapped to this chapter
  // ------------------------------------------------------------

  const {
    data: resourceMapping,
    error: resourceMappingError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .select("resource_id, curriculum_node_id")
    .eq("resource_id", resourceId)
    .eq("curriculum_node_id", chapterId)
    .maybeSingle();

  if (resourceMappingError) {
    throw new Error(
      `Failed to verify resource curriculum mapping: ${resourceMappingError.message}`
    );
  }

  if (!resourceMapping) {
    return null;
  }

  // ------------------------------------------------------------
  // 9. Load Subjective Sets only for Subjective resources
  //
  // These are read-only content metadata.
  // Access and publishing are NOT controlled here.
  // ------------------------------------------------------------

  let subjectiveSets: SubjectiveSetRow[] = [];

  let subjectiveSetQuestionCounts =
    new Map<string, number>();

  if (typedResource.resource_type === "SUBJECTIVE") {
    const {
      data: sets,
      error: setsError,
    } = await supabase
      .from("subjective_sets")
      .select(
        `
          id,
          resource_id,
          title,
          set_number,
          category,
          access_type,
          status
        `
      )
      .eq("resource_id", resourceId)
      .order("set_number", {
        ascending: true,
      });

    if (setsError) {
      throw new Error(
        `Failed to load Subjective Sets: ${setsError.message}`
      );
    }

    subjectiveSets =
      (sets ?? []) as SubjectiveSetRow[];

    // ----------------------------------------------------------
    // 9A. Load question mappings for all Subjective Sets
    // ----------------------------------------------------------

    const setIds = subjectiveSets.map(
      (set) => set.id
    );

    if (setIds.length > 0) {
      const {
        data: setQuestions,
        error: setQuestionsError,
      } = await supabase
        .from("subjective_set_questions")
        .select("set_id")
        .in("set_id", setIds);

      if (setQuestionsError) {
        throw new Error(
          `Failed to load Subjective Set question counts: ${setQuestionsError.message}`
        );
      }

      const typedSetQuestions =
        (setQuestions ?? []) as SubjectiveSetQuestionRow[];

      subjectiveSetQuestionCounts =
        new Map<string, number>();

      for (const question of typedSetQuestions) {
        const currentCount =
          subjectiveSetQuestionCounts.get(
            question.set_id
          ) ?? 0;

        subjectiveSetQuestionCounts.set(
          question.set_id,
          currentCount + 1
        );
      }
    }
  }

  // ------------------------------------------------------------
  // 10. Return normalized Access & Pricing model
  // ------------------------------------------------------------

  return {
    id: typedResource.id,
    title: typedResource.title,
    slug: typedResource.slug,
    description: typedResource.description,
    resourceType: typedResource.resource_type,
    accessType: typedResource.access_type,
    status: typedResource.status,
    displayOrder: typedResource.display_order,
    contentSource: typedResource.content_source,

    classInfo: {
      id: typedProgram.id,
      name: typedProgram.name,
      slug: typedProgram.slug,
      session: curriculumVersion.session,
    },

    subject: {
      id: subjectNode.id,
      name: subjectNode.display_name,
    },

    chapter: {
      id: chapterNode.id,
      name: chapterNode.display_name,
    },

    subjectiveSets: subjectiveSets.map(
      (set) => ({
        id: set.id,
        title: set.title,
        setNumber: set.set_number,
        category: set.category,
        accessType: set.access_type,
        status: set.status,
        questionCount:
          subjectiveSetQuestionCounts.get(
            set.id
          ) ?? 0,
      })
    ),
  };
}