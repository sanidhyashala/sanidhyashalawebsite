import { auth } from "@clerk/nextjs/server";

export async function requireLearningAuth() {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    throw new Error("Authentication required for Learning.");
  }

  return {
    userId,
  };
}