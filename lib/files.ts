import fs from "fs";
import path from "path";

export function getPdfPath(
  category: string,
  className: string,
  fileName: string
) {
  const filePath = path.join(
    process.cwd(),
    "storage",
    category,
    className,
    fileName
  );

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return filePath;
}