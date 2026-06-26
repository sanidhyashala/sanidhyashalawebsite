import fs from "fs";
import path from "path";

export function getStoragePath(
  category: string,
  className: string
) {
  return path.join(
    process.cwd(),
    "storage",
    category,
    className
  );
}

export function getFilesFromStorage(
  category: string,
  className: string
) {
  const folderPath = getStoragePath(category, className);

  if (!fs.existsSync(folderPath)) {
    return [];
  }

  return fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith(".pdf"));
}