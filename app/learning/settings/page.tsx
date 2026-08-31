import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  getStudentProfile,
} from "@/lib/learning/student-profile";

import {
  getLearningPrograms,
} from "@/lib/learning/programs";

import SettingsForm from "./SettingsForm";

export default async function LearningSettingsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in?redirect_url=/learning/settings");
  }

  const profile = await getStudentProfile();

  /*
   * A student without a profile should complete
   * onboarding instead of accessing settings.
   */
  if (!profile.exists) {
    redirect("/learning/onboarding");
  }

  const programs = await getLearningPrograms();

  /*
   * Profile must have the fields required by the
   * settings form.
   */
  if (
    !profile.full_name ||
    !profile.program_id ||
    !profile.board ||
    !profile.preferred_language
  ) {
    redirect("/learning/onboarding");
  }

  /*
   * Resolve the student's primary Clerk email.
   *
   * Email is intentionally display-only.
   * It is NOT editable through Learning Settings.
   */
  const email =
    user.emailAddresses.find(
      (item) =>
        item.id === user.primaryEmailAddressId
    )?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";

  return (
    <main className="px-6 py-12">
      <div className="mx-auto max-w-3xl">

        {/* Back */}

        <Link
          href="/learning"
          className="
            text-sm
            font-medium
            text-blue-700
            transition
            hover:text-blue-900
            dark:text-blue-400
            dark:hover:text-blue-300
          "
        >
          ← Back to Learning
        </Link>

        {/* Header */}

        <div className="mt-8">
          <p
            className="
              text-sm
              font-semibold
              uppercase
              tracking-widest
              text-blue-700
              dark:text-blue-400
            "
          >
            Student Settings
          </p>

          <h1
            className="
              mt-2
              text-3xl
              font-bold
              tracking-tight
              text-blue-900
              dark:text-blue-400
              sm:text-4xl
            "
          >
            Your Learning Profile
          </h1>

          <p
            className="
              mt-3
              max-w-2xl
              leading-7
              text-slate-600
              dark:text-slate-400
            "
          >
            Keep your learning information up to date.
            Changing your class will automatically change
            the learning content available to you.
          </p>
        </div>

        {/* Form */}

        <div className="mt-8">
          <SettingsForm
            email={email}
            profile={{
              full_name: profile.full_name,
              program_id: profile.program_id,
              board: profile.board,
              school_name:
                profile.school_name ?? null,
              preferred_language:
                profile.preferred_language,
            }}
            programs={programs}
          />
        </div>

      </div>
    </main>
  );
}