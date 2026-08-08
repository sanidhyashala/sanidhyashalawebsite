export function generateSlug(
  title: string
): string {
  return title
    .trim()
    .toLowerCase()

    // English letters & numbers
    .replace(/[^a-z0-9\s-]/g, "")

    // Multiple spaces -> single dash
    .replace(/\s+/g, "-")

    // Multiple dashes -> single dash
    .replace(/-+/g, "-")

    // Remove leading/trailing dash
    .replace(/^-|-$/g, "");
}