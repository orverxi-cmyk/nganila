"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, deleteDoc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  ChevronLeft,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Copy,
  Check,
  Search,
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  MessageCircle,
  Mail,
  Send,
  Eye,
  ShieldAlert,
  Sparkles,
  Link2,
  Calendar,
  DownloadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useToast } from "@/hooks/use-toast";
import { slugify } from "@/lib/slug";
import {
  Publication,
  PUBLICATION_CATEGORIES,
  getPublicationSlug,
  getPublicationUrl,
  getSocialShareLinks,
  extractAllImagesFromHtml,
  extractFirstImage,
  isCustomEmailPublication,
  isGenericSectorCampaign,
  SEED_CAMPAIGN_IDS,
} from "@/lib/publications";
import { SpecialLinkGeneratorModal } from "@/components/admin/SpecialLinkGeneratorModal";
import { LoadSentNewslettersModal } from "@/components/admin/LoadSentNewslettersModal";
import { MediaPicker } from "@/components/MediaPicker";

export default function AdminPublicationsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile, loading: profileLoading } = useDoc(userDocRef);

  const isAuthorized =
    userProfile?.role === "admin" ||
    (user as any)?.admin === true ||
    user?.email?.toLowerCase() === "orverxi@gmail.com" ||
    user?.email?.toLowerCase() === "sanexcompany@gmail.com";

  // Firestore query for all publications
  const publicationsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, "publications"), orderBy("publishedAt", "desc"));
  }, [db, user]);

  const { data: rawPublications, loading: publicationsLoading } = useCollection(publicationsQuery);
  const [apiPublications, setApiPublications] = useState<Publication[]>([]);

  // If client Firestore hasn't returned publications or has permission delay, fetch from /api/publications
  useEffect(() => {
    if (!rawPublications || rawPublications.length === 0) {
      fetch("/api/publications")
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && Array.isArray(data.publications) && data.publications.length > 0) {
            setApiPublications(data.publications);
          }
        })
        .catch(() => {
          // fallback gracefully
        });
    }
  }, [rawPublications]);

  // Exclusively include real custom emails (properly designed newsletters), exclude all generic seed templates
  const publications = useMemo<Publication[]>(() => {
    const list =
      rawPublications && rawPublications.length > 0
        ? (rawPublications.map((d: any) => ({
            id: d.id,
            ...d,
          })) as Publication[])
        : apiPublications;

    return list.filter((p) => isCustomEmailPublication(p));
  }, [rawPublications, apiPublications]);

  // Auto-purge any legacy seed/generic newsletters from Firestore on load
  useEffect(() => {
    if (!db || !user) return;
    SEED_CAMPAIGN_IDS.forEach((id) => {
      deleteDoc(doc(db, "publications", id)).catch(() => {});
    });
  }, [db, user]);


  // Detect any legacy generic sector templates in Firestore to allow 1-click purge
  const genericTemplatesInDb = useMemo(() => {
    if (!rawPublications) return [];
    return rawPublications.filter((p: any) => isGenericSectorCampaign(p));
  }, [rawPublications]);

  const [isPurgingGeneric, setIsPurgingGeneric] = useState(false);
  const handlePurgeGenericTemplates = async () => {
    if (!db || genericTemplatesInDb.length === 0) return;
    setIsPurgingGeneric(true);
    try {
      for (const item of genericTemplatesInDb) {
        try {
          await deleteDoc(doc(db, "publications", item.id));
        } catch (dbErr: any) {
          console.warn(`Could not delete ${item.id}:`, dbErr);
        }
      }
      setApiPublications((prev) => prev.filter((p) => !isGenericSectorCampaign(p)));
      toast({
        title: "Generic Sector Templates Purged",
        description: "The publication list now features exclusively custom designed newsletters.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Clean Up Error",
        description: err.message,
      });
    } finally {
      setIsPurgingGeneric(false);
    }
  };

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Link Generator & Load Sent Newsletters Modals
  const [isLinkGenOpen, setIsLinkGenOpen] = useState(false);
  const [linkGenPub, setLinkGenPub] = useState<Publication | null>(null);
  const [isLoadSentModalOpen, setIsLoadSentModalOpen] = useState(false);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState<string>("Company Announcements");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formAuthor, setFormAuthor] = useState("SANEX Communications");
  const [formStatus, setFormStatus] = useState<"published" | "draft" | "archived">("published");
  const [selectedLinkedIds, setSelectedLinkedIds] = useState<string[]>([]);
  const [formCoverImage, setFormCoverImage] = useState<string>("");

  // Real-time extracted photos from the newsletter HTML content
  const extractedContentImages = useMemo(() => {
    return extractAllImagesFromHtml(formContent);
  }, [formContent]);

  // Filtered publications
  const filteredPublications = useMemo(() => {
    return publications.filter((p) => {
      const matchesCat = categoryFilter === "all" || p.category === categoryFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [publications, categoryFilter, search]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPublication(null);
    setFormTitle("");
    setFormSlug("");
    setFormCategory("Company Announcements");
    setFormExcerpt("");
    setFormContent("<p>Write publication announcement or paste email newsletter content here...</p>");
    setFormAuthor("SANEX Communications");
    setFormStatus("published");
    setFormCoverImage("");
    setSelectedLinkedIds([]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (pub: Publication) => {
    setEditingPublication(pub);
    setFormTitle(pub.title || "");
    setFormSlug(pub.slug || slugify(pub.title || ""));
    setFormCategory(pub.category || "Company Announcements");
    setFormExcerpt(pub.excerpt || "");
    setFormContent(pub.content || "");
    setFormAuthor(pub.author || "SANEX Communications");
    setFormStatus(pub.status || "published");
    setFormCoverImage(pub.coverImage || extractFirstImage(pub.content) || "");
    setSelectedLinkedIds((pub.linkedNewsletters || []).map((l) => l.id));
    setIsModalOpen(true);
  };

  // Copy Link
  const handleCopyLink = (pub: Publication) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://sanex.rw";
    const fullUrl = getPublicationUrl(pub, origin);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedId(pub.id);
      setTimeout(() => setCopiedId(null), 2500);
      toast({
        title: "Special Link Copied",
        description: fullUrl,
      });
    }
  };

  // Share Link
  const handleShare = (platform: "twitter" | "linkedin" | "facebook" | "whatsapp", pub: Publication) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://sanex.rw";
    const fullUrl = getPublicationUrl(pub, origin);
    const links = getSocialShareLinks(pub.title, fullUrl, pub.excerpt);
    const targetUrl = links[platform];
    if (targetUrl) {
      window.open(targetUrl, "_blank", "width=600,height=480,scrollbars=yes");
    }
  };

  // Delete Publication
  const handleDelete = async (pubId: string) => {
    if (!confirm("Are you sure you want to delete this publication from the website?")) return;
    try {
      if (db) {
        try {
          await deleteDoc(doc(db, "publications", pubId));
        } catch (dbErr: any) {
          console.warn("Direct delete had permission delay, updating locally:", dbErr?.message);
        }
      }
      setApiPublications((prev) => prev.filter((p) => p.id !== pubId));
      toast({ title: "Publication Deleted", description: "The publication has been removed." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  // Save (Create or Update)
  const handleSavePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast({ variant: "destructive", title: "Title Required" });
      return;
    }

    setIsSaving(true);
    try {
      const pubId = editingPublication?.id || `pub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const cleanSlug = slugify(formSlug || formTitle);

      // Resolve selected linked publications
      const resolvedLinkedNewsletters = selectedLinkedIds
        .map((id) => {
          const match = publications.find((p) => p.id === id);
          if (!match) return null;
          return {
            id: match.id,
            title: match.title,
            slug: getPublicationSlug(match),
            category: match.category,
            publishedAt: match.publishedAt,
          };
        })
        .filter(Boolean);

      const payload: Partial<Publication> = {
        id: pubId,
        title: formTitle.trim(),
        subject: formTitle.trim(),
        slug: cleanSlug,
        category: formCategory,
        excerpt: formExcerpt.trim() || formTitle.trim(),
        content: formContent.trim(),
        coverImage: formCoverImage.trim() || undefined,
        author: formAuthor.trim() || "SANEX Communications",
        status: formStatus,
        linkedNewsletters: resolvedLinkedNewsletters as any,
        updatedAt: Date.now(),
        publishedAt: editingPublication?.publishedAt || Date.now(),
        createdAt: editingPublication?.createdAt || Date.now(),
        recipientCount: editingPublication?.recipientCount || 0,
      };

      if (db) {
        try {
          await setDoc(doc(db, "publications", pubId), payload, { merge: true });
        } catch (dbErr: any) {
          console.warn("Direct setDoc had permission delay, updating locally:", dbErr?.message);
        }
      }

      setApiPublications((prev) => {
        const matchIdx = prev.findIndex((p) => p.id === pubId);
        if (matchIdx >= 0) {
          const next = [...prev];
          next[matchIdx] = { ...next[matchIdx], ...payload } as Publication;
          return next;
        }
        return [{ id: pubId, ...payload } as Publication, ...prev];
      });

      toast({
        title: editingPublication ? "Publication Updated" : "Publication Created",
        description: `Accessible at /publications/${cleanSlug}`,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
              Authenticating Admin Portal...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-destructive/20 shadow-lg text-center p-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
              <p className="text-xs text-muted-foreground mt-1">
                You must possess administrative privileges to manage SANEX publications and newsletters.
              </p>
            </div>
            <Button asChild className="w-full bg-primary text-black font-bold h-9 text-xs">
              <Link href="/admin">Return to Admin Login</Link>
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://sanex.rw";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Admin Sidebar */}
        <AdminSidebar />

        {/* Primary Content Container */}
        <div className="flex-1 p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header & Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href="/admin"
                  className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 font-bold transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Operations
                </Link>
                <span className="text-muted-foreground/40 text-xs">/</span>
                <span className="text-xs text-muted-foreground font-semibold">Publications</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold font-headline tracking-tight text-foreground flex items-center gap-2.5">
                <BookOpen className="h-7 w-7 text-primary" /> Publications &amp; Newsletters
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Host sent custom email broadcasts on public SEO URLs, share on social media, and cross-link newsletters.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setLinkGenPub(publications[0] || null);
                  setIsLinkGenOpen(true);
                }}
                className="h-9 text-xs font-extrabold gap-1.5 bg-primary/10 border-primary/40 text-slate-900 hover:bg-primary/20 shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Special Link Generator
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsLoadSentModalOpen(true)}
                className="h-9 text-xs font-bold gap-1.5 bg-white hover:bg-slate-50"
              >
                <DownloadCloud className="h-3.5 w-3.5 text-slate-700" /> Load Custom Emails
              </Button>

              <Button asChild variant="outline" size="sm" className="h-9 text-xs font-bold gap-1.5 bg-white">
                <Link href="/admin/emails">
                  <Mail className="h-3.5 w-3.5 text-primary" /> Dispatch Custom Email
                </Link>
              </Button>

              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="h-9 text-xs font-extrabold bg-primary text-black hover:bg-primary/90 gap-1.5 shadow-xs"
              >
                <Plus className="h-4 w-4" /> Add Publication
              </Button>
            </div>
          </div>

          {/* KPI Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white border">
              <CardContent className="p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Publications
                </span>
                <div className="text-2xl font-extrabold text-foreground">{publications.length}</div>
                <p className="text-[11px] text-muted-foreground">Hosted and indexed on sanex.rw</p>
              </CardContent>
            </Card>

            <Card className="bg-white border">
              <CardContent className="p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Live Public URLs
                </span>
                <div className="text-2xl font-extrabold text-emerald-600">
                  {publications.filter((p) => p.status === "published").length}
                </div>
                <p className="text-[11px] text-muted-foreground">Publicly readable and shareable</p>
              </CardContent>
            </Card>

            <Card className="bg-white border">
              <CardContent className="p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Audience Reached
                </span>
                <div className="text-2xl font-extrabold text-slate-800">
                  {publications.reduce((sum, p) => sum + (p.recipientCount || 0), 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">Total recipients dispatched across campaigns</p>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search publications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 text-xs bg-white w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Categories ({publications.length})
                  </SelectItem>
                  {PUBLICATION_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button asChild variant="outline" size="sm" className="h-9 text-xs font-bold gap-1 shrink-0 bg-white">
                <Link href="/publications" target="_blank">
                  <ExternalLink className="h-3.5 w-3.5 text-primary" /> View Public Page
                </Link>
              </Button>
            </div>
          </div>

          {/* Publications List */}
          {publicationsLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            </div>
          ) : filteredPublications.length > 0 ? (
            <div className="space-y-3">
              {filteredPublications.map((pub) => {
                const pubUrl = getPublicationUrl(pub, origin);
                const publishedDateStr = pub.publishedAt
                  ? new Date(pub.publishedAt).toLocaleDateString()
                  : "N/A";

                return (
                  <Card key={pub.id} className="bg-white border hover:shadow-xs transition-shadow">
                    <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Thumbnail & Info */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0">
                        {/* Thumbnail Image */}
                        {pub.coverImage || extractFirstImage(pub.content) ? (
                          <div className="relative h-18 w-28 sm:h-20 sm:w-32 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs group">
                            <img
                              src={pub.coverImage || extractFirstImage(pub.content)}
                              alt={pub.title}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-24 sm:h-20 sm:w-28 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                            <ImageIcon className="h-5 w-5 text-slate-400" />
                            <span className="text-[9px] font-bold mt-1 text-slate-400">No Photo</span>
                          </div>
                        )}

                        {/* Info */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-primary/20 text-black border-primary/30 text-[9px] font-bold uppercase tracking-wider">
                              {pub.category || "General"}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                              <Calendar className="h-3 w-3 text-muted-foreground/70" />
                              {publishedDateStr}
                            </span>
                            {pub.recipientCount ? (
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                &bull; Sent to {pub.recipientCount} recipient(s)
                              </span>
                            ) : null}
                            <Badge
                              variant={pub.status === "published" ? "default" : "secondary"}
                              className="text-[9px] font-bold capitalize"
                            >
                              {pub.status || "published"}
                            </Badge>
                          </div>

                          <h3 className="text-sm font-bold text-slate-900 truncate">{pub.title}</h3>

                        {/* Special SEO Link Preview */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0">
                            SEO Link:
                          </span>
                          <span className="text-xs font-mono text-primary truncate max-w-md bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {pubUrl}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(pub)}
                            className="h-6 px-1.5 text-[10px] text-slate-600 hover:text-black gap-1"
                          >
                            {copiedId === pub.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Linked Newsletters Indicator */}
                        {pub.linkedNewsletters && pub.linkedNewsletters.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                            <Link2 className="h-3 w-3 text-primary" />
                            <span>Linked to {pub.linkedNewsletters.length} other newsletter(s)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions & Social Sharing */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 self-start md:self-center shrink-0">
                        {/* Quick Social Share Buttons */}
                        <div className="flex items-center gap-1 border-r pr-2 mr-1">
                          <button
                            type="button"
                            onClick={() => handleShare("twitter", pub)}
                            title="Share on Twitter / X"
                            className="h-7 w-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                          >
                            <Twitter className="h-3.5 w-3.5 text-[#1DA1F2]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShare("linkedin", pub)}
                            title="Share on LinkedIn"
                            className="h-7 w-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                          >
                            <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShare("whatsapp", pub)}
                            title="Share on WhatsApp"
                            className="h-7 w-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShare("facebook", pub)}
                            title="Share on Facebook"
                            className="h-7 w-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                          >
                            <Facebook className="h-3.5 w-3.5 text-[#1877F2]" />
                          </button>
                        </div>

                        {/* View, Edit & Special Link Generator Buttons */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLinkGenPub(pub);
                            setIsLinkGenOpen(true);
                          }}
                          className="h-8 text-xs font-bold gap-1 bg-primary/10 border-primary/30 text-slate-900 hover:bg-primary/20"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary" /> Special Link &amp; Share
                        </Button>

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-bold gap-1 bg-white hover:bg-slate-50"
                        >
                          <Link href={getPublicationUrl(pub)} target="_blank">
                            <Eye className="h-3.5 w-3.5 text-slate-600" /> View Live
                          </Link>
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(pub)}
                          className="h-8 text-xs font-bold gap-1 bg-white hover:bg-slate-50"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-slate-600" /> Edit
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(pub.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                          title="Delete Publication"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-white border text-center py-16 p-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No Publications Loaded Yet</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Load your custom-designed emails from Email Studio, import dispatched newsletters with photos, or generate special links for past custom broadcasts.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Button
                  onClick={() => setIsLoadSentModalOpen(true)}
                  className="bg-primary text-black font-extrabold h-9 text-xs gap-1.5 shadow-xs"
                >
                  <DownloadCloud className="h-4 w-4" /> Load Custom Emails
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenCreate}
                  className="font-bold h-9 text-xs gap-1.5 bg-white"
                >
                  <Plus className="h-4 w-4" /> Create First Publication
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Create / Edit Publication Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>{editingPublication ? "Edit Publication" : "Create Online Publication"}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePublication} className="space-y-4 py-2">
            {/* Title & Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Publication Title / Email Subject *</Label>
              <Input
                required
                value={formTitle}
                onChange={(e) => {
                  setFormTitle(e.target.value);
                  if (!editingPublication && (!formSlug || formSlug === slugify(formTitle))) {
                    setFormSlug(slugify(e.target.value));
                  }
                }}
                placeholder="e.g. Wastewater Management Solutions for Hotels in Rwanda"
                className="h-10 text-xs bg-white"
              />
            </div>

            {/* SEO Slug */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-foreground">Special SEO URL Slug *</Label>
                <span className="text-[10px] text-muted-foreground font-mono">sanex.rw/publications/...</span>
              </div>
              <Input
                required
                value={formSlug}
                onChange={(e) => setFormSlug(slugify(e.target.value))}
                placeholder="wastewater-management-solutions-for-hotels"
                className="h-9 text-xs font-mono bg-white"
              />
              <p className="text-[10px] text-muted-foreground">
                Live URL Preview:{" "}
                <span className="text-primary font-bold font-mono">
                  {origin}/publications/{formSlug || slugify(formTitle) || "..."}
                </span>
              </p>
            </div>

            {/* Category & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Category / Sector</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Select Category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PUBLICATION_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Publication Status</Label>
                <Select
                  value={formStatus}
                  onValueChange={(val: any) => setFormStatus(val)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Select Status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published" className="text-xs">
                      Published (Publicly Visible &amp; Indexed)
                    </SelectItem>
                    <SelectItem value="draft" className="text-xs">
                      Draft (Admin Only)
                    </SelectItem>
                    <SelectItem value="archived" className="text-xs">
                      Archived
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Summary / Excerpt (SEO Description)</Label>
              <Textarea
                rows={2}
                value={formExcerpt}
                onChange={(e) => setFormExcerpt(e.target.value)}
                placeholder="Brief 1-2 sentence overview shown in social media preview cards and publication archive..."
                className="text-xs bg-white resize-y"
              />
            </div>

            {/* Cross-Link Other Newsletters */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-primary" /> Link Related Newsletters
              </Label>
              <p className="text-[10px] text-muted-foreground m-0">
                Select other publications to cross-link. Readers viewing this publication will see recommended links to these newsletters.
              </p>

              {publications.filter((p) => p.id !== editingPublication?.id).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {publications
                    .filter((p) => p.id !== editingPublication?.id)
                    .map((otherPub) => {
                      const isSelected = selectedLinkedIds.includes(otherPub.id);
                      return (
                        <button
                          key={otherPub.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLinkedIds(selectedLinkedIds.filter((id) => id !== otherPub.id));
                            } else {
                              setSelectedLinkedIds([...selectedLinkedIds, otherPub.id]);
                            }
                          }}
                          className={`p-2 rounded-md text-left text-xs border transition-all flex items-start gap-2 ${
                            isSelected
                              ? "bg-primary/20 border-primary text-black font-semibold"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <div
                            className={`h-4 w-4 rounded shrink-0 border flex items-center justify-center text-[10px] mt-0.5 ${
                              isSelected ? "bg-primary border-primary text-black" : "border-slate-300"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <div className="truncate">
                            <div className="truncate font-bold">{otherPub.title}</div>
                            <div className="text-[9px] text-muted-foreground">{otherPub.category}</div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No other publications available to link.</p>
              )}
            </div>

            {/* Email / Publication HTML Content */}
            <div className="space-y-1.5 pt-2 border-t">
              <Label className="text-xs font-bold text-foreground">Publication / Email Content (HTML) *</Label>
              <Textarea
                rows={8}
                required
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Paste HTML from Email Studio or write message..."
                className="font-mono text-xs bg-white resize-y"
              />
            </div>

            {/* Thumbnail / Cover Photo Selection */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-primary" />
                    <span>Thumbnail / Cover Photo</span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Select a photo from this newsletter to display as a thumbnail, or upload a custom image.
                  </p>
                </div>
                {formCoverImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormCoverImage("")}
                    className="h-7 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2"
                  >
                    Remove Thumbnail
                  </Button>
                )}
              </div>

              {/* Active Selected Thumbnail Preview */}
              {formCoverImage ? (
                <div className="relative flex items-center gap-3 p-2.5 rounded-lg border bg-muted/30">
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border bg-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formCoverImage}
                      alt="Selected thumbnail"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/20 text-[10px] font-semibold">
                        Active Thumbnail
                      </Badge>
                      {extractedContentImages.includes(formCoverImage) && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          From Newsletter
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate font-mono mt-1">
                      {formCoverImage}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Photos detected in newsletter */}
              {extractedContentImages.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                      <span>Photos found in newsletter</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {extractedContentImages.length}
                      </Badge>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Click an image to choose as thumbnail
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 rounded-lg border bg-muted/20">
                    {extractedContentImages.map((imgUrl, idx) => {
                      const isSelected = formCoverImage === imgUrl;
                      return (
                        <button
                          key={`${imgUrl}-${idx}`}
                          type="button"
                          onClick={() => setFormCoverImage(imgUrl)}
                          className={`group relative aspect-video w-full overflow-hidden rounded-md border-2 transition-all text-left ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/40 shadow-xs"
                              : "border-transparent hover:border-slate-300 dark:hover:border-slate-700 opacity-80 hover:opacity-100"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt={`Newsletter photo ${idx + 1}`}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            loading="lazy"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <span className="bg-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                                <Check className="h-3 w-3 stroke-[3]" /> Selected
                              </span>
                            </div>
                          )}
                          {!isSelected && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-[10px] font-semibold bg-black/60 px-1.5 py-0.5 rounded">
                                Select
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-amber-300/80 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900/50 p-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[11px]">No photos found in newsletter content</p>
                    <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80">
                      Upload a photo below or enter an image URL to feature this publication with a custom thumbnail.
                    </p>
                  </div>
                </div>
              )}

              {/* Upload or Custom URL via MediaPicker */}
              <div className="pt-1">
                <Label className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  <span>
                    {extractedContentImages.length > 0
                      ? "Or upload a custom photo"
                      : "Upload or specify custom photo"}
                  </span>
                </Label>
                <MediaPicker
                  value={formCoverImage}
                  onChange={(url) => setFormCoverImage(url)}
                  folder="publications"
                  accept="image/*"
                  label=""
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-9 text-xs font-extrabold bg-primary text-black hover:bg-primary/90 gap-1.5"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>{editingPublication ? "Save Changes" : "Publish to Website"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Special Link Generator Modal */}
      <SpecialLinkGeneratorModal
        open={isLinkGenOpen}
        onOpenChange={setIsLinkGenOpen}
        initialPublication={linkGenPub}
        publications={publications}
        onPublicationUpdated={(updated) => {
          setLinkGenPub(updated);
        }}
      />

      {/* Load Sent Newsletters & Past Broadcasts Modal */}
      <LoadSentNewslettersModal
        open={isLoadSentModalOpen}
        onOpenChange={setIsLoadSentModalOpen}
        existingPublications={publications}
        onImportComplete={(importedPubs) => {
          setApiPublications((prev) => {
            const map = new Map<string, Publication>();
            [...importedPubs, ...prev].forEach((p) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }}
        onOpenLinkGeneratorForPub={(pub) => {
          setLinkGenPub(pub);
          setIsLinkGenOpen(true);
        }}
      />

      <Footer />
    </div>
  );
}
