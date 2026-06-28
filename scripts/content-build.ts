import { execSync } from "child_process";

function run(command: string, title: string) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🚀 ${title}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    execSync(command, {
      stdio: "inherit",
    });

    console.log(`\n✅ ${title} Completed Successfully`);
  } catch (error) {
    console.log("\n");
    console.log("========================================");
    console.log(`❌ ${title} Failed`);
    console.log("========================================");

    console.error(error);

    process.exit(1);
  }
}

console.log("\n");
console.log("========================================");
console.log("🚀 SanidhyaShala Content Build Pipeline");
console.log("========================================");

run("npm run scan:pdf", "Scanning PDFs");

run("npm run resources", "Building Resources");

run("npm run registry", "Building Registry");

console.log("\n");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📊 Build Summary");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

console.log("✅ PDF Scan");
console.log("✅ Metadata Updated");
console.log("✅ Resources Generated");
console.log("✅ Registry Generated");

console.log("\n========================================");
console.log("🎉 Content Build Completed Successfully");
console.log("========================================\n");