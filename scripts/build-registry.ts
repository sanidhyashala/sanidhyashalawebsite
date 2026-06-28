import fs from "fs";
import path from "path";

const RESOURCE_DIR = path.join(
  process.cwd(),
  "content",
  "resources"
);

const OUTPUT_DIR = path.join(
  process.cwd(),
  "content",
  "registry"
);

const OUTPUT_FILE = path.join(
  OUTPUT_DIR,
  "registry.ts"
);

function ensureDirectory(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getResourceFiles() {
  return fs
  .readdirSync(RESOURCE_DIR)
  .filter(
    (file) =>
      file.endsWith(".ts") &&
      file !== "index.ts"
  );
}

function buildRegistry() {
  console.log("\n📦 Building Registry...\n");

  ensureDirectory(OUTPUT_DIR);

  const files = getResourceFiles();

  const registry: Record<string, string> = {};

  for (const file of files) {
    const className = file.replace(".ts", "");

    registry[className] = `@/content/resources/${className}`;

    console.log(`✅ Registered ${className}`);
  }

  const output = `

export const registry = ${JSON.stringify(
    registry,
    null,
    2
)};

`;

  fs.writeFileSync(
    OUTPUT_FILE,
    output,
    "utf8"
  );

  console.log("\n🎉 Registry Generated.\n");
}

buildRegistry();