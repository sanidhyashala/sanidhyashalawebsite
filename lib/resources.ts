import { resourceRegistry } from "@/content/resources";

export function getClassResources(className: string) {
  return (
    resourceRegistry[
      className as keyof typeof resourceRegistry
    ] ?? null
  );
}