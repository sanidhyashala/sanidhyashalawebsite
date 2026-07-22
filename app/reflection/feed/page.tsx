import ReflectionFeed from "@/app/components/reflection/feed/ReflectionFeed";

import {
  getReflections,
} from "@/app/lib/reflection/reflection-service";

export default async function ReflectionFeedPage() {
  const reflections =
    await getReflections("published");

  return (
    <ReflectionFeed
      reflections={reflections}
    />
  );
}