import { chapterOrder } from "../chapter-order";

interface ResourceWithSlug {
  slug: string;
}

export function sortResources<T extends ResourceWithSlug>(
  className: string,
  resources: T[]
): T[] {
  const order = chapterOrder[className];

  if (!order || order.length === 0) {
    return resources;
  }

  return [...resources].sort((a, b) => {
    const ia = order.indexOf(a.slug);
    const ib = order.indexOf(b.slug);

    if (ia === -1 && ib === -1) return 0;

    if (ia === -1) return 1;

    if (ib === -1) return -1;

    return ia - ib;
  });
}