import Hero from "@/app/components/reflection/Hero";
import QuietIntro from "@/app/components/reflection/QuietIntro";
import FeaturedReflection from "@/app/components/reflection/FeaturedReflection";
import ReflectionWriting from "@/app/components/reflection/ReflectionWriting";
import ReflectionFeed from "@/app/components/reflection/feed/ReflectionFeed";

import { auth } from "@clerk/nextjs/server";

import { getActivePrompt } from "@/app/lib/prompt/prompt-service";

import {
  getPublishedReflectionsByPrompt,
  getReflectionByAuthorAndPrompt,
} from "@/app/lib/reflection/reflection-service";

import ReflectionDashboardCTA from "@/app/components/reflection/ReflectionDashboardCTA";

export const dynamic = "force-dynamic";

export default async function ReflectionPage() {
  const { userId } = await auth();

  const prompt = await getActivePrompt();

  const reflections =
    await getPublishedReflectionsByPrompt(
      prompt.id
    );

  const existingReflection =
    userId
      ? await getReflectionByAuthorAndPrompt(
          userId,
          prompt.id
        )
      : null;

      const editableReflection =
  existingReflection?.status === "rejected"
    ? existingReflection
    : null;

    const hasPendingReflection =
  existingReflection?.status === "pending";

  return (
    <>
      <Hero />

      <QuietIntro />

      <FeaturedReflection
        prompt={prompt}
      />

      <ReflectionDashboardCTA />

      <ReflectionWriting
  prompt={prompt}
  existingReflection={editableReflection}
  hasPendingReflection={hasPendingReflection}
/>

      <ReflectionFeed
        reflections={reflections}
      />
    </>
  );
}