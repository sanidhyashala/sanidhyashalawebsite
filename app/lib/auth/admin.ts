import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

/**
 * Temporary Admin Guard
 *
 * Later this will use Clerk Roles
 * or a database-backed permissions system.
 */

const ADMIN_USER_IDS = [
  "user_3K6deVSPCxvvBWeGAkNK5R2JlTE",
];

export async function requireAdmin() {
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  if (!ADMIN_USER_IDS.includes(userId)) {
    notFound();
  }

  return userId;
}