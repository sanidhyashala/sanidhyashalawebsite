import { ImageResponse } from "next/og";

import { journalArticles } from "@/content/journal";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Image({
  params,
}: Props) {
  const { slug } = await params;

  const article =
    journalArticles[
      slug as keyof typeof journalArticles
    ];

  if (!article) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            fontSize: 48,
          }}
        >
          Article Not Found
        </div>
      ),
      size
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background:
            "linear-gradient(135deg,#0f172a,#1e3a8a)",
          color: "white",
        }}
      >
        <div
          style={{
            fontSize: 28,
            opacity: 0.9,
          }}
        >
          Sanidhyashala
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {article.meta.title}
          </div>

          <div
            style={{
              fontSize: 28,
              opacity: 0.8,
            }}
          >
            {article.meta.description}
          </div>
        </div>

        <div
          style={{
            fontSize: 24,
            opacity: 0.7,
          }}
        >
          From Clarity to Mastery
        </div>
      </div>
    ),
    size
  );
}