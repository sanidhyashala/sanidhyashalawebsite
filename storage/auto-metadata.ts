import fs from "fs";
import { toTitleCase } from "./utils/title-case";

export interface AutoMetadata {
  title: string;
  slug: string;
  pdf: string;

  pages: number;

  language: string;

  updated: string;

  premium: boolean;

  status: "available" | "coming-soon" | "locked";
}

export function slugify(filename: string) {
  return filename
    .replace(".pdf", "")
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
}

export function titleFromSlug(slug: string) {
  const title = slug
    .replace(".pdf", "")
    .replace(/-/g, " ");

  return toTitleCase(title);
}

export function getUpdatedDate(filePath: string) {
  const stats = fs.statSync(filePath);

  return stats.mtime.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}