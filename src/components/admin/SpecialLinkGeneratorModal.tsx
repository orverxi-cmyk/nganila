"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  Check,
  ExternalLink,
  Link2,
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  MessageCircle,
  Mail,
  Code,
  Sparkles,
  Save,
  CheckCircle2,
  Calendar,
  Layers,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { slugify } from "@/lib/slug";
import {
  Publication,
  getPublicationSlug,
  getPublicationUrl,
  getSocialShareLinks,
} from "@/lib/publications";

interface SpecialLinkGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPublication?: Publication | null;
  publications?: Publication[];
  onPublicationUpdated?: (updated: Publication) => void;
}

export function SpecialLinkGeneratorModal({
  open,
  onOpenChange,
  initialPublication,
  publications = [],
  onPublicationUpdated,
}: SpecialLinkGeneratorModalProps) {
  const db = useFirestore();
  const { toast } = useToast();

  // Active selected publication
  const [selectedId, setSelectedId] = useState<string>("");
  const [customSlugInput, setCustomSlugInput] = useState<string>("");
  const [isUpdatingSlug, setIsUpdatingSlug] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Cross-link selection state
  const [linkedPubIds, setLinkedPubIds] = useState<string[]>([]);
  const [isUpdatingLinks, setIsUpdatingLinks] = useState(false);

  // Sync with initial publication when modal opens or initial changes
  useEffect(() => {
    if (initialPublication?.id) {
      setSelectedId(initialPublication.id);
    } else if (publications.length > 0 && !selectedId) {
      setSelectedId(publications[0].id);
    }
  }, [initialPublication, publications, selectedId, open]);

  // Current active publication
  const activePublication = useMemo<Publication | null>(() => {
    if (!selectedId) return initialPublication || null;
    return publications.find((p) => p.id === selectedId) || initialPublication || null;
  }, [selectedId, publications, initialPublication]);

  // Sync custom slug input when active publication changes
  useEffect(() => {
    if (activePublication) {
      const currentSlug = getPublicationSlug(activePublication);
      setCustomSlugInput(currentSlug);
      setLinkedPubIds((activePublication.linkedNewsletters || []).map((l) => l.id));
    }
  }, [activePublication]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://sanex.rw";
  const currentSlug = activePublication ? getPublicationSlug(activePublication) : "";
  const canonicalUrl = activePublication ? getPublicationUrl(activePublication, origin) : "";
  const relativeUrl = activePublication ? getPublicationUrl(activePublication) : "";

  // Social share links
  const socialLinks = useMemo(() => {
    if (!activePublication) return null;
    return getSocialShareLinks(activePublication.title, canonicalUrl, activePublication.excerpt);
  }, [activePublication, canonicalUrl]);

  // Copy helper
  const handleCopy = (text: string, key: string, label: string = "Copied to clipboard") => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
      toast({
        title: label,
        description: text.length > 60 ? `${text.slice(0, 60)}...` : text,
      });
    }
  };

  // Open social share window
  const handleShare = (platform: "twitter" | "linkedin" | "facebook" | "whatsapp" | "email") => {
    if (!socialLinks) return;
    const targetUrl = socialLinks[platform];
    if (targetUrl) {
      if (platform === "email") {
        window.location.href = targetUrl;
      } else {
        window.open(targetUrl, "_blank", "width=600,height=520,scrollbars=yes");
      }
    }
  };

  // Update slug in Firestore
  const handleSaveCustomSlug = async () => {
    if (!activePublication || !db) return;
    const clean = slugify(customSlugInput);
    if (!clean) {
      toast({ variant: "destructive", title: "Invalid Slug", description: "Slug cannot be empty." });
      return;
    }

    setIsUpdatingSlug(true);
    try {
      await updateDoc(doc(db, "publications", activePublication.id), {
        slug: clean,
        updatedAt: Date.now(),
      });

      const updated = { ...activePublication, slug: clean, updatedAt: Date.now() };
      if (onPublicationUpdated) {
        onPublicationUpdated(updated);
      }

      toast({
        title: "Special Link Updated",
        description: `New URL: ${origin}/publications/${clean}`,
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setIsUpdatingSlug(false);
    }
  };

  // Save cross-links in Firestore
  const handleSaveCrossLinks = async () => {
    if (!activePublication || !db) return;

    setIsUpdatingLinks(true);
    try {
      const resolvedLinked = linkedPubIds
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

      await updateDoc(doc(db, "publications", activePublication.id), {
        linkedNewsletters: resolvedLinked,
        updatedAt: Date.now(),
      });

      const updated = {
        ...activePublication,
        linkedNewsletters: resolvedLinked as any,
        updatedAt: Date.now(),
      };
      if (onPublicationUpdated) {
        onPublicationUpdated(updated);
      }

      toast({
        title: "Linked Newsletters Saved",
        description: `Connected to ${resolvedLinked.length} other publication(s).`,
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    } finally {
      setIsUpdatingLinks(false);
    }
  };

  // Ready-to-use HTML Embed Snippets
  const buttonEmbedHtml = `<table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;"><tr><td align="center" style="border-radius:8px;background-color:#8DB833;"><a href="${canonicalUrl}" target="_blank" rel="noopener noreferrer" style="font-size:13px;font-weight:800;color:#000000;text-decoration:none;padding:12px 24px;display:inline-block;border-radius:8px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Read Full Newsletter Online &rarr;</a></td></tr></table>`;

  const webVersionHeaderHtml = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border-bottom:1px solid #e2e8f0;padding:8px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;"><tr><td align="left" style="color:#64748b;">Having trouble viewing this email?</td><td align="right"><a href="${canonicalUrl}" target="_blank" rel="noopener noreferrer" style="color:#8DB833;font-weight:700;text-decoration:none;">View in browser &rarr;</a></td></tr></table>`;

  const markdownSnippet = `[${activePublication?.title || "Read Online"}](${canonicalUrl})`;

  const socialPostSnippet = activePublication
    ? `📢 Official SANEX Publication:\n"${activePublication.title}"\n\n${activePublication.excerpt || ""}\n\nRead the full article and insights online:\n${canonicalUrl}\n\n#SanexRwanda #WaterSanitation #CleanRwanda`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <DialogTitle className="text-lg font-bold text-slate-900">
              Special Publication Link &amp; Sharing Hub
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Generate and copy canonical SEO links, configure custom URL slugs, share directly to social
            channels, or copy email embed codes.
          </DialogDescription>
        </DialogHeader>

        {/* Publication Selector Dropdown */}
        {publications.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Select Publication / Newsletter:</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                {publications.length} publication(s) available
              </span>
            </Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="h-10 text-xs bg-white font-medium">
                <SelectValue placeholder="Choose publication to generate link for..." />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {publications.map((pub) => (
                  <SelectItem key={pub.id} value={pub.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                        {pub.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({pub.category || "General"})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {activePublication ? (
          <div className="space-y-5 pt-1">
            {/* Active Publication Hero Summary Card */}
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 shadow-sm border border-slate-800">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-white font-extrabold text-[10px] uppercase tracking-wider">
                    {activePublication.category || "Publication"}
                  </Badge>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {activePublication.publishedAt
                      ? new Date(activePublication.publishedAt).toLocaleDateString()
                      : "Recently Published"}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold border-slate-700 text-slate-300 capitalize"
                >
                  Status: {activePublication.status || "published"}
                </Badge>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-white leading-snug">
                  {activePublication.title}
                </h3>
                {activePublication.excerpt && (
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {activePublication.excerpt}
                  </p>
                )}
              </div>

              {/* Main Canonical Live Link Box */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary flex items-center gap-1">
                    <Link2 className="h-3 w-3" /> Special Canonical URL
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">SEO Optimized</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 bg-black/60 px-3 py-2 rounded font-mono text-xs text-primary truncate border border-slate-800 select-all">
                    {canonicalUrl}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleCopy(canonicalUrl, "main-url", "Special Link Copied!")}
                      className="h-9 px-3 text-xs font-bold bg-primary text-white hover:bg-primary/90 gap-1.5 shadow-xs"
                    >
                      {copiedKey === "main-url" ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-xs font-bold border-slate-700 text-slate-200 hover:bg-slate-800 gap-1"
                    >
                      <a href={canonicalUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 text-primary" />
                        <span>Test Link</span>
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs for Actions */}
            <Tabs defaultValue="share" className="w-full">
              <TabsList className="grid grid-cols-3 w-full h-10 bg-slate-100 p-1">
                <TabsTrigger value="share" className="text-xs font-bold gap-1.5">
                  <Share2 className="h-3.5 w-3.5 text-primary" />
                  <span>1-Click Social Sharing</span>
                </TabsTrigger>
                <TabsTrigger value="embed" className="text-xs font-bold gap-1.5">
                  <Code className="h-3.5 w-3.5 text-primary" />
                  <span>Email Embed Snippets</span>
                </TabsTrigger>
                <TabsTrigger value="slug" className="text-xs font-bold gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Slug &amp; Cross-Links</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: 1-Click Social Sharing */}
              <TabsContent value="share" className="space-y-4 pt-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Direct Social Media Broadcast
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Distribute this publication link with pre-filled headlines and hashtags across your
                    communication channels.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleShare("whatsapp")}
                    className="p-3 rounded-lg border bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900 flex flex-col items-center justify-center gap-1.5 transition-all text-center group"
                  >
                    <MessageCircle className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">WhatsApp</span>
                    <span className="text-[10px] text-emerald-700">Chat &amp; Status</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare("linkedin")}
                    className="p-3 rounded-lg border bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900 flex flex-col items-center justify-center gap-1.5 transition-all text-center group"
                  >
                    <Linkedin className="h-5 w-5 text-[#0A66C2] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">LinkedIn</span>
                    <span className="text-[10px] text-blue-700">Company Post</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare("twitter")}
                    className="p-3 rounded-lg border bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900 flex flex-col items-center justify-center gap-1.5 transition-all text-center group"
                  >
                    <Twitter className="h-5 w-5 text-[#1DA1F2] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Twitter / X</span>
                    <span className="text-[10px] text-slate-600">Tweet Post</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare("facebook")}
                    className="p-3 rounded-lg border bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900 flex flex-col items-center justify-center gap-1.5 transition-all text-center group"
                  >
                    <Facebook className="h-5 w-5 text-[#1877F2] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Facebook</span>
                    <span className="text-[10px] text-indigo-700">Feed Share</span>
                  </button>
                </div>

                {/* Copy Social Post Text */}
                <div className="bg-slate-50 border p-3.5 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800">
                      Formatted Post Snippet (WhatsApp / LinkedIn / Instagram):
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(socialPostSnippet, "post-text", "Post Text Copied!")}
                      className="h-7 text-xs font-bold text-primary gap-1"
                    >
                      {copiedKey === "post-text" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>Copy Text</span>
                    </Button>
                  </div>
                  <div className="bg-white p-2.5 rounded border text-xs font-mono text-slate-700 whitespace-pre-wrap max-h-28 overflow-y-auto">
                    {socialPostSnippet}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Email Embed Snippets */}
              <TabsContent value="embed" className="space-y-4 pt-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Copy HTML Embeds for Future Emails &amp; Newsletters
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Insert these pre-styled elements into your Zoho/Gmail emails or website templates.
                  </p>
                </div>

                {/* Email Button */}
                <div className="bg-white border p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Option A: Branded "Read Online" CTA Button
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Responsive HTML button with SANEX green accent
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleCopy(buttonEmbedHtml, "btn-embed", "Button HTML Copied!")}
                      className="h-8 text-xs font-bold bg-primary text-white hover:bg-primary/90 gap-1"
                    >
                      {copiedKey === "btn-embed" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>Copy HTML</span>
                    </Button>
                  </div>
                  <div className="bg-slate-50 p-2 rounded text-[11px] font-mono text-slate-700 truncate border">
                    {buttonEmbedHtml}
                  </div>
                </div>

                {/* Email Header Bar */}
                <div className="bg-white border p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Option B: "View in Browser" Header Bar
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Placed at the top of emails for clients who cannot render HTML
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopy(webVersionHeaderHtml, "hdr-embed", "Header Bar HTML Copied!")
                      }
                      className="h-8 text-xs font-bold gap-1"
                    >
                      {copiedKey === "hdr-embed" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>Copy HTML</span>
                    </Button>
                  </div>
                  <div className="bg-slate-50 p-2 rounded text-[11px] font-mono text-slate-700 truncate border">
                    {webVersionHeaderHtml}
                  </div>
                </div>

                {/* Markdown Link */}
                <div className="bg-white border p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Option C: Markdown Link
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        For documentation, articles, and markdown-friendly editors
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(markdownSnippet, "md-embed", "Markdown Copied!")}
                      className="h-8 text-xs font-bold text-primary gap-1"
                    >
                      {copiedKey === "md-embed" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>Copy Markdown</span>
                    </Button>
                  </div>
                  <div className="bg-slate-50 p-2 rounded text-[11px] font-mono text-slate-700 truncate border">
                    {markdownSnippet}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Slug & Cross-Links */}
              <TabsContent value="slug" className="space-y-4 pt-3">
                {/* Custom Slug Editor */}
                <div className="bg-white border p-4 rounded-lg space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-900">
                      Customize SEO URL Slug:
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Change the permalink keyword used in the web address (e.g.{" "}
                      <code className="text-primary font-bold">/publications/my-custom-slug</code>).
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Input
                      value={customSlugInput}
                      onChange={(e) => setCustomSlugInput(slugify(e.target.value))}
                      placeholder="custom-seo-slug"
                      className="font-mono text-xs bg-slate-50"
                    />
                    <Button
                      type="button"
                      disabled={isUpdatingSlug || !customSlugInput || customSlugInput === currentSlug}
                      onClick={handleSaveCustomSlug}
                      className="h-9 px-4 text-xs font-bold bg-primary text-white hover:bg-primary/90 gap-1.5 shrink-0"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{isUpdatingSlug ? "Saving..." : "Update Slug"}</span>
                    </Button>
                  </div>
                </div>

                {/* Cross-Link Other Newsletters */}
                <div className="bg-white border p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5 text-primary" />
                        <span>Link Related Newsletters</span>
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Readers browsing this newsletter will see direct recommendation cards to these
                        issues.
                      </p>
                    </div>
                    <Button
                      type="button"
                      disabled={isUpdatingLinks}
                      onClick={handleSaveCrossLinks}
                      size="sm"
                      className="h-8 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 gap-1 shrink-0"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      <span>{isUpdatingLinks ? "Saving..." : "Save Connections"}</span>
                    </Button>
                  </div>

                  {publications.filter((p) => p.id !== activePublication.id).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                      {publications
                        .filter((p) => p.id !== activePublication.id)
                        .map((other) => {
                          const isSelected = linkedPubIds.includes(other.id);
                          return (
                            <button
                              key={other.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setLinkedPubIds(linkedPubIds.filter((id) => id !== other.id));
                                } else {
                                  setLinkedPubIds([...linkedPubIds, other.id]);
                                }
                              }}
                              className={`p-2 rounded text-left text-xs border transition-all flex items-start gap-2 ${
                                isSelected
                                  ? "bg-primary/20 border-primary text-black font-semibold"
                                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              <div
                                className={`h-4 w-4 rounded shrink-0 border flex items-center justify-center text-[10px] mt-0.5 ${
                                  isSelected ? "bg-primary border-primary text-white" : "border-slate-300"
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <div className="truncate">
                                <div className="truncate font-bold">{other.title}</div>
                                <div className="text-[9px] text-muted-foreground">{other.category}</div>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No other publications available yet. Load more sent newsletters to connect them.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground text-xs">
            No publication selected. Please select or create one first.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
