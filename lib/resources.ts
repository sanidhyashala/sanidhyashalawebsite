import {
  resourceRegistry,
  type ClassName,
} from "@/content/resources";

export type ResourceCategory =
  | "notes"
  | "mcq"
  | "pyq"
  | "subjective"
  | "case-based";

const CATEGORY_KEY_MAP = {
  notes: "notes",
  mcq: "mcq",
  pyq: "pyq",
  subjective: "subjective",
  "case-based": "caseBased",
} as const;

export function isClassName(value: string): value is ClassName {
  return value in resourceRegistry;
}

export function isResourceCategory(
  value: string
): value is ResourceCategory {
  return value in CATEGORY_KEY_MAP;
}

export function getClassResources(className: ClassName) {
  return resourceRegistry[className];
}

export function getRelatedResources(
  className: ClassName,
  category: ResourceCategory,
  currentSlug: string,
  limit = 3
) {
  const resources = getClassResources(className);

  const safeLimit = Math.max(1, limit);

  const categoryKey = CATEGORY_KEY_MAP[category];

  const list = resources[categoryKey];

  const currentIndex = list.findIndex(
    (item) => item.slug === currentSlug
  );

  if (currentIndex === -1) return [];

  return list.slice(
    currentIndex + 1,
    currentIndex + 1 + safeLimit
  );
}