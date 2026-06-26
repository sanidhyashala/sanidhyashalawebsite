import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import ResourcePage from "@/app/components/resources/ResourcePage";
import { getClassResources } from "@/lib/resources";

export default function SubjectivePage() {
  const resources = getClassResources("class-12");

if (!resources) {
  throw new Error("Resources not found");
}
  return (
    <ProtectedRoute>
      <ResourcePage
        title="Class 12 Subjective Questions"
        description="Chapter-wise subjective questions for school examinations and board preparation."
        category="subjective"
        className="class-12"
        resources={resources.subjective}
      />
    </ProtectedRoute>
  );
}