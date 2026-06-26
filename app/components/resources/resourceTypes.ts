export type ResourceStatus =
  | "available"
  | "coming-soon"
  | "locked";

export interface ResourceItem {
  title: string;

  slug: string;

  status: ResourceStatus;

  pdf?: string;

  pages?: number;

  updated?: string;

  language?: string;

  premium?: boolean;
}

export interface ResourcePageProps {
  title: string;

  description: string;

  category:
    | "notes"
    | "mcq"
    | "pyq"
    | "subjective"
    | "case-based";

  className: string;

  resources: ResourceItem[];
}

export interface ResourceCardProps {
  resource: ResourceItem;

  index: number;

  category:
    | "notes"
    | "mcq"
    | "pyq"
    | "subjective"
    | "case-based";

  className: string;
}