import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ReadingProgress from "@/app/components/ReadingProgress";
import ArticleLayout from "@/app/components/ArticleLayout";

import ReactionButton from "@/app/components/journal/ReactionButton";
import BookmarkButton from "@/app/components/journal/BookmarkButton";
import CommentsSection from "@/app/components/journal/CommentsSection";

import { loadAllJournalArticles } from "@/content/journal";
import type { JournalEntry } from "@/content/journal/types";

import ArticleNavigation from "@/app/components/journal/ArticleNavigation";
import ViewCounter from "@/app/components/journal/ViewCounter";
import RelatedArticles from "@/app/components/journal/RelatedArticles";
import NewsletterForm from "@/app/components/newsletter/NewsletterForm";
import JournalContent from "@/app/components/journal/JournalContent";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sanidhyashala.com";

function getArticleData(
  slug: string
): JournalEntry | undefined {
  const articles = loadAllJournalArticles();

  return articles[
    slug as keyof typeof articles
  ];
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;

  const articleData = getArticleData(slug);

  if (!articleData) {
    return {
      title: "Article Not Found",
    };
  }

  const { meta, article } = articleData;

  return {
    title: meta.seoTitle,
    description: meta.seoDescription,
    keywords: [
      ...meta.tags,
      ...meta.categories,
      "Sanidhyashala",
      "Education",
      "Mathematics",
    ],
    alternates: {
      canonical: `${SITE_URL}/journal/${slug}`,
    },
    openGraph: {
      title: meta.seoTitle,
      description: meta.seoDescription,
      type: "article",
      authors: ["Sanidhyashala"],
      images: [
        {
          url: `${SITE_URL}/journal/${slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.seoTitle,
      description: meta.seoDescription,
      images: [
        `${SITE_URL}/journal/${slug}/opengraph-image`,
      ],
    },
  };
}

export default async function ArticlePage({
  params,
}: Props) {
  const { slug } = await params;

  const articleData = getArticleData(slug);

  if (!articleData) {
    notFound();
  }

  const {
    article,
    articleHindi,
    meta,
  } = articleData;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Journal",
        item: `${SITE_URL}/journal`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `${SITE_URL}/journal/${slug}`,
      },
    ],
  };

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: meta.seoDescription,
    keywords: meta.tags.join(", "),
    image: `${SITE_URL}/journal/${slug}/opengraph-image`,

// ⭐ Article is publicly accessible
isAccessibleForFree: true,

// ⭐ Bilingual Language Support
inLanguage: ["en", "hi"],

// ⭐ Contextual Article Section
articleSection: meta.categories,
    
    // ⭐ Granular 'about' properties
    about: meta.tags.map((tag) => ({
      "@type": "Thing",
      name: tag,
    })),
    
    // ⭐ Niche Educational Audience
    audience: {
      "@type": "EducationalAudience",
      educationalRole: ["Student", "Teacher", "Learner"],
    },

    author: {
      "@type": "Organization",
      name: "Sanidhyashala",
    },
    publisher: {
      "@type": "Organization",
      name: "Sanidhyashala",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.ico`, 
      }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/journal/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbLd),
        }}
      />

      <ReadingProgress />

      <ArticleLayout
        title={article.title}
        subtitle={article.subtitle}
        readingTime={meta.readingTime}
      >
        <ViewCounter
          articleSlug={slug}
        />

        <JournalContent
          article={article}
          articleHindi={articleHindi}
        />

        <div className="mt-20 border-t border-slate-200 dark:border-slate-800 pt-10">
          <p className="mb-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            Your Reflection
          </p>

          <div className="flex gap-3">
            <ReactionButton
              articleSlug={slug}
            />

            <BookmarkButton
              articleSlug={slug}
            />
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8">
          <p className="mb-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            Topics Covered
          </p>

          <div className="flex flex-wrap gap-2">
            {meta.tags.map((tag) => (
              <Link
                key={tag}
                href={`/journal/tag/${tag.toLowerCase()}`}
                className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800 transition hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>

        <ArticleNavigation
          currentSlug={slug}
        />

        <RelatedArticles
          currentSlug={slug}
        />

        <section className="mt-20 rounded-3xl border border-blue-100 bg-blue-50 p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-3 text-3xl font-bold text-blue-900 dark:text-blue-400">
              Never Miss a Reflection
            </h2>

            <p className="mb-6 text-slate-600 dark:text-slate-400">
              Subscribe to receive new journal articles,
              reflections and learning insights directly in your inbox.
            </p>

            <NewsletterForm />
          </div>
        </section>

        <CommentsSection
          articleSlug={slug}
        />
      </ArticleLayout>
    </>
  );
}