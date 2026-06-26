export type ResourceStatus =
  | "available"
  | "in-progress"
  | "not-published";

export interface ResourceItem {
  title: string;

  slug: string;

  status: "available" | "coming-soon" | "locked";

  pdf?: string;

  pages?: number;

  updated?: string;

  language?: string;

  premium?: boolean;
}

export interface ResourcePageProps {
  title: string;
  description: string;
  category: "notes" | "mcq" | "pyq" | "subjective" | "case-based";
  className: string;
  resources: ResourceItem[];
}