"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DownloadCloud,
  CheckCircle2,
  FileText,
  Sparkles,
  Loader2,
  Send,
  Trash2,
  Image as ImageIcon,
  Upload,
  Check,
  Mail,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { slugify } from "@/lib/slug";
import {
  Publication,
  PUBLICATION_CATEGORIES,
  extractExcerptFromHtml,
  extractAllImagesFromHtml,
  extractFirstImage,
  SEED_CAMPAIGN_IDS,
  isGenericSectorCampaign,
  getPublicationSlug,
} from "@/lib/publications";
import { useEmailTemplates, CloudEmailTemplate, SavedTemplateItem } from "@/hooks/use-email-templates";
import { compileBlocksToHtml } from "@/components/admin/EmailStudioBuilder";
import { MediaPicker } from "@/components/MediaPicker";

interface LoadSentNewslettersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingPublications?: Publication[];
  onImportComplete?: (importedPubs: Publication[]) => void;
  onOpenLinkGeneratorForPub?: (pub: Publication) => void;
}

export function LoadSentNewslettersModal({
  open,
  onOpenChange,
  existingPublications = [],
  onImportComplete,
  onOpenLinkGeneratorForPub,
}: LoadSentNewslettersModalProps) {
  const db = useFirestore();
  const { toast } = useToast();

  // Email templates hook (Cloud draft, saved templates, and local storage draft)
  const { cloudTemplate, savedTemplates, getLocalDraft } = useEmailTemplates();
  const [localDraft, setLocalDraft] = useState<CloudEmailTemplate | null>(null);

  useEffect(() => {
    if (open) {
      setLocalDraft(getLocalDraft());
    }
  }, [open, getLocalDraft]);

  // Detected seed newsletters in database that can be wiped
  const detectedSeedNewsletters = useMemo(() => {
    return existingPublications.filter((p) => isGenericSectorCampaign(p));
  }, [existingPublications]);

  const [isPurgingSeeds, setIsPurgingSeeds] = useState(false);
  const handlePurgeSeedNewsletters = async () => {
    if (!db) return;
    setIsPurgingSeeds(true);
    try {
      for (const id of SEED_CAMPAIGN_IDS) {
        try {
          await deleteDoc(doc(db, "publications", id));
        } catch {
          // ignore
        }
      }
      toast({
        title: "Seed Newsletters Purged",
        description: "All generic seed campaigns have been permanently deleted from the database.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Purge Error",
        description: err.message,
      });
    } finally {
      setIsPurgingSeeds(false);
    }
  };

  // State for thumbnail selection per template item
  const [selectedThumbnails, setSelectedThumbnails] = useState<Record<string, string>>({});
  const [mediaPickerOpenFor, setMediaPickerOpenFor] = useState<string | null>(null);
  const [importingKey, setImportingKey] = useState<string | null>(null);

  // Manual Paste Form State
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteCategory, setPasteCategory] = useState<string>("Company Announcements");
  const [pasteContent, setPasteContent] = useState("");
  const [pasteRecipientCount, setPasteRecipientCount] = useState<number>(0);
  const [pasteThumbnail, setPasteThumbnail] = useState<string>("");
  const [isMediaPickerOpenPaste, setIsMediaPickerOpenPaste] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Images detected from pasted content
  const detectedPasteImages = useMemo(() => {
    return extractAllImagesFromHtml(pasteContent);
  }, [pasteContent]);

  // Set default paste thumbnail when images are detected in pasteContent
  useEffect(() => {
    if (detectedPasteImages.length > 0 && !pasteThumbnail) {
      setPasteThumbnail(detectedPasteImages[0]);
    }
  }, [detectedPasteImages, pasteThumbnail]);

  /**
   * Helper to compile HTML for any template item (cloud draft, local draft, saved template)
   */
  const getCompiledHtml = (tpl: CloudEmailTemplate | SavedTemplateItem): string => {
    if (tpl.blocks && tpl.blocks.length > 0) {
      return compileBlocksToHtml(tpl.blocks);
    }
    return tpl.message || "<p>Official SANEX Custom Email Broadcast</p>";
  };

  /**
   * Import a custom designed email template into Firestore as a publication
   */
  const handleImportCustomTemplate = async (
    key: string,
    templateName: string,
    htmlContent: string,
    chosenCoverImage?: string
  ) => {
    if (!db) return;
    setImportingKey(key);

    try {
      const pubId = `pub_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const title = templateName?.trim() || "SANEX Official Custom Newsletter";
      const cleanSlug = slugify(title);
      const excerpt = extractExcerptFromHtml(htmlContent);
      const detectedCover = chosenCoverImage || extractFirstImage(htmlContent);

      const newPub: Publication = {
        id: pubId,
        title,
        subject: title,
        slug: cleanSlug,
        category: "Company Announcements",
        excerpt: excerpt || "Official custom-designed SANEX email newsletter.",
        content: htmlContent,
        author: "SANEX Communications",
        status: "published",
        isCustom: true,
        coverImage: detectedCover,
        thumbnailImg: detectedCover,
        publishedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        recipientCount: 0,
        linkedNewsletters: [],
        viewsCount: 0,
      };

      try {
        await setDoc(doc(db, "publications", pubId), newPub, { merge: true });
      } catch (writeErr: any) {
        console.warn("Firestore write error (serving locally):", writeErr?.message);
      }

      toast({
        title: "Custom Email Loaded to Website!",
        description: `Published online at /publications/${cleanSlug}`,
      });

      if (onImportComplete) {
        onImportComplete([newPub]);
      }

      if (onOpenLinkGeneratorForPub) {
        onOpenLinkGeneratorForPub(newPub);
      }

      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: err.message,
      });
    } finally {
      setImportingKey(null);
    }
  };

  /**
   * Import pasted sent email
   */
  const handleImportManualEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteTitle.trim()) {
      toast({ variant: "destructive", title: "Subject / Title Required" });
      return;
    }
    if (!pasteContent.trim()) {
      toast({ variant: "destructive", title: "Email Content Required" });
      return;
    }

    if (!db) return;
    setIsSubmittingManual(true);

    try {
      const pubId = `pub_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const cleanSlug = slugify(pasteTitle);
      const excerpt = extractExcerptFromHtml(pasteContent);
      const finalCover = pasteThumbnail || extractFirstImage(pasteContent);

      const newPub: Publication = {
        id: pubId,
        title: pasteTitle.trim(),
        subject: pasteTitle.trim(),
        slug: cleanSlug,
        category: pasteCategory,
        excerpt: excerpt || pasteTitle.trim(),
        content: pasteContent.trim(),
        author: "SANEX Communications",
        status: "published",
        isCustom: true,
        coverImage: finalCover,
        thumbnailImg: finalCover,
        publishedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        recipientCount: pasteRecipientCount || 0,
        linkedNewsletters: [],
        viewsCount: 0,
      };

      try {
        await setDoc(doc(db, "publications", pubId), newPub, { merge: true });
      } catch (writeErr: any) {
        console.warn("Manual email write error (serving locally):", writeErr?.message);
      }

      toast({
        title: "Custom Email Loaded as Web Publication!",
        description: `Generated special link: /publications/${cleanSlug}`,
      });

      if (onImportComplete) {
        onImportComplete([newPub]);
      }

      if (onOpenLinkGeneratorForPub) {
        onOpenLinkGeneratorForPub(newPub);
      }

      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Import Failed", description: err.message });
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Mail className="h-5 w-5" />
            <DialogTitle className="text-lg font-bold text-slate-900">
              Load Custom Designed Emails &amp; Generate Special Links
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Load exclusively real custom emails and newsletters designed in Email Studio or dispatched via Zoho. Each publication gets an SEO link, cover photo thumbnail, and social sharing links.
          </DialogDescription>
        </DialogHeader>

        {/* Optional Database Clean Up Banner if any Seed Newsletters exist */}
        {detectedSeedNewsletters.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-900">
                  {detectedSeedNewsletters.length} Legacy Seed Newsletter(s) Detected in Database
                </p>
                <p className="text-[11px] text-amber-700">
                  Remove pre-generated seed templates so your publication list strictly contains only your real custom designs.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPurgingSeeds}
              onClick={handlePurgeSeedNewsletters}
              className="h-8 text-xs font-bold shrink-0 gap-1"
            >
              {isPurgingSeeds ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              <span>Purge Seed Newsletters</span>
            </Button>
          </div>
        )}

        <Tabs defaultValue="designed" className="w-full pt-2">
          <TabsList className="grid grid-cols-2 w-full h-10 bg-slate-100 p-1">
            <TabsTrigger value="designed" className="text-xs font-bold gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Custom Designed Emails ({1 + (savedTemplates?.length || 0)})</span>
            </TabsTrigger>
            <TabsTrigger value="paste" className="text-xs font-bold gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Paste Sent Email HTML</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Custom Designed Emails from Email Studio / Cloud / Local */}
          <TabsContent value="designed" className="space-y-4 pt-3">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Real Custom Newsletters &amp; Email Studio Designs
              </h4>
              <p className="text-xs text-muted-foreground">
                Select a thumbnail photo extracted from your newsletter or upload a custom cover photo before publishing.
              </p>
            </div>

            {/* Item 1: Active Cloud Template from Email Studio */}
            {cloudTemplate?.name || cloudTemplate?.message || (cloudTemplate?.blocks && cloudTemplate.blocks.length > 0) ? (
              (() => {
                const compiled = getCompiledHtml(cloudTemplate);
                const detectedImages = extractAllImagesFromHtml(compiled);
                const currentThumb = selectedThumbnails["cloud"] || extractFirstImage(compiled) || "";

                return (
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/20 text-black border-primary/30 text-[10px] font-bold">
                            Active Email Studio Design
                          </Badge>
                          {cloudTemplate.updatedAt && (
                            <span className="text-[10px] text-muted-foreground">
                              Saved {new Date(cloudTemplate.updatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {cloudTemplate.name || "Custom Branded Email Template"}
                        </h4>
                      </div>

                      <Button
                        type="button"
                        disabled={importingKey === "cloud"}
                        onClick={() =>
                          handleImportCustomTemplate(
                            "cloud",
                            cloudTemplate.name || "SANEX Official Email Broadcast",
                            compiled,
                            currentThumb
                          )
                        }
                        className="h-8 text-xs font-extrabold bg-primary text-white hover:bg-primary/90 gap-1.5 shrink-0"
                      >
                        {importingKey === "cloud" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <DownloadCloud className="h-3.5 w-3.5" />
                        )}
                        <span>Load Into Website &amp; Generate Link</span>
                      </Button>
                    </div>

                    {/* Excerpt preview */}
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {extractExcerptFromHtml(compiled) || "Custom formatted newsletter design."}
                    </p>

                    {/* Photo selection for thumbnail */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5 text-primary" />
                          <span>Select Thumbnail Photo from Newsletter:</span>
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setMediaPickerOpenFor("cloud")}
                          className="h-6 text-[10px] font-bold text-primary hover:text-primary/90 gap-1 p-1"
                        >
                          <Upload className="h-3 w-3" />
                          <span>Upload / Pick Custom Photo</span>
                        </Button>
                      </div>

                      {detectedImages.length > 0 ? (
                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                          {detectedImages.map((imgUrl, idx) => {
                            const isSelected = currentThumb === imgUrl;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() =>
                                  setSelectedThumbnails((prev) => ({ ...prev, cloud: imgUrl }))
                                }
                                className={`relative h-14 w-20 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                                  isSelected
                                    ? "border-primary ring-2 ring-primary/30"
                                    : "border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100"
                                }`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imgUrl}
                                  alt={`Email photo ${idx + 1}`}
                                  className="h-full w-full object-cover"
                                />
                                {isSelected && (
                                  <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5 shadow-xs">
                                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-md bg-slate-50 border border-dashed border-slate-200 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>No photos found inside this email. You can upload a cover photo.</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setMediaPickerOpenFor("cloud")}
                            className="h-6 text-[10px] font-bold gap-1"
                          >
                            <Upload className="h-3 w-3" /> Pick Photo
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : null}

            {/* Item 2: Saved Templates */}
            {savedTemplates && savedTemplates.length > 0 ? (
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Saved Custom Templates ({savedTemplates.length})
                </Label>
                {savedTemplates.map((tpl) => {
                  const compiled = getCompiledHtml(tpl);
                  const detectedImages = extractAllImagesFromHtml(compiled);
                  const currentThumb = selectedThumbnails[tpl.id] || extractFirstImage(compiled) || "";

                  return (
                    <div
                      key={tpl.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-slate-900">{tpl.name}</h4>
                          <span className="text-[10px] text-muted-foreground block">
                            Last edited {new Date(tpl.updatedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <Button
                          type="button"
                          disabled={importingKey === tpl.id}
                          onClick={() =>
                            handleImportCustomTemplate(tpl.id, tpl.name, compiled, currentThumb)
                          }
                          className="h-8 text-xs font-extrabold bg-primary text-white hover:bg-primary/90 gap-1.5 shrink-0"
                        >
                          {importingKey === tpl.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <DownloadCloud className="h-3.5 w-3.5" />
                          )}
                          <span>Load Into Website &amp; Generate Link</span>
                        </Button>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {extractExcerptFromHtml(compiled) || "Custom formatted template."}
                      </p>

                      {/* Photo selection */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5 text-primary" />
                            <span>Select Thumbnail Photo:</span>
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setMediaPickerOpenFor(tpl.id)}
                            className="h-6 text-[10px] font-bold text-primary hover:text-primary/90 gap-1 p-1"
                          >
                            <Upload className="h-3 w-3" />
                            <span>Pick Custom Photo</span>
                          </Button>
                        </div>

                        {detectedImages.length > 0 ? (
                          <div className="flex items-center gap-2 overflow-x-auto py-1">
                            {detectedImages.map((imgUrl, idx) => {
                              const isSelected = currentThumb === imgUrl;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() =>
                                    setSelectedThumbnails((prev) => ({
                                      ...prev,
                                      [tpl.id]: imgUrl,
                                    }))
                                  }
                                  className={`relative h-14 w-20 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                                    isSelected
                                      ? "border-primary ring-2 ring-primary/30"
                                      : "border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100"
                                  }`}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={imgUrl}
                                    alt={`Template photo ${idx + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                  {isSelected && (
                                    <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5 shadow-xs">
                                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-2 rounded-md bg-slate-50 border border-dashed border-slate-200 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>No photos found inside. Select a cover photo to showcase this newsletter.</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setMediaPickerOpenFor(tpl.id)}
                              className="h-6 text-[10px] font-bold gap-1"
                            >
                              <Upload className="h-3 w-3" /> Pick Photo
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Empty state if neither cloud draft nor saved templates found */}
            {!cloudTemplate?.message && (!savedTemplates || savedTemplates.length === 0) && (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center space-y-2 bg-slate-50">
                <Mail className="h-8 w-8 mx-auto text-muted-foreground/60" />
                <h5 className="text-xs font-bold text-slate-800">No Email Studio Drafts Saved Yet</h5>
                <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                  You can design custom emails in Email Studio, or use the &quot;Paste Sent Email HTML&quot; tab to import an email you sent today.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Paste Sent Email HTML */}
          <TabsContent value="paste" className="space-y-4 pt-3">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Import Any Custom Email Dispatched Today
              </h4>
              <p className="text-xs text-muted-foreground">
                Paste the subject and HTML of the custom email you sent. Photos are automatically detected for your thumbnail.
              </p>
            </div>

            <form onSubmit={handleImportManualEmail} className="space-y-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-800">Email Subject / Title *</Label>
                <Input
                  required
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  placeholder="e.g. Modern Liquid Waste & Wastewater Solutions in Rwanda"
                  className="h-9 text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-800">Sector / Category</Label>
                  <Select value={pasteCategory} onValueChange={setPasteCategory}>
                    <SelectTrigger className="h-9 text-xs bg-white">
                      <SelectValue placeholder="Category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PUBLICATION_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-800">Sent Recipient Count</Label>
                  <Input
                    type="number"
                    min="0"
                    value={pasteRecipientCount || ""}
                    onChange={(e) => setPasteRecipientCount(parseInt(e.target.value, 10) || 0)}
                    placeholder="e.g. 85"
                    className="h-9 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-800">
                  Email Content (HTML or Rich Text) *
                </Label>
                <Textarea
                  required
                  rows={6}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="Paste the sent custom email HTML here..."
                  className="font-mono text-xs bg-white resize-y"
                />
              </div>

              {/* Photo Thumbnail Selection for Pasted Email */}
              <div className="space-y-2 pt-1 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-primary" />
                    <span>Thumbnail Cover Photo:</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMediaPickerOpenPaste(true)}
                    className="h-7 text-xs font-bold gap-1"
                  >
                    <Upload className="h-3 w-3" />
                    <span>Upload / Pick Photo</span>
                  </Button>
                </div>

                {detectedPasteImages.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground">
                      Detected {detectedPasteImages.length} photo(s) in your email. Click to select thumbnail:
                    </p>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {detectedPasteImages.map((imgUrl, idx) => {
                        const isSelected = pasteThumbnail === imgUrl;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPasteThumbnail(imgUrl)}
                            className={`relative h-14 w-20 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                              isSelected
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgUrl}
                              alt={`Detected photo ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5 shadow-xs">
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {pasteThumbnail
                        ? "Custom photo selected for thumbnail."
                        : "No images detected in HTML. You can upload a photo."}
                    </span>
                    {pasteThumbnail && (
                      <div className="h-10 w-16 rounded overflow-hidden border border-slate-300">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={pasteThumbnail}
                          alt="Cover thumbnail"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="h-9 text-xs font-extrabold bg-primary text-white hover:bg-primary/90 gap-1.5"
                >
                  {isSubmittingManual ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Publish Custom Email &amp; Generate Special Link</span>
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        {/* Media Pickers for Template Thumbnails */}
        {mediaPickerOpenFor && (
          <Dialog open={true} onOpenChange={(open) => !open && setMediaPickerOpenFor(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <span>Pick or Upload Cover Photo</span>
                </DialogTitle>
              </DialogHeader>
              <MediaPicker
                value={selectedThumbnails[mediaPickerOpenFor] || ""}
                onChange={(url: string) => {
                  if (mediaPickerOpenFor) {
                    setSelectedThumbnails((prev) => ({
                      ...prev,
                      [mediaPickerOpenFor]: url,
                    }));
                  }
                  setMediaPickerOpenFor(null);
                }}
                folder="publications"
                accept="image/*"
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Media Picker for Manual Paste */}
        {isMediaPickerOpenPaste && (
          <Dialog open={true} onOpenChange={(open) => !open && setIsMediaPickerOpenPaste(false)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <span>Pick or Upload Cover Photo</span>
                </DialogTitle>
              </DialogHeader>
              <MediaPicker
                value={pasteThumbnail}
                onChange={(url: string) => {
                  setPasteThumbnail(url);
                  setIsMediaPickerOpenPaste(false);
                }}
                folder="publications"
                accept="image/*"
              />
            </DialogContent>
          </Dialog>
        )}

      </DialogContent>
    </Dialog>
  );
}
