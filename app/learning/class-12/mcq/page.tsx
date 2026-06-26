import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import ResourcePage from "@/app/components/resources/ResourcePage";
import { getClassResources } from "@/lib/resources";

export default function MCQPage() {
  const resources = getClassResources("class-12");

if (!resources) {
  throw new Error("Resources not found");
}
  return (
    <ProtectedRoute>
      <ResourcePage
        title="Class 12 MCQ Practice"
        description="Chapter-wise multiple choice questions designed for revision, concept checking and examination preparation."
        category="mcq"
        className="class-12"
        resources={resources.mcq}
      />
    </ProtectedRoute>
  );
}