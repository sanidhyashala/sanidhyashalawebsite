import AdminPage from "../components/layout/AdminPage";

import PublishingStudio from "../components/publishing/PublishingStudio";

import PublishedJournalList from "../components/PublishedJournalList";

import LegacyJournalList from "../components/LegacyJournalList";

export default function JournalAdminPage() {
  return (
    <AdminPage
      title="Publishing Studio"
      description="Create and publish SanidhyaShala journals."
      sectionTitle="Publishing Studio"
    >
      <div className="space-y-12">

        <PublishingStudio />

        <PublishedJournalList />

        <LegacyJournalList />

      </div>
    </AdminPage>
  );
}