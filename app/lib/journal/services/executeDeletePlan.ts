import type {
  DeletePlan,
} from "./buildDeletePlan";

import {
  deleteJournalFolder,
} from "./deleteJournalFolder";

import {
  updateJournalRegistry,
} from "@/app/lib/journal/registry/updateJournalRegistry";

export async function executeDeletePlan(
  plan: DeletePlan
): Promise<void> {

  /*
  ----------------------------------------
  Delete CMS Journal Folder
  ----------------------------------------
  */

  await deleteJournalFolder(
    plan.slug
  );

  /*
  ----------------------------------------
  Rebuild Registry
  (Filesystem is now the single source of truth)
  ----------------------------------------
  */

  await updateJournalRegistry();

}