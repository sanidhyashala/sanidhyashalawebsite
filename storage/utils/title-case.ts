const SMALL_WORDS = new Set([
  "and",
  "or",
  "of",
  "the",
  "in",
  "on",
  "to",
  "for",
  "at",
  "by",
  "with",
]);

export function toTitleCase(title: string): string {
  return title
    .split(" ")
    .map((word, index) => {
      const lower = word.toLowerCase();

      if (index !== 0 && SMALL_WORDS.has(lower)) {
        return lower;
      }

      return (
        lower.charAt(0).toUpperCase() +
        lower.slice(1)
      );
    })
    .join(" ");
}