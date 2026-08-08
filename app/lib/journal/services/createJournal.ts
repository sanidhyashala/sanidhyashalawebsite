import { generateJournal } from "./generateJournal";
import { writeJournal } from "./writeJournal";

import { updateJournalRegistry } from "../registry/updateJournalRegistry";

import { journalExists } from "../filesystem/journalExists";

interface PublishJournalOptions {
  slug: string;

  hindiContent: string;

  englishContent: string;

  readingTime: string;

  coverImage?: string;

  featured?: boolean;
}

export async function publishJournal({
  slug,
  hindiContent,
  englishContent,
  readingTime,
  coverImage,
  featured = false,
}: PublishJournalOptions) {

  /*
----------------------------------------
Duplicate Check
----------------------------------------
*/

if (await journalExists(slug)) {
  throw new Error(
    `Journal "${slug}" already exists.`
  );
}
  /*
  ----------------------------------------
  Generate
  ----------------------------------------
  */

  const generated =
    await generateJournal({
      slug,
      hindiContent,
      englishContent,
      readingTime,
      coverImage,
      featured,
    });

  /*
  ----------------------------------------
  Write Files
  ----------------------------------------
  */

  const folder =
    await writeJournal(generated);

  /*
  ----------------------------------------
  Update Global Index
  ----------------------------------------
  */

  await updateJournalRegistry();

  /*
  ----------------------------------------
  Done
  ----------------------------------------
  */

  console.log("[Journal Published]", {
    slug,
    readingTime,
    folder,
  });

  return {
    success: true,

    slug,

    folder,
  };
}