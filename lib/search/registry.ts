import { SearchResource } from "./types";

import { ResourceItem } from "@/app/components/resources/resourceTypes";

import { class9Resources } from "@/content/resources/class-9";
import { class10Resources } from "@/content/resources/class-10";
import { class11Resources } from "@/content/resources/class-11";
import { class12Resources } from "@/content/resources/class-12";

// --- 2. Centralized category configuration -------------------------------
// Single source of truth mapping each source-object key to its output
// `category` label. Adding/removing a category only requires editing here.
const CATEGORY_CONFIG = [
  { key: "notes", category: "notes" },
  { key: "mcq", category: "mcq" },
  { key: "pyq", category: "pyq" },
  { key: "subjective", category: "subjective" },
  { key: "caseBased", category: "case-based" },
] as const;

type CategoryKey = (typeof CATEGORY_CONFIG)[number]["key"];


// Shape every per-class resource module must conform to.
type ClassSource = {
  [K in CategoryKey]: ResourceItem[];
};

// --- 4. Generic, non-duplicated flatten() ---------------------------------
function flatten(className: string, source: ClassSource): SearchResource[] {
  return CATEGORY_CONFIG.flatMap(({ key, category }) =>
    source[key].map(
      (r): SearchResource => ({
        ...r,
        className,
        category,
      })
    )
  );
}

// --- 3. Centralized class registry ----------------------------------------
// Adding "class-8" in the future means adding one entry to this array only.
interface ClassConfig {
  className: string;
  resources: ClassSource;
}

const CLASS_CONFIG: ClassConfig[] = [
  { className: "class-9", resources: class9Resources },
  { className: "class-10", resources: class10Resources },
  { className: "class-11", resources: class11Resources },
  { className: "class-12", resources: class12Resources },
];

// --- 5. Output preserved exactly -------------------------------------------
export const SearchRegistry: SearchResource[] = CLASS_CONFIG.flatMap(
  ({ className, resources }) => flatten(className, resources)
);