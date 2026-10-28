import type { Metadata } from "next";
import { getArticleForMetadata } from "@/lib/server-articles";
import ArticleDetailClient from "./ArticleDetailClient";

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

const DEFAULT_FALLBACK_IMAGE =
  "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media";

function toAbsoluteUrl(url?: string): string {
  if (!url) return DEFAULT_FALLBACK_IMAGE;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `https://nganira.rw${url}`;
  return `https://nganira.rw/${url}`;
}

/**
 * Server-rendered metadata generator for social media crawlers.
 * WhatsApp, Twitter/X, LinkedIn, Facebook, and Telegram fetch this before client-side hydration,
 * ensuring rich photo cards, headlines, and descriptions are displayed.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const rawSlug = resolved?.slug || "";
  const article = await getArticleForMetadata(rawSlug);

  const title = article?.title
    ? `${article.title} | Nganira Rwanda`
    : "Article | Nganira Company LTD Rwanda";

  const description =
    article?.excerpt?.trim() ||
    "Read modern liquid waste management, septic draining, and environmental solutions by Nganira Company LTD in Rwanda.";

  const canonicalUrl = `https://nganira.rw/articles/${rawSlug}`;
  const imageUrl = toAbsoluteUrl(article?.imageUrl);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      locale: "en_US",
      url: canonicalUrl,
      title,
      description,
      siteName: "Nganira Rwanda",
      publishedTime: article?.createdAt ? new Date(article.createdAt).toISOString() : undefined,
      modifiedTime: article?.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
      authors: article?.author ? [article.author] : ["Nganira Company LTD"],
      images: [
        {
          url: imageUrl,
          width: article?.imageWidth || 1200,
          height: article?.imageHeight || 630,
          alt: article?.imageAlt || article?.title || "Nganira Liquid Waste Management Article",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: "@NganiraRwanda",
      site: "@NganiraRwanda",
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  const slug = resolved?.slug || "";
  const article = await getArticleForMetadata(slug);

  return <ArticleDetailClient initialSlug={slug} initialArticle={article} />;
}
