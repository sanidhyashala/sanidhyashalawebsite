import path from "path";
import { getPDFInfo } from "../lib/pdf/engine";

async function main() {
  const file = path.join(
    process.cwd(),
    "storage",
    "notes",
    "class-12",
    "relations-and-functions.pdf"
  );

  const info = await getPDFInfo(file);

  console.log("\n📄 PDF INFO");

  console.log(info);
}

main().catch(console.error);