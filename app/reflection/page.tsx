import Hero from "@/app/components/reflection/Hero";
import QuietIntro from "@/app/components/reflection/QuietIntro";
import FeaturedReflection from "@/app/components/reflection/FeaturedReflection";
import ReflectionWriting from "@/app/components/reflection/ReflectionWriting";
import ReflectionFeed from "@/app/components/reflection/feed/ReflectionFeed";
import ReflectionDashboardCTA from "@/app/components/reflection/ReflectionDashboardCTA";

import NewsletterForm from "@/app/components/newsletter/NewsletterForm";

import { auth } from "@clerk/nextjs/server";

import { getActivePrompt } from "@/app/lib/prompt/prompt-service";

import {
  getPublishedReflectionsByPrompt,
  getReflectionByAuthorAndPrompt,
} from "@/app/lib/reflection/reflection-service";

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

      <section className="mx-auto max-w-5xl px-6 pb-28">
        <NewsletterForm
          title="Continue the Conversation"
          description="Receive future reflection prompts, thoughtful essays, and quiet moments of learning directly in your inbox."
          buttonText="Stay Connected"
        />
      </section>
    </>
  );
}