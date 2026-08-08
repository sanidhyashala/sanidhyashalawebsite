import { promises as fs } from "fs";

export async function removeDirectory(
  directory: string
) {

  // Used only for rollback after failed journal generation.
  
  await fs.rm(directory, {
    recursive: true,
    force: true,
  });
}