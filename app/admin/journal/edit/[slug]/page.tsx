import { notFound } from "next/navigation";

import AdminPage from "@/app/admin/components/layout/AdminPage";
import JournalEditor from "@/app/admin/components/JournalReviseEditor";

import { loadJournal } from "@/app/lib/journal/loader/journalLoader";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EditJournalPage({
  params,
}: PageProps) {
  const { slug } = await params;

  let journal;

  try {
    // Sirf data fetch ka kaam try block me
    journal = await loadJournal(slug);
  } catch {
    // Agar fetch fail hua toh 404
    notFound();
  }

  // UI rendering try/catch ke baahar
  return (
    <AdminPage
      title="Edit Journal"
      description="Edit the journal source files."
      sectionTitle="Edit Journal"
    >
      <JournalEditor
        slug={slug}
        initialHindi={
          journal.hindi
        }
        initialEnglish={
          journal.english
        }
      />
    </AdminPage>
  );
}