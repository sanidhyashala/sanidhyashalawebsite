import { class9Resources } from "./class-9";
import { class10Resources } from "./class-10";
import { class11Resources } from "./class-11";
import { class12Resources } from "./class-12";

export const resourceRegistry = {
  "class-9": class9Resources,
  "class-10": class10Resources,
  "class-11": class11Resources,
  "class-12": class12Resources,
} as const;

export type ClassName = keyof typeof resourceRegistry;