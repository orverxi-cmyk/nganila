"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { useFirestore } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  Calendar,
  ChevronLeft,
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  MessageCircle,
  Copy,
  Check,
  Mail,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Eye,
} from "lucide-react";
import { useUser } from "@/firebase";
import { useTrackView, useViewsDisplay } from "@/hooks/use-view-tracker";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/slug";
import {
  Publication,
  getPublicationSlug,
  getPublicationUrl,
  getSocialShareLinks,
  isCustomEmailPublication,
  getCustomDesignedNewsletters,
  extractFirstImage,
  extractExcerptFromHtml,
} from "@/lib/publications";

/**
 * Isolated Email Publication Viewer: Renders the custom email HTML inside a responsive,
 * auto-resizing iframe to preserve 100% pixel fidelity with the email studio preview.
 */
function EmailPublicationViewer({
  htmlContent,
  title,
}: {
  htmlContent: string;
  title: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(950);

  const updateHeight = useCallback(() => {
    if (iframeRef.current && iframeRef.current.contentDocument) {
      try {
        const doc = iframeRef.current.contentDocument;
        const bodyH = doc.body?.scrollHeight || 0;
        const elemH = doc.documentElement?.scrollHeight || 0;
        const maxH = Math.max(bodyH, elemH, 800);
        if (maxH > 100) {
          setIframeHeight(maxH + 35);
        }
      } catch {
        // Cross-origin fallback
      }
    }
  }, []);

  useEffect(() => {
    updateHeight();
    const t1 = setTimeout(updateHeight, 250);
    const t2 = setTimeout(updateHeight, 800);
    const t3 = setTimeout(updateHeight, 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [htmlContent, updateHeight]);

  return (
    <div className="w-full flex justify-center items-start">
      <div className="w-full max-w-[660px] shadow-xl rounded-2xl">
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          title={title}
          onLoad={updateHeight}
          scrolling="no"
          className="w-full bg-white rounded-2xl border border-slate-200/90 transition-all duration-200 overflow-hidden block"
          style={{ height: `${iframeHeight}px`, minHeight: "750px" }}
        />
      </div>
    </div>
  );
}

interface PublicationDetailClientProps {
  initialSlug?: string;
  initialPublication?: Publication | null;
}

export default function PublicationDetailClient({
  initialSlug,
  initialPublication,
}: PublicationDetailClientProps) {
  const params = useParams();
  const rawSlug = (params?.slug as string) || initialSlug || "";
  const slugParam = useMemo(() => decodeURIComponent(rawSlug).trim(), [rawSlug]);
  const db = useFirestore();
  const { user } = useUser();
  const { showViewsOnFrontend } = useViewsDisplay();

  const isAuthorized =
    Boolean(user?.email) &&
    (user?.email?.toLowerCase() === "orverxi@gmail.com" ||
      user?.email?.toLowerCase() === "sanexcompany@gmail.com");

  const [publication, setPublication] = useState<Publication | null>(initialPublication || null);
  const [loading, setLoading] = useState(!initialPublication);
  const [copied, setCopied] = useState(false);

  // Track page view once per session
  useTrackView("publication", publication?.id, slugParam);

  // Query other publications for "Related / Next Newsletters" (only real custom publications)
  const [recentPubs, setRecentPubs] = useState<Publication[]>([]);

  // Safe multi-tier resolution: Local Baseline -> API -> Firestore
  useEffect(() => {
    if (!slugParam) return;
    let isMounted = true;

    async function resolvePublication() {
      // Tier 1: Check live API (/api/publications) which monitors the real sent and saved custom email designs
      try {
        const res = await fetch("/api/publications?limit=100");
        if (res.ok) {
          const data = await res.json();
          const rawApiList: Publication[] = data.publications || [];
          const apiList = rawApiList.filter((p) => isCustomEmailPublication(p));
          if (apiList.length > 0) {
            const matchedApi = apiList.find((p) => {
              const pSlug = p.slug ? slugify(p.slug) : slugify(p.title || "");
              return (
                p.id === slugParam ||
                pSlug === slugParam ||
                slugify(p.title || "") === slugParam
              );
            });
            if (matchedApi && isMounted) {
              setPublication(matchedApi);
              setRecentPubs(apiList.filter((p) => p.id !== matchedApi.id).slice(0, 6));
              setLoading(false);
              return;
            }
            if (isMounted) {
              setRecentPubs(apiList.slice(0, 6));
            }
          }
        }
      } catch {
        // Silently proceed
      }

      // Tier 1b: If not matched in publications list, check active email template endpoint
      try {
        const tplRes = await fetch("/api/email/template");
        if (tplRes.ok) {
          const tplData = await tplRes.json();
          if (tplData?.template && tplData.template.message) {
            const tpl = tplData.template;
            const tplSlug = slugify(tpl.name || "sustainable-liquid-waste-management-clean-water-rwanda");
            if (
              slugParam === "sustainable-liquid-waste-management-clean-water-rwanda" ||
              slugParam === "pub_custom_sanex_newsletter" ||
              slugParam === tplSlug
            ) {
              const detectedCover =
                extractFirstImage(tpl.message) ||
                "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779722491089_B25A3102.jpg?alt=media";
              const tplPub: Publication = {
                id: "pub_custom_sanex_newsletter",
                slug: "sustainable-liquid-waste-management-clean-water-rwanda",
                title: tpl.name || "SANEX Official Custom Newsletter",
                subject: tpl.subject || tpl.name || "SANEX Official Custom Newsletter",
                excerpt:
                  extractExcerptFromHtml(tpl.message) ||
                  "Sanex Company LTD is a Rwandan company specializing in liquid waste management, emptying services, and clean water delivery.",
                content: tpl.message,
                category: "Company Announcements",
                author: "SANEX Communications",
                publishedAt: tpl.updatedAt || Date.now(),
                createdAt: tpl.updatedAt || Date.now(),
                updatedAt: tpl.updatedAt || Date.now(),
                recipientCount: 85,
                status: "published",
                isCustom: true,
                coverImage: detectedCover,
                thumbnailImg: detectedCover,
                viewsCount: 25,
              };
              if (isMounted) {
                setPublication(tplPub);
                setLoading(false);
                return;
              }
            }
          }
        }
      } catch {
        // Silently proceed to Firestore
      }

      // Tier 2: Direct Firestore check
      if (db) {
        try {
          const slugQuery = query(
            collection(db, "publications"),
            where("slug", "==", slugParam),
            limit(1)
          );
          const slugSnap = await getDocs(slugQuery);
          if (!slugSnap.empty && isMounted) {
            const docData = slugSnap.docs[0].data();
            setPublication({ id: slugSnap.docs[0].id, ...docData } as Publication);
            setLoading(false);
            return;
          }

          const directRef = doc(db, "publications", slugParam);
          const directSnap = await getDoc(directRef);
          if (directSnap.exists() && isMounted) {
            setPublication({ id: directSnap.id, ...directSnap.data() } as Publication);
            setLoading(false);
            return;
          }
        } catch {
          // Gracefully suppress permission errors
        }
      }

      // Tier 3: Fallback to baseline only if nothing exists in database or API
      const defaultCustoms = getCustomDesignedNewsletters();
      const localMatch = defaultCustoms.find((p) => {
        const pSlug = p.slug ? slugify(p.slug) : slugify(p.title || "");
        return (
          p.id === slugParam ||
          pSlug === slugParam ||
          slugify(p.title || "") === slugParam
        );
      });

      if (localMatch && isMounted) {
        setPublication(localMatch);
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    resolvePublication();
    return () => {
      isMounted = false;
    };
  }, [db, slugParam]);

  // 4. Update window title and canonicalize URL
  useEffect(() => {
    if (publication) {
      if (publication.title) {
        document.title = `${publication.title} | Nganira Publications`;
      }
      const canonicalSlug = getPublicationSlug(publication);
      if (canonicalSlug && slugParam !== canonicalSlug && typeof window !== "undefined") {
        window.history.replaceState(null, "", `/publications/${canonicalSlug}`);
      }
    }
  }, [publication, slugParam]);

  // Social sharing handlers
  const origin = typeof window !== "undefined" ? window.location.origin : "https://nganira.rw";
  const canonicalUrl = publication
    ? `${origin}${getPublicationUrl(publication)}`
    : `https://nganira.rw/publications/${slugParam}`;

  const handleShare = (platform: "twitter" | "linkedin" | "facebook" | "whatsapp" | "native" | "copy") => {
    if (!publication) return;
    const title = publication.title || "Nganira Official Publication";

    if (platform === "copy") {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(canonicalUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
      return;
    }

    if (platform === "native" && navigator.share) {
      navigator.share({
        title,
        text: publication.excerpt || title,
        url: canonicalUrl,
      }).catch(() => {});
      return;
    }

    const shareUrls = getSocialShareLinks(title, canonicalUrl, publication.excerpt);
    const targetUrl = (shareUrls as any)[platform];
    if (targetUrl) {
      window.open(targetUrl, "_blank", "width=600,height=480,scrollbars=yes");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
              Retrieving Official Publication...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!publication) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-muted-foreground mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Publication Not Found</h1>
          <p className="text-xs text-muted-foreground max-w-md mb-6 leading-relaxed">
            The publication or newsletter you are looking for does not exist, may have been archived,
            or the link is no longer valid.
          </p>
          <Button asChild className="bg-primary text-black font-bold h-9 text-xs">
            <Link href="/publications">Return to All Publications</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Schema.org structured metadata for Google search indexation
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: publication.title,
    description: publication.excerpt || publication.title,
    image: publication.coverImage ? [publication.coverImage] : ["https://nganira.rw/favicon.ico"],
    datePublished: publication.publishedAt ? new Date(publication.publishedAt).toISOString() : undefined,
    dateModified: publication.updatedAt ? new Date(publication.updatedAt).toISOString() : undefined,
    author: {
      "@type": "Organization",
      name: publication.author || "Nganira Communications",
    },
    publisher: {
      "@type": "Organization",
      name: "Nganira Company LTD",
      logo: {
        "@type": "ImageObject",
        url: "https://nganira.rw/favicon.ico",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  };

  // Compile linked newsletters (explicitly attached by admin + fallback to recent ones)
  const linkedNewsletters = publication.linkedNewsletters?.length
    ? publication.linkedNewsletters
    : recentPubs
        .filter((p) => p.id !== publication.id)
        .slice(0, 3)
        .map((p) => ({
          id: p.id,
          title: p.title,
          slug: getPublicationSlug(p),
          category: p.category,
          publishedAt: p.publishedAt,
        }));

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70">
      <Navbar />

      {/* Structured SEO Data for Google Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main className="flex-grow py-6 md:py-10">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          {/* Top Bar: Navigation & Social Share Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs font-bold text-slate-700 hover:text-black w-fit -ml-1"
              >
                <Link href="/publications">
                  <ChevronLeft className="h-4 w-4" /> All Publications
                </Link>
              </Button>

              {(showViewsOnFrontend || isAuthorized) && (
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-slate-200">
                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{publication.viewsCount || 0} views</span>
                  {!showViewsOnFrontend && isAuthorized && (
                    <span className="text-[10px] text-amber-600 font-bold">(Admin only)</span>
                  )}
                </span>
              )}
            </div>

            {/* Social Share Bar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mr-1.5 flex items-center gap-1">
                <Share2 className="h-3 w-3" /> Share:
              </span>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShare("twitter")}
                className="h-8 px-2.5 text-xs font-bold gap-1.5 bg-white hover:bg-slate-50 text-slate-800"
                title="Share on Twitter / X"
              >
                <Twitter className="h-3.5 w-3.5 text-[#1DA1F2]" />
                <span className="hidden sm:inline">Twitter</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShare("linkedin")}
                className="h-8 px-2.5 text-xs font-bold gap-1.5 bg-white hover:bg-slate-50 text-slate-800"
                title="Share on LinkedIn"
              >
                <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />
                <span className="hidden sm:inline">LinkedIn</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShare("whatsapp")}
                className="h-8 px-2.5 text-xs font-bold gap-1.5 bg-white hover:bg-slate-50 text-slate-800"
                title="Share on WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShare("facebook")}
                className="h-8 px-2.5 text-xs font-bold gap-1.5 bg-white hover:bg-slate-50 text-slate-800"
                title="Share on Facebook"
              >
                <Facebook className="h-3.5 w-3.5 text-[#1877F2]" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShare("copy")}
                className={`h-8 px-3 text-xs font-bold gap-1.5 transition-all ${
                  copied
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-white hover:bg-slate-50 text-slate-800"
                }`}
                title="Copy Special SEO Link"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-600" />
                    <span>Copy Link</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Publication Presentation Container */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
            {/* Email Body Rendering */}
            <div className="p-3 sm:p-8 bg-slate-50/70 flex justify-center items-start min-h-[500px]">
              <EmailPublicationViewer
                htmlContent={publication.content}
                title={publication.title}
              />
            </div>

            {/* Bottom Sharing Bar */}
            <div className="p-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="text-xs font-bold text-slate-900">Found this publication valuable?</span>
                <p className="text-[11px] text-muted-foreground">Share this update with colleagues and sector partners.</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleShare("copy")}
                  className="h-8 text-xs font-bold bg-[#d9eaa4] text-[#26272e] hover:bg-[#cde092] gap-1.5"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Link Copied!" : "Copy Special Link"}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare("linkedin")}
                  className="h-8 text-xs font-bold gap-1.5 border-slate-200 text-[#0A66C2]"
                >
                  <Linkedin className="h-3.5 w-3.5" /> Share
                </Button>
              </div>
            </div>
          </div>

          {/* Linked Newsletters & Publications Section */}
          {linkedNewsletters && linkedNewsletters.length > 0 && (
            <div className="mt-12 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-headline text-slate-900 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" /> Linked Publications &amp; Newsletters
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Explore related sector broadcasts and official communications.
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-xs font-bold text-primary gap-1">
                  <Link href="/publications">
                    View Archive <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {linkedNewsletters.map((item) => (
                  <Link
                    key={item.id}
                    href={`/publications/${item.slug || slugify(item.title)}`}
                    className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-primary/50 shadow-2xs hover:shadow-sm transition-all group flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      {item.category && (
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary">
                          {item.category}
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                    </div>
                    <div className="pt-3 text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                      <span>Read newsletter &rarr;</span>
                      {item.publishedAt && (
                        <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Consultation CTA Banner */}
          <div className="mt-12 rounded-3xl bg-[#26272e] text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-[#636679]/20">
            <div className="space-y-1.5 text-center md:text-left">
              <h3 className="text-lg sm:text-xl font-bold font-headline text-white">
                Interested in tailored wastewater management for your facility?
              </h3>
              <p className="text-xs text-[#d9eaa4]/80 max-w-xl">
                Nganira Company LTD provides industrial vacuum exhauster services, decentralized wastewater treatment plants
                (DWTS), and maintenance across Rwanda.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button asChild className="bg-[#d9eaa4] hover:bg-[#cde092] text-[#26272e] font-extrabold text-xs h-9 px-5 rounded-full shadow-sm">
                <Link href="/book">Schedule a Consultation</Link>
              </Button>
              <Button asChild variant="outline" className="border-[#636679] bg-white/5 hover:bg-white/10 text-white font-bold text-xs h-9 px-4 rounded-full">
                <Link href="/contact">Inquire</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
