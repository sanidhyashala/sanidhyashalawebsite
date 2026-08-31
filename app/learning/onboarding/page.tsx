import { redirect } from "next/navigation";

import {
  getStudentProfile,
} from "@/lib/learning/student-profile";

import {
  getLearningPrograms,
} from "@/lib/learning/programs";

import OnboardingForm from "./OnboardingForm";

export default async function LearningOnboardingPage() {
  const profile = await getStudentProfile();

  /*
   * If the student already has a profile,
   * onboarding is no longer required.
   */
  if (profile.exists) {
    redirect("/learning");
  }

  const programs = await getLearningPrograms();

  return (
    <main className="px-6 py-16">
      <div className="mx-auto max-w-2xl">

        <div className="mb-10">
          <p
            className="
              mb-3
              text-sm
              font-semibold
              uppercase
              tracking-widest
              text-blue-700
              dark:text-blue-400
            "
          >
            Welcome to SanidhyaShala
          </p>

          <h1
            className="
              text-4xl
              font-bold
              tracking-tight
              text-blue-900
              dark:text-blue-400
            "
          >
            Tell us a little about yourself
          </h1>

          <p
            className="
              mt-4
              text-lg
              leading-8
              text-slate-600
              dark:text-slate-300
            "
          >
            This helps us show you the learning
            content that belongs to your class.
          </p>
        </div>

        <OnboardingForm programs={programs} />

      </div>
    </main>
  );
}