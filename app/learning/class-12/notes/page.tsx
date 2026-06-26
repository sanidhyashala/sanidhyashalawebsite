import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import ResourcePage from "@/app/components/resources/ResourcePage";
import { getClassResources } from "@/lib/resources";

export default function NotesPage() {
  const resources = getClassResources("class-12");

if (!resources) {
  throw new Error("Resources not found");
}
  console.log("NOTES DATA:", resources.notes);
  console.log("IS ARRAY:", Array.isArray(resources.notes));

  return (
    <ProtectedRoute>
      <ResourcePage
        title="Class 12 Notes"
        description="Chapter-wise notes designed to build conceptual clarity and mathematical understanding."
        category="notes"
        className="class-12"
        resources={resources.notes}
      />
    </ProtectedRoute>
  );
}