import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default async function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}