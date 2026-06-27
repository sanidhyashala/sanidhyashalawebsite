import fs from "fs";
import path from "path";

const STORAGE_DIR = path.join(process.cwd(), "storage");
const METADATA_DIR = path.join(STORAGE_DIR, "metadata");
const OUTPUT_DIR = path.join(process.cwd(), "content", "resources");

export type ResourceCategory =
  | "notes"
  | "mcq"
  | "pyq"
  | "subjective"
  | "case-based";

const CATEGORIES: ResourceCategory[] = [
  "notes",
  "mcq",
  "pyq",
  "subjective",
  "case-based",
];

/**
 * Ensure directory exists.
 */
function ensureDirectory(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Read JSON safely.
 */
function readJSON<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

/**
 * Check if file exists.
 */
function fileExists(filePath: string) {
  return fs.existsSync(filePath);
}

/**
 * Read one category safely.
 */
function loadCategory(
  className: string,
  category: ResourceCategory
): unknown[] {
  const filePath = path.join(
    METADATA_DIR,
    className,
    `${category}.json`
  );

  if (!fileExists(filePath)) {
    return [];
  }

  const data = readJSON<unknown[]>(filePath);

  if (!Array.isArray(data)) {
    console.warn(
      `⚠ ${className}/${category}.json is not an array. Ignored.`
    );
    return [];
  }

  return data;
}

/**
 * Read every category automatically.
 */
function loadAllCategories(className: string) {
  const result: Record<ResourceCategory, unknown[]> = {
    notes: [],
    mcq: [],
    pyq: [],
    subjective: [],
    "case-based": [],
  };

  for (const category of CATEGORIES) {
    result[category] = loadCategory(className, category);
  }

  return result;
}

/**
 * Convert class-name -> variable name
 * class-12 -> class12Resources
 */
function getVariableName(className: string) {
  return `${className.replace(/-/g, "")}Resources`;
}

/**
 * Generate TypeScript resource file.
 */
function generateResourceFile(
  className: string,
  data: Record<ResourceCategory, unknown[]>
) {
  ensureDirectory(OUTPUT_DIR);

  const variableName = getVariableName(className);

  const output = `import { ResourceItem } from "@/app/components/resources/resourceTypes";

export const ${variableName} = {
  notes: ${JSON.stringify(data.notes, null, 2)},

  mcq: ${JSON.stringify(data.mcq, null, 2)},

  pyq: ${JSON.stringify(data.pyq, null, 2)},

  subjective: ${JSON.stringify(data.subjective, null, 2)},

  caseBased: ${JSON.stringify(data["case-based"], null, 2)},
};
`;

  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${className}.ts`),
    output,
    "utf8"
  );

  console.log(`✅ Generated ${className}.ts`);
}

/**
 * Public Builder API
 */
export function buildResources(className: string) {
  console.log(`\n📚 Building resources for ${className}...`);

  const metadataPath = path.join(METADATA_DIR, className);

  if (!fileExists(metadataPath)) {
    throw new Error(`Metadata folder not found: ${metadataPath}`);
  }

  const data = loadAllCategories(className);

  generateResourceFile(className, data);

  console.log("🎉 Resource build completed.\n");
}