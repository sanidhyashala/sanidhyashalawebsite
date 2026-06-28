import { SearchResource } from "./types";

import { ResourceItem } from "@/app/components/resources/resourceTypes";

import { class9Resources } from "@/content/resources/class-9";
import { class10Resources } from "@/content/resources/class-10";
import { class11Resources } from "@/content/resources/class-11";
import { class12Resources } from "@/content/resources/class-12";

function flatten(
  className: string,
  source: {
    notes: ResourceItem[];
    mcq: ResourceItem[];
    pyq: ResourceItem[];
    subjective: ResourceItem[];
    caseBased: ResourceItem[];
  }
): SearchResource[] {
  return [
    ...source.notes.map(
      (r): SearchResource => ({
        ...r,
        className,
        category: "notes",
      })
    ),

    ...source.mcq.map(
      (r): SearchResource => ({
        ...r,
        className,
        category: "mcq",
      })
    ),

    ...source.pyq.map(
      (r): SearchResource => ({
        ...r,
        className,
        category: "pyq",
      })
    ),

    ...source.subjective.map(
      (r): SearchResource => ({
        ...r,
        className,
        category: "subjective",
      })
    ),

    ...source.caseBased.map(
      (r): SearchResource => ({
        ...r,
        className,
        category: "case-based",
      })
    ),
  ];
}

export const SearchRegistry: SearchResource[] = [
  ...flatten("class-9", class9Resources),

  ...flatten("class-10", class10Resources),

  ...flatten("class-11", class11Resources),

  ...flatten("class-12", class12Resources),
];