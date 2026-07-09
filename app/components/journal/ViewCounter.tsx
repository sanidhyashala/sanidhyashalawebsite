"use client";

import {
  useEffect,
  useState,
} from "react";

interface Props {
  articleSlug: string;
}

export default function ViewCounter({
  articleSlug,
}: Props) {
  const [views, setViews] =
    useState<number>(0);

  useEffect(() => {
    async function loadViews() {
      try {
        const response =
          await fetch(
            `/api/journal/view?slug=${articleSlug}`
          );

        const data =
          await response.json();

        setViews(data.views ?? 0);

        const storageKey =
          `viewed_${articleSlug}`;

        const lastViewed =
          localStorage.getItem(
            storageKey
          );

        const now = Date.now();

        const twentyFourHours =
          24 * 60 * 60 * 1000;

        const shouldCountView =
          !lastViewed ||
          now -
            Number(lastViewed) >
            twentyFourHours;

        if (!shouldCountView) {
          return;
        }

        const incrementResponse =
          await fetch(
            "/api/journal/view",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                articleSlug,
              }),
            }
          );

        const incrementData =
          await incrementResponse.json();

        setViews(
          incrementData.views ?? 0
        );

        localStorage.setItem(
          storageKey,
          now.toString()
        );
      } catch {
        console.error(
          "Failed to load views"
        );
      }
    }

    loadViews();
  }, [articleSlug]);

  return (
    <div className="text-sm text-slate-500 dark:text-slate-400">
      👁{" "}
      {views.toLocaleString()} Views
    </div>
  );
}