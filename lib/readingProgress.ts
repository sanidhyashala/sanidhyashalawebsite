const PREFIX = "sanidhyashala-progress:";

export function saveReadingProgress(
  pdfUrl: string,
  page: number
) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    PREFIX + pdfUrl,
    page.toString()
  );
}

export function getReadingProgress(
  pdfUrl: string
): number {
  if (typeof window === "undefined") return 1;

  const saved = localStorage.getItem(PREFIX + pdfUrl);

  if (!saved) return 1;

  const page = Number(saved);

  return Number.isFinite(page) && page > 0 ? page : 1;
}