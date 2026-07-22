import { FileText } from "lucide-react";

import {
  getReflectionList,
} from "@/app/actions/admin.actions";

import type { ReflectionStatus } from "@/app/lib/reflection/reflection-types";

import ReflectionModerationCard from "./components/ReflectionModerationCard";

import AdminPage from "../components/layout/AdminPage";
import EmptyState from "../components/ui/EmptyState";

interface Props {
  searchParams: Promise<{
    status?: ReflectionStatus;
  }>;
}

export default async function AdminReflectionsPage({
  searchParams,
}: Props) {
  const { status } = await searchParams;

  const reflections =
    await getReflectionList(status);

  const sectionTitle =
    status
      ? `${status.charAt(0).toUpperCase()}${status.slice(1)} Reflections`
      : "Pending Reflections";

  return (
    <AdminPage
      title="Reflection Moderation"
      description="Review reflections submitted by the community."
      sectionTitle={sectionTitle}
      sectionDescription={`${reflections.length} reflections`}
    >
      {reflections.length === 0 ? (
        <EmptyState
          title="No Reflections Found"
          description="Nothing matches the selected status."
          icon={<FileText size={28} />}
        />
      ) : (
        <div className="space-y-6">
          {reflections.map((reflection) => (
            <ReflectionModerationCard
              key={reflection.id}
              reflection={reflection}
            />
          ))}
        </div>
      )}
    </AdminPage>
  );
}