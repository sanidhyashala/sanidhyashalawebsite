import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import ResourcePage from "@/app/components/resources/ResourcePage";
import { getClassResources } from "@/lib/resources";

export default function PYQPage() {
  const resources = getClassResources("class-12");

if (!resources) {
  throw new Error("Resources not found");
}
  return (
    <ProtectedRoute>
      <ResourcePage
        title="Class 12 Previous Year Questions"
        description="Chapter-wise collection of important board examination questions from previous years."
        category="pyq"
        className="class-12"
        resources={resources.pyq}
      />
    </ProtectedRoute>
  );
}