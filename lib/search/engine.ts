import { SearchResource, SearchResult } from "./types";

// Named scoring constants — values unchanged, only made descriptive.
const SCORE_EXACT = 100;
const SCORE_PREFIX = 80;
const SCORE_WHOLE_WORD = 60;
const SCORE_CONTAINS = 30;
const SCORE_SLUG_MATCH = 10;

// Small in-tier bonus caps, kept as named constants for clarity.
const MAX_WHOLE_WORD_BONUS = 5;
const MAX_CONTAINS_BONUS = 5;

function normalize(text: string) {
  return text.toLowerCase().trim();
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Case-insensitive comparator without repeated toLowerCase() calls per comparison.
function compareTitles(a: string, b: string) {
  return a.localeCompare(b, undefined, {
    sensitivity: "base",
  });
}

export function searchResources(
  query: string,
  resources: SearchResource[]
): SearchResult[] {

  const q = normalize(query);

  if (!q) {
    return [];
  }

  // Split once, up front — never redone inside the resource loop.
  const queryWords = q.split(/\s+/).filter(Boolean);

  // Precompile whole-word regexes once per query, not once per resource.
  const wordBoundaryRegexes = queryWords.map(
    (word) => new RegExp(`\\b${escapeRegExp(word)}\\b`)
  );

  const results: SearchResult[] = [];

  for (const resource of resources) {

    // Normalize title/slug exactly once per resource.
    const title = normalize(resource.title);
    const slug = normalize(resource.slug);

    let score = 0;

    if (title === q) {
      score = SCORE_EXACT;
    } else if (title.startsWith(q)) {
      score = SCORE_PREFIX;
    } else {
      let wholeWordHits = 0;
      let containsHits = 0;

      for (let i = 0; i < queryWords.length; i++) {
        const word = queryWords[i];
        if (wordBoundaryRegexes[i].test(title)) {
          wholeWordHits++;
        } else if (title.includes(word)) {
          containsHits++;
        }
      }

      if (wholeWordHits > 0) {
        // Whole-word match tier — ranks above generic "contains".
        score = SCORE_WHOLE_WORD + Math.min(MAX_WHOLE_WORD_BONUS, wholeWordHits - 1);
      } else if (containsHits > 0 || title.includes(q)) {
        // Generic contains tier.
        score = SCORE_CONTAINS + Math.min(MAX_CONTAINS_BONUS, Math.max(0, containsHits - 1));
      }
    }

    // Slug match — lowest priority tier, added on top if present.
    if (slug.includes(q)) {
      score += SCORE_SLUG_MATCH;
    } else {
      for (const word of queryWords) {
        if (slug.includes(word)) {
          score += SCORE_SLUG_MATCH;
          break;
        }
      }
    }

    if (score > 0) {
      results.push({
        ...resource,
        score,
      });
    }
  }

  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Deterministic tie-break: alphabetical by title.
    return compareTitles(a.title, b.title);
  });

  return results;
}