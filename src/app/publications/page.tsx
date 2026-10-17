"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import {
  Loader2,
  BookOpen,
  Calendar,
  Share2,
  ArrowRight,
  Search,
  Check,
  Twitter,
  Linkedin,
  Facebook,
  MessageCircle,
  Copy,
  Mail,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Publication,
  PUBLICATION_CATEGORIES,
  getPublicationUrl,
  getSocialShareLinks,
  isCustomEmailPublication,
  extractFirstImage,
} from "@/lib/publications";

export default function PublicationsPage() {
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [apiPublications, setApiPublications] = useState<Publication[]>([]);

  // Real-time Firestore subscription to publications
  const publicationsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "publications"), orderBy("publishedAt", "desc"));
  }, [db]);

  const { data: rawPublications, loading, error: firestoreError } = useCollection(publicationsQuery);

  // Load custom emails from API if Firestore is empty or restricted
  useEffect(() => {
    if (!rawPublications || rawPublications.length === 0 || firestoreError) {
      fetch("/api/publications")
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && Array.isArray(data.publications)) {
            setApiPublications(data.publications);
          }
        })
        .catch(() => {
          setApiPublications([]);
        });
    }
  }, [rawPublications, firestoreError]);

  const publications = useMemo<Publication[]>(() => {
    const list =
      rawPublications && rawPublications.length > 0
        ? (rawPublications.map((docSnap: any) => ({
            id: docSnap.id,
            ...docSnap,
          })) as Publication[])
        : apiPublications;

    // Exclusively include real custom emails, exclude all generated seed templates
    return list.filter((p) => isCustomEmailPublication(p));
  }, [rawPublications, apiPublications]);

  // Filtered publications
  const filteredPublications = useMemo(() => {
    return publications.filter((pub) => {
      // Only show published status to the public
      if (pub.status && pub.status !== "published") return false;

      const matchesCategory =
        selectedCategory === "all" ||
        pub.category?.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        pub.title?.toLowerCase().includes(q) ||
        pub.excerpt?.toLowerCase().includes(q) ||
        pub.category?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [publications, selectedCategory, searchQuery]);

  const handleCopyLink = (pub: Publication) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://sanex.rw";
    const fullUrl = getPublicationUrl(pub, origin);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedId(pub.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleShare = (
    platform: "twitter" | "linkedin" | "facebook" | "whatsapp",
    pub: Publication
  ) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://sanex.rw";
    const fullUrl = getPublicationUrl(pub, origin);
    const links = getSocialShareLinks(pub.title, fullUrl, pub.excerpt);
    const targetUrl = links[platform];
    if (targetUrl) {
      window.open(targetUrl, "_blank", "width=600,height=480,scrollbars=yes");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />

      <main className="flex-grow py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-16 max-w-7xl">
          {/* Hero Section */}
          <div className="text-center mb-10 md:mb-14 space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-slate-900 border border-primary/30 text-xs font-extrabold uppercase tracking-widest shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Official Newsletters &amp; Insights
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-headline tracking-tight text-slate-900">
              SANEX Publications
            </h1>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Explore our sent newsletter broadcasts, sector updates, and technical environmental
              sanitation breakthroughs published by SANEX Company across Rwanda.
            </p>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="bg-white rounded-2xl border p-4 sm:p-6 shadow-sm mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search newsletters, topics, sectors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-xs bg-slate-50 border-slate-200 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Active Results Counter */}
              <div className="text-xs text-muted-foreground font-semibold flex items-center gap-2 self-start sm:self-center">
                <span>
                  Showing <strong>{filteredPublications.length}</strong> publication
                  {filteredPublications.length === 1 ? "" : "s"}
                </span>
                {(selectedCategory !== "all" || searchQuery) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                    }}
                    className="h-6 text-[10px] px-2 text-destructive hover:bg-destructive/10"
                  >
                    Reset filters
                  </Button>
                )}
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
              <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1 flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3" /> Category:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All ({publications.length})
              </button>
              {PUBLICATION_CATEGORIES.map((cat) => {
                const count = publications.filter((p) => p.category === cat).length;
                if (count === 0 && selectedCategory !== cat) return null;
                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-primary text-black shadow-xs ring-1 ring-primary"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat} {count > 0 && `(${count})`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Publications Cards Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                Loading Publications Archive...
              </p>
            </div>
          ) : filteredPublications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPublications.map((pub) => {
                const pubUrl = getPublicationUrl(pub);
                const publishedDateStr = pub.publishedAt
                  ? new Date(pub.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Recently Published";

                const thumbnailImg = pub.coverImage || extractFirstImage(pub.content);

                return (
                  <article
                    key={pub.id}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col"
                  >
                    {/* Visual Cover / Thumbnail Banner */}
                    {thumbnailImg && (
                      <Link
                        href={pubUrl}
                        className="block relative aspect-video w-full overflow-hidden bg-slate-100 border-b border-slate-100"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbnailImg}
                          alt={pub.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </Link>
                    )}

                    {/* Header Strip with Category and Date */}
                    <div className="p-5 pb-3 border-b border-slate-100 flex items-center justify-between gap-2">
                      <Badge className="bg-primary/20 hover:bg-primary/30 text-black border-primary/30 text-[10px] font-extrabold uppercase tracking-wider">
                        {pub.category || "Announcement"}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                        <Calendar className="h-3 w-3 text-muted-foreground/70" />
                        {publishedDateStr}
                      </span>
                    </div>

                    {/* Main Content Area */}
                    <div className="p-5 flex-1 flex flex-col space-y-3">
                      <Link href={pubUrl} className="block group-hover:text-primary transition-colors">
                        <h2 className="text-lg font-bold font-headline text-slate-900 line-clamp-2 leading-snug">
                          {pub.title}
                        </h2>
                      </Link>

                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed flex-1">
                        {pub.excerpt || "View this official publication and announcement online."}
                      </p>

                      {/* Cross-linked newsletters preview badge */}
                      {pub.linkedNewsletters && pub.linkedNewsletters.length > 0 && (
                        <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Related:</span>
                          {pub.linkedNewsletters.slice(0, 2).map((ln) => (
                            <span
                              key={ln.id}
                              className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded truncate max-w-[140px]"
                            >
                              {ln.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions: Read Online + Social Sharing */}
                    <div className="p-4 px-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Button
                        asChild
                        size="sm"
                        className="h-8 text-xs font-bold bg-primary text-black hover:bg-primary/90 gap-1.5 shadow-2xs rounded-lg"
                      >
                        <Link href={pubUrl}>
                          <span>Read Online</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>

                      {/* Social Share Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleShare("twitter", pub)}
                          title="Share on Twitter / X"
                          className="h-7 w-7 rounded-full bg-white border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-black flex items-center justify-center transition-colors"
                        >
                          <Twitter className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShare("linkedin", pub)}
                          title="Share on LinkedIn"
                          className="h-7 w-7 rounded-full bg-white border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-[#0A66C2] flex items-center justify-center transition-colors"
                        >
                          <Linkedin className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShare("whatsapp", pub)}
                          title="Share on WhatsApp"
                          className="h-7 w-7 rounded-full bg-white border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-emerald-600 flex items-center justify-center transition-colors"
                        >
                          <MessageCircle className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(pub)}
                          title={copiedId === pub.id ? "Copied!" : "Copy Special Link"}
                          className="h-7 w-7 rounded-full bg-white border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-black flex items-center justify-center transition-colors"
                        >
                          {copiedId === pub.id ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-4 max-w-lg mx-auto">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <BookOpen className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">No Publications Found</h3>
                <p className="text-xs text-muted-foreground">
                  {searchQuery || selectedCategory !== "all"
                    ? "Try adjusting your search criteria or resetting filters."
                    : "Sent email broadcasts and newsletters will appear here as public publications."}
                </p>
              </div>
              {(searchQuery || selectedCategory !== "all") && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="bg-primary text-black font-bold h-9 text-xs"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          )}

          {/* Newsletter Subscription Banner at Bottom */}
          <div className="mt-14 rounded-3xl bg-slate-900 text-white p-6 sm:p-10 border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                <Mail className="h-3 w-3" /> Never Miss an Official Update
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-headline text-white">
                Subscribe to SANEX Newsletters &amp; Publications
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Receive future sector wastewater management case studies, regulatory guidelines,
                and technical sanitation newsletters directly in your inbox.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-black font-extrabold text-xs h-10 px-6 rounded-full shadow-sm"
                >
                  <Link href="/book">Book an Environmental Consultation</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-slate-700 bg-white/5 hover:bg-white/10 text-white font-bold text-xs h-10 px-6 rounded-full"
                >
                  <Link href="/contact">Contact Communications Desk</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
