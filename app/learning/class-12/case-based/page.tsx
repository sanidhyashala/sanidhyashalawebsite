import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import ResourcePage from "@/app/components/resources/ResourcePage";
import { getClassResources } from "@/lib/resources";

export default function CaseBasedPage() {
  const resources = getClassResources("class-12");

if (!resources) {
  throw new Error("Resources not found");
}
  return (
    <ProtectedRoute>
      <ResourcePage
        title="Class 12 Case-Based Questions"
        description="Chapter-wise competency-based and case-based questions aligned with the latest CBSE examination pattern."
        category="case-based"
        className="class-12"
        resources={resources.caseBased}
      />
    </ProtectedRoute>
  );
}