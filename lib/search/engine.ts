import { SearchResource, SearchResult } from "./types";

function normalize(text: string) {
  return text.toLowerCase().trim();
}

export function searchResources(
  query: string,
  resources: SearchResource[]
): SearchResult[] {

  const q = normalize(query);

  if (!q) {
    return [];
  }

  const results: SearchResult[] = [];

  for (const resource of resources) {

    let score = 0;

    const title = normalize(resource.title);

    const slug = normalize(resource.slug);

    if (title === q) {
      score += 100;
    }

    else if (title.startsWith(q)) {
      score += 80;
    }

    else if (title.includes(q)) {
      score += 60;
    }

    if (slug.includes(q)) {
      score += 20;
    }

    if (score > 0) {

      results.push({

        ...resource,

        score,

      });

    }

  }

  return results.sort((a, b) => b.score - a.score);

}