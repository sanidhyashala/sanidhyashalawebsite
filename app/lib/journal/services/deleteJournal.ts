import {
  buildDeletePlan,
} from "./buildDeletePlan";

import {
  executeDeletePlan,
} from "./executeDeletePlan";

export async function deleteJournal(
  slug: string
): Promise<void> {
  const plan =
    await buildDeletePlan(slug);

  await executeDeletePlan(
    plan
  );
}