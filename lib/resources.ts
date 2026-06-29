import { resourceRegistry } from "@/content/resources";

export function getClassResources(className: string) {
  return (
    resourceRegistry[
      className as keyof typeof resourceRegistry
    ] ?? null
  );
}

export function getRelatedResources(
  className: string,
  category: string,
  currentSlug: string,
  limit = 3
) {
  const resources = getClassResources(className);

  if (!resources) return [];

  const categoryKey =
    category === "case-based"
      ? "caseBased"
      : (category as keyof typeof resources);

  const list = resources[categoryKey];

  if (!Array.isArray(list)) return [];

  const currentIndex = list.findIndex(
    (item) => item.slug === currentSlug
  );

  if (currentIndex === -1) return [];

  return list
    .slice(currentIndex + 1, currentIndex + 1 + limit);
}