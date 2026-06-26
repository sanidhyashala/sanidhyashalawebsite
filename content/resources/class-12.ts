import { ResourceItem } from "@/app/components/resources/resourceTypes";

const chapterTitles = [
  "Relations and Functions",
  "Inverse Trigonometric Functions",
  "Matrices",
  "Determinants",
  "Continuity and Differentiability",
  "Applications of Derivatives",
  "Integrals",
  "Applications of Integrals",
  "Differential Equations",
  "Vector Algebra",
  "Three Dimensional Geometry",
  "Linear Programming",
  "Probability",
];

const chapterSlugs = [
  "relations-and-functions",
  "inverse-trigonometric-functions",
  "matrices",
  "determinants",
  "continuity-and-differentiability",
  "applications-of-derivatives",
  "integrals",
  "applications-of-integrals",
  "differential-equations",
  "vector-algebra",
  "three-dimensional-geometry",
  "linear-programming",
  "probability",
];

const notePages = [
  420,
  32,
  34,
  52,
  108,
  46,
  58,
  44,
  40,
  56,
  48,
  32,
  62,
];

export const class12Resources = {
  notes: chapterTitles.map((title, index): ResourceItem => ({
    title,
    slug: chapterSlugs[index],
    status: "available",
    pdf: `${chapterSlugs[index]}.pdf`,
    pages: notePages[index],
    updated: "June 2026",
    language: "English",
    premium: false,
  })),

  mcq: chapterTitles.map((title, index): ResourceItem => ({
    title,
    slug: chapterSlugs[index],
    status: "coming-soon",
  })),

  pyq: chapterTitles.map((title, index): ResourceItem => ({
    title,
    slug: chapterSlugs[index],
    status: "coming-soon",
  })),

  subjective: chapterTitles.map((title, index): ResourceItem => ({
    title,
    slug: chapterSlugs[index],
    status: "coming-soon",
  })),

  caseBased: chapterTitles.map((title, index): ResourceItem => ({
    title,
    slug: chapterSlugs[index],
    status: "coming-soon",
  })),
};