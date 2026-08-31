/* =========================================================
 * Learning Resource Routes
 * =========================================================
 *
 * Central source of truth for student-facing learning
 * resource URLs.
 *
 * A resource URL is determined by:
 *
 * class slug
 *   +
 * resource type
 *   +
 * resource slug
 *
 * No class-specific route logic should be duplicated
 * across individual learning pages.
 * ========================================================= */

const RESOURCE_ROUTE_SEGMENTS = {
  NOTE: "notes",
  MCQ: "mcq",
  SUBJECTIVE: "subjective",
  CASE_BASED: "case-based",
} as const;

export type LearningResourceType =
  keyof typeof RESOURCE_ROUTE_SEGMENTS;

export function getLearningResourceHref(
  classSlug: string,
  resourceType: string,
  resourceSlug: string
) {
  const normalizedClassSlug =
    classSlug.trim().toLowerCase();

  const routeSegment =
    RESOURCE_ROUTE_SEGMENTS[
      resourceType as LearningResourceType
    ];

  if (!routeSegment) {
    return null;
  }

  const normalizedResourceSlug =
    resourceSlug.trim().toLowerCase();

  if (!normalizedClassSlug || !normalizedResourceSlug) {
    return null;
  }

  return `/learning/${normalizedClassSlug}/${routeSegment}/${normalizedResourceSlug}`;
}