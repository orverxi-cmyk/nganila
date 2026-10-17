"use client";

import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Calendar, ChevronLeft, User, Share2, Twitter, Linkedin, Facebook, Link as LinkIcon, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { slugify, getArticleSlug, getArticleUrl } from "@/lib/slug";
import { useTrackView, useViewsDisplay, getArticleViewsCount } from "@/hooks/use-view-tracker";

interface ArticleDetailClientProps {
  initialSlug?: string;
  initialArticle?: any;
}

export default function ArticleDetailClient({ initialSlug, initialArticle }: ArticleDetailClientProps) {
  const params = useParams();
  const router = useRouter();
  const rawSlug = (params?.slug || params?.articleId || initialSlug) as string;
  const slugParam = React.useMemo(() => decodeURIComponent(rawSlug || "").trim(), [rawSlug]);
  const db = useFirestore();
  const { user } = useUser();
  const { showViewsOnFrontend, articleViews } = useViewsDisplay();

  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile } = useDoc(userDocRef);

  const isAuthorizedAdmin =
    user?.email?.toLowerCase() === "orverxi@gmail.com" ||
    user?.email?.toLowerCase() === "sanexcompany@gmail.com" ||
    (user as any)?.role === "admin" ||
    userProfile?.role === "admin";

  const [resolvedId, setResolvedId] = React.useState<string | null>(initialArticle?.id || null);
  const [resolving, setResolving] = React.useState(!initialArticle);
  const [copied, setCopied] = React.useState(false);

  // Resolve article ID from slug, ID, or title
  React.useEffect(() => {
    const firestore = db;
    if (!firestore || !slugParam) return;
    let isMounted = true;

    async function resolveArticle() {
      setResolving(true);
      try {
        // 1. Try querying by dedicated `slug` field in Firestore
        const slugQuery = query(collection(firestore!, "articles"), where("slug", "==", slugParam), limit(1));
        const slugSnap = await getDocs(slugQuery);
        if (!slugSnap.empty) {
          if (isMounted) {
            setResolvedId(slugSnap.docs[0].id);
            setResolving(false);
          }
          return;
        }

        // 2. Try direct document ID (supports legacy links like /articles/[id])
        const directDocRef = doc(firestore!, "articles", slugParam);
        const directSnap = await getDoc(directDocRef);
        if (directSnap.exists()) {
          if (isMounted) {
            setResolvedId(directSnap.id);
            setResolving(false);
          }
          return;
        }

        // 3. Fallback: match by dynamically slugified title across articles
        const allSnap = await getDocs(collection(firestore!, "articles"));
        const matched = allSnap.docs.find((d) => {
          const item = d.data();
          const itemSlug = item.slug ? slugify(item.slug) : slugify(item.title || "");
          return itemSlug === slugParam || d.id === slugParam;
        });

        if (matched && isMounted) {
          setResolvedId(matched.id);
          setResolving(false);
          return;
        }

        if (isMounted) {
          setResolvedId(null);
          setResolving(false);
        }
      } catch (err) {
        console.error("Error resolving article slug:", err);
        if (isMounted) {
          setResolvedId(null);
          setResolving(false);
        }
      }
    }

    resolveArticle();
    return () => {
      isMounted = false;
    };
  }, [db, slugParam]);

  // Subscribe to real-time updates for the resolved document
  const articleRef = React.useMemo(
    () => (db && resolvedId ? doc(db, "articles", resolvedId) : null),
    [db, resolvedId]
  );
  const { data: realtimeArticle, loading: docLoading } = useDoc(articleRef);

  const article = realtimeArticle || initialArticle;

  // Automatically record view upon reading article (with session deduplication)
  useTrackView("article", resolvedId, slugParam);

  const loading = resolving || (Boolean(resolvedId) && docLoading && !initialArticle);

  // Set document title and update browser URL if accessed via legacy ID
  React.useEffect(() => {
    if (article) {
      if (article.title) {
        document.title = `${article.title} | SANEX Rwanda`;
      }
      // If user landed on raw Firestore doc ID, canonicalize the browser URL to clean SEO slug
      const canonicalSlug = getArticleSlug(article);
      if (canonicalSlug && slugParam !== canonicalSlug && typeof window !== "undefined") {
        window.history.replaceState(null, "", `/articles/${canonicalSlug}`);
      }
    }
  }, [article, slugParam]);

  const handleShare = (platform: "twitter" | "linkedin" | "facebook" | "copy") => {
    if (!article) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://sanex.rw";
    const canonicalUrl = `${origin}${getArticleUrl(article)}`;
    const title = article.title || "SANEX Liquid Waste Management";

    if (platform === "copy") {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(canonicalUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      return;
    }

    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(title)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`;
        break;
    }
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <h1 className="text-[16px] font-bold mb-4">Article Not Found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            The article you requested could not be found or may have been moved.
          </p>
          <Button asChild className="bg-primary text-black font-bold">
            <Link href="/articles">Back to Articles</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const canonicalUrl = `https://sanex.rw${getArticleUrl(article)}`;

  // Schema.org Article structured data for rich search engine results
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt || article.title,
    image: article.imageUrl ? [article.imageUrl] : [],
    datePublished: article.createdAt ? new Date(article.createdAt).toISOString() : undefined,
    dateModified: article.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
    author: {
      "@type": "Organization",
      name: article.author || "SANEX Team",
    },
    publisher: {
      "@type": "Organization",
      name: "SANEX Company Ltd",
      logo: {
        "@type": "ImageObject",
        url: "https://sanex.rw/favicon.ico",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  };

  return (
    <div className="min-h-screen flex flex-col font-arial">
      <Navbar />

      {/* Structured SEO Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main className="flex-grow py-5">
        <div className="container mx-auto px-4 md:px-16 max-w-4xl">
          <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
            <Button asChild variant="ghost" className="gap-2 text-primary font-bold -ml-4">
              <Link href="/articles">
                <ChevronLeft className="h-4 w-4" /> Back to Articles
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-2 flex items-center gap-1">
                <Share2 className="h-3 w-3" /> Share:
              </span>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                onClick={() => handleShare("twitter")}
                title="Share on Twitter / X"
              >
                <Twitter className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                onClick={() => handleShare("linkedin")}
                title="Share on LinkedIn"
              >
                <Linkedin className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                onClick={() => handleShare("facebook")}
                title="Share on Facebook"
              >
                <Facebook className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                onClick={() => handleShare("copy")}
                title={copied ? "Copied!" : "Copy SEO Link"}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <LinkIcon className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          <header className="mb-5 space-y-4">
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" />{" "}
                {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : ""}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3 text-primary" /> {article.author || "SANEX Team"}
              </span>
              {article.category && (
                <span className="px-2 py-0.5 rounded bg-primary text-black font-bold">
                  {article.category}
                </span>
              )}
              {(showViewsOnFrontend || isAuthorizedAdmin) && (
                <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 font-medium">
                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{getArticleViewsCount(article, articleViews)} views</span>
                  {!showViewsOnFrontend && isAuthorizedAdmin && (
                    <span className="text-[8px] text-amber-600 font-bold ml-0.5">(Admin only)</span>
                  )}
                </span>
              )}
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold font-headline leading-tight">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-[14px] text-muted-foreground italic leading-relaxed">
                {article.excerpt}
              </p>
            )}
          </header>

          {article.imageUrl && (
            <div className="relative rounded-2xl overflow-hidden mb-5 shadow-xl border border-primary/10 bg-muted flex justify-center">
              <Image
                src={article.imageUrl}
                alt={article.imageAlt || article.title || "SANEX Liquid Waste Management in Rwanda"}
                width={article.imageWidth || 1200}
                height={article.imageHeight || 600}
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-contain h-auto w-full max-w-full"
                priority
              />
            </div>
          )}

          <article className="prose prose-sm lg:prose-lg max-w-none prose-headings:font-headline prose-primary">
            <div
              className="text-foreground/80 font-normal text-[14px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </article>

          <div className="mt-10 pt-5 border-t border-primary/20">
            <h3 className="text-[16px] font-bold font-headline mb-4">Want to learn more?</h3>
            <div className="flex flex-wrap gap-x-[5px] gap-y-[20px]">
              <Button asChild className="h-12 px-8 bg-primary text-black font-bold text-[12px] uppercase tracking-widest rounded-full shadow-md">
                <Link href="/book">Schedule a Consultation</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 px-8 border-primary text-primary font-bold text-[12px] uppercase tracking-widest rounded-full">
                <Link href="/articles">Browse Other Stories</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
