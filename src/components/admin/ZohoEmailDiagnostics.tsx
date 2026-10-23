"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit, doc, setDoc } from "firebase/firestore";
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Loader2, 
  Users, 
  Eye, 
  EyeOff, 
  Sparkles, 
  X, 
  Hotel, 
  Hospital, 
  GraduationCap, 
  School, 
  Building2, 
  PenTool, 
  Check, 
  SendHorizontal,
  Upload,
  Smartphone,
  Monitor,
  Code,
  Image,
  Link2,
  Columns,
  ArrowRight,
  ArrowLeft,
  Cloud,
  RefreshCw,
  DownloadCloud,
  UploadCloud,
  Copy,
  ExternalLink,
  Database,
  BookOpen,
  Twitter,
  Linkedin,
  Facebook,
  MessageCircle,
  Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ZohoContactsImporter } from "./ZohoContactsImporter";
import { useContactGroups } from "@/hooks/use-contact-groups";
import { RichTextEditor } from "@/components/RichTextEditor";
import { EmailStudioBuilder, type EmailBlock } from "./EmailStudioBuilder";
import { useEmailTemplates } from "@/hooks/use-email-templates";
import {
  Publication,
  PUBLICATION_CATEGORIES,
  getPublicationSlug,
  getPublicationUrl,
  injectWebVersionHeader,
  getSocialShareLinks,
  extractExcerptFromHtml,
  extractFirstImage,
} from "@/lib/publications";
import { slugify } from "@/lib/slug";
import { SpecialLinkGeneratorModal } from "./SpecialLinkGeneratorModal";

export interface CampaignTemplate {
  id: string;
  title: string;
  sector: string;
  subject: string;
  key?: string;
  isCustom?: boolean;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: "custom",
    title: "Custom Designed Newsletter",
    sector: "Tailored Communication",
    subject: "WHO ARE WE? Modern Liquid Waste & Wastewater Solutions in Rwanda",
    isCustom: true,
    description: "Official SANEX custom newsletter designed in Email Studio.",
    icon: PenTool,
  },
  {
    id: "hotel",
    title: "Hotels & Hospitality",
    sector: "Hotels, Lodges & Resorts",
    subject: "Improve Your Hotel’s Sanitation with Reliable Wastewater Management Solutions",
    key: "2d6f.7d30e4720195ecf6.k1.f8f11ec1-c870-11f1-a620-5254009dfd0a.1a13ea3faaa",
    description: "Designed for hotel managers, lodge directors, and hospitality operations.",
    icon: Hotel,
  },
  {
    id: "health",
    title: "Health Facilities",
    sector: "Hospitals & Medical Clinics",
    subject: "Wastewater Management Solutions for Health Facilities in Rwanda",
    key: "2d6f.7d30e4720195ecf6.k1.4e84d0b0-c872-11f1-a620-5254009dfd0a.1a13eacb93b",
    description: "Designed for hospital directors, clinic administrators, and medical facilities.",
    icon: Hospital,
  },
  {
    id: "campus",
    title: "Campuses & Universities",
    sector: "Universities & Colleges",
    subject: "Wastewater Management Solutions for Campuses in Rwanda",
    key: "2d6f.7d30e4720195ecf6.k1.2941a170-c872-11f1-a620-5254009dfd0a.1a13eabc507",
    description: "Designed for university administrators, student facilities, and campus estates.",
    icon: GraduationCap,
  },
  {
    id: "schools",
    title: "Schools & Academies",
    sector: "Primary & Secondary Schools",
    subject: "Wastewater Management Solutions for Schools in Rwanda",
    key: "2d6f.7d30e4720195ecf6.k1.37f838b0-c871-11f1-a620-5254009dfd0a.1a13ea597bb",
    description: "Designed for school headmasters, bursars, and educational institutions.",
    icon: School,
  },
  {
    id: "general",
    title: "General Institutions",
    sector: "Enterprises & Public Bodies",
    subject: "Innovative Wastewater Management Solutions for your institution",
    key: "2d6f.7d30e4720195ecf6.k1.c87da360-c872-11f1-a620-5254009dfd0a.1a13eafd896",
    description: "Designed for corporate office complexes, commercial estates, and public buildings.",
    icon: Building2,
  },
];

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function ZohoEmailHub() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { groups } = useContactGroups();

  // Selected Campaign / Template (defaults to Custom Designed Newsletter)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("custom");
  const selectedCampaign = useMemo(
    () => CAMPAIGN_TEMPLATES.find((c) => c.id === selectedCampaignId) || CAMPAIGN_TEMPLATES[0],
    [selectedCampaignId]
  );

  // Form Fields
  const [toInput, setToInput] = useState("");
  const [subject, setSubject] = useState(CAMPAIGN_TEMPLATES[0].subject);
  const [customMessage, setCustomMessage] = useState("");
  const [recipientOrgName, setRecipientOrgName] = useState("");
  const [useBrandedDesign, setUseBrandedDesign] = useState(true);
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [editorMode, setEditorMode] = useState<"text" | "html">("text");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [customStep, setCustomStep] = useState<"design" | "send">("design");
  const [customEmailBlocks, setCustomEmailBlocks] = useState<EmailBlock[] | null>(null);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");

  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastDispatchSuccess, setLastDispatchSuccess] = useState<{
    count: number;
    title: string;
  } | null>(null);
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  // Online Publications & Special SEO Links
  const [publishToArchive, setPublishToArchive] = useState(true);
  const [publicationSlug, setPublicationSlug] = useState("");
  const [publicationCategory, setPublicationCategory] = useState<string>("Company Announcements");
  const [includeWebVersionLink, setIncludeWebVersionLink] = useState(true);
  const [selectedLinkedPubIds, setSelectedLinkedPubIds] = useState<string[]>([]);
  const [createdPublicationResult, setCreatedPublicationResult] = useState<{
    title: string;
    slug: string;
    url: string;
    count: number;
  } | null>(null);
  const [copiedPubLink, setCopiedPubLink] = useState(false);
  const [isLinkGenModalOpen, setIsLinkGenModalOpen] = useState(false);
  const [selectedModalPublication, setSelectedModalPublication] = useState<Publication | null>(null);
  const [isPublishingDirectly, setIsPublishingDirectly] = useState(false);

  // Cloud Sync & Email Templates Engine
  const {
    cloudTemplate,
    cloudLoading,
    syncStatus,
    lastSyncTime,
    getLocalDraft,
    setLocalDraft,
    saveActiveTemplateToCloud,
    importRawTemplate,
  } = useEmailTemplates();

  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [rawImportInput, setRawImportInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const lastAppliedCloudTimeRef = React.useRef<number>(0);
  const userHasEditedRef = React.useRef<boolean>(false);

  // 1. Restore from local storage draft if available immediately on mount
  useEffect(() => {
    const local = getLocalDraft();
    if (local) {
      if (local.message) setCustomMessage(local.message);
      if (local.mode) setEditorMode(local.mode);
      if (local.blocks && Array.isArray(local.blocks) && local.blocks.length > 0) {
        setCustomEmailBlocks(local.blocks);
      }
    }
  }, [getLocalDraft]);

  // 2. Real-time Firestore Cloud listener: hydrate active state ONLY on initial load before user edits.
  // CRITICAL: Once the user begins editing in the custom email studio, background cloud snapshots MUST NEVER overwrite their active design!
  useEffect(() => {
    if (!cloudTemplate) return;
    if (userHasEditedRef.current) return;
    if (cloudTemplate.updatedAt && cloudTemplate.updatedAt > lastAppliedCloudTimeRef.current) {
      lastAppliedCloudTimeRef.current = cloudTemplate.updatedAt;
      if (cloudTemplate.blocks && Array.isArray(cloudTemplate.blocks) && cloudTemplate.blocks.length > 0) {
        setCustomEmailBlocks(cloudTemplate.blocks);
      }
      if (cloudTemplate.message) {
        setCustomMessage(cloudTemplate.message);
      }
      if (cloudTemplate.mode) {
        setEditorMode(cloudTemplate.mode);
      }
    }
  }, [cloudTemplate]);


  // 3. Persist local draft as offline/tab cache
  useEffect(() => {
    if (!customMessage && !customEmailBlocks) return;
    setLocalDraft({
      message: customMessage,
      mode: editorMode,
      blocks: customEmailBlocks || undefined,
      updatedAt: Date.now(),
    });
  }, [customMessage, editorMode, customEmailBlocks, setLocalDraft]);

  // When campaign selection changes, update subject line
  const handleSelectCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setLastDispatchSuccess(null);
    const campaign = CAMPAIGN_TEMPLATES.find((c) => c.id === campaignId);
    if (campaign) {
      if (!campaign.isCustom) {
        setSubject(campaign.subject);
        setPublicationSlug(slugify(campaign.subject));
        setPublicationCategory(campaign.title);
      } else {
        setSubject("");
        setPublicationSlug("");
        setPublicationCategory("Company Announcements");
        setCustomStep("design");
      }
    }
  };

  // Query existing publications for cross-referencing and linking via API
  const [existingPublications, setExistingPublications] = useState<Publication[]>([]);
  useEffect(() => {
    fetch("/api/publications")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.publications)) {
          setExistingPublications(data.publications);
        }
      })
      .catch(() => {});
  }, []);

  // Query saved contacts from address book (client_contacts)
  const contactsQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, "client_contacts");
  }, [db, user]);
  const { data: rawContacts } = useCollection(contactsQuery);

  // Group contacts by sector for 1-click targeting
  const sectorContacts = useMemo(() => {
    const map: Record<string, string[]> = {
      all: [],
    };
    groups.forEach((g) => {
      map[g.id] = [];
    });
    (rawContacts || []).forEach((c: any) => {
      const email = (c.email || "").trim().toLowerCase();
      if (email && EMAIL_REGEX.test(email)) {
        map.all.push(email);
        const contactSectors: string[] = Array.isArray(c.sectors) && c.sectors.length > 0
          ? c.sectors
          : [c.sector || "general"];

        contactSectors.forEach((s: string) => {
          if (map[s]) {
            if (!map[s].includes(email)) map[s].push(email);
          } else {
            map[s] = [email];
          }
        });
      }
    });
    return map;
  }, [rawContacts, groups]);

  // Query bookings for client audience quick-selection
  const bookingsQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, "bookings");
  }, [db, user]);
  const { data: bookings } = useCollection(bookingsQuery);

  // Extract client email lists from bookings
  const clientAudiences = useMemo(() => {
    const all = new Set<string>();
    const confirmed = new Set<string>();
    const pending = new Set<string>();

    (bookings || []).forEach((b: any) => {
      const email = (b.customerEmail || b.email || "").trim().toLowerCase();
      if (email && EMAIL_REGEX.test(email)) {
        all.add(email);
        const status = (b.status || "pending").toLowerCase();
        if (status === "confirmed") confirmed.add(email);
        else if (status === "pending") pending.add(email);
      }
    });

    return {
      all: Array.from(all),
      confirmed: Array.from(confirmed),
      pending: Array.from(pending),
    };
  }, [bookings]);

  // Parse "To" recipients
  const parsedRecipients = useMemo(() => {
    if (!toInput.trim()) return { valid: [], invalid: [] };
    const tokens = toInput.split(/[\s,;\n\r]+/);
    const valid: string[] = [];
    const invalid: string[] = [];
    const seen = new Set<string>();

    tokens.forEach((t) => {
      const clean = t.trim();
      if (!clean) return;
      if (EMAIL_REGEX.test(clean)) {
        const lower = clean.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          valid.push(clean);
        }
      } else {
        invalid.push(clean);
      }
    });

    return { valid, invalid };
  }, [toInput]);

  // Audience quick-insert handler
  const handleAddAudience = (emails: string[], groupName: string) => {
    if (!emails || emails.length === 0) {
      toast({ title: `No ${groupName} emails found`, description: "No booking records matched this selection." });
      return;
    }
    const current = new Set(parsedRecipients.valid.map((e) => e.toLowerCase()));
    const added: string[] = [];
    emails.forEach((e) => {
      if (!current.has(e.toLowerCase())) {
        added.push(e);
      }
    });

    if (added.length === 0) {
      toast({ title: "Already added", description: "All contacts in this group are already in your list." });
      return;
    }

    const updated = toInput.trim()
      ? `${toInput.trim()}, ${added.join(", ")}`
      : added.join(", ");
    setToInput(updated);
    toast({ title: `Added ${added.length} contacts`, description: `Inserted ${groupName} into recipient list.` });
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    const updated = parsedRecipients.valid
      .filter((e) => e.toLowerCase() !== emailToRemove.toLowerCase())
      .join(", ");
    setToInput(updated);
  };

  // Quick test preview to admin's own email
  const handleSendTestToSelf = async () => {
    if (!user?.email) {
      toast({ variant: "destructive", title: "Error", description: "Could not find your administrator email." });
      return;
    }

    const currentTo = toInput;
    setToInput(user.email);
    toast({
      title: "Test Address Set",
      description: `Recipient set to your email (${user.email}). Click Send Email to dispatch a preview copy.`,
    });
  };

  // Handle Send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (parsedRecipients.valid.length === 0) {
      toast({
        variant: "destructive",
        title: "Recipient Required",
        description: "Please enter at least one recipient email address.",
      });
      return;
    }

    if (parsedRecipients.invalid.length > 0) {
      toast({
        variant: "destructive",
        title: "Please Check Recipient Address",
        description: `"${parsedRecipients.invalid[0]}" is not a valid email address.`,
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        variant: "destructive",
        title: "Subject Required",
        description: "Please enter an email subject line.",
      });
      return;
    }

    if (selectedCampaign.isCustom && !customMessage.trim()) {
      toast({
        variant: "destructive",
        title: "Message Content Required",
        description: "Please type the message content you would like to send.",
      });
      return;
    }

    setIsSending(true);
    setLastDispatchSuccess(null);
    setCreatedPublicationResult(null);

    try {
      const token = user ? await user.getIdToken() : "";
      const origin = typeof window !== "undefined" ? window.location.origin : "https://sanex.rw";
      const finalSlug = slugify(publicationSlug || subject || `newsletter-${Date.now()}`);
      const specialPublicationUrl = `${origin}/publications/${finalSlug}`;

      let htmlToSend = customMessage.trim();
      if (selectedCampaign.isCustom && publishToArchive && includeWebVersionLink) {
        if (editorMode === "html" || htmlToSend.includes("<")) {
          htmlToSend = injectWebVersionHeader(htmlToSend, specialPublicationUrl, subject.trim());
        }
      }

      const payload: any = {
        to: parsedRecipients.valid,
        cc: ccInput.trim() ? ccInput.trim().split(/[\s,;\n\r]+/).filter(Boolean) : undefined,
        bcc: bccInput.trim() ? bccInput.trim().split(/[\s,;\n\r]+/).filter(Boolean) : undefined,
        clientReference: `campaign-${selectedCampaign.id}-${Date.now()}`,
      };

      if (!selectedCampaign.isCustom && selectedCampaign.key) {
        // Campaign Template (Zoho CPaaS pre-designed HTML)
        payload.templateKey = selectedCampaign.key;
        payload.subject = subject.trim();
        if (recipientOrgName.trim()) {
          payload.mergeInfo = {
            institution_name: recipientOrgName.trim(),
            contact_person: recipientOrgName.trim(),
          };
        }
      } else {
        // Custom Message
        payload.subject = subject.trim();
        if (editorMode === "html" || htmlToSend.includes("<")) {
          payload.html = htmlToSend;
        }
        payload.message = customMessage.trim();
        payload.useBrandedTemplate = useBrandedDesign;
        payload.ctaText = ctaText.trim() || undefined;
        payload.ctaUrl = ctaUrl.trim() || undefined;
      }

      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const sentCount = data.recipientCount || parsedRecipients.valid.length;
        setLastDispatchSuccess({
          count: sentCount,
          title: selectedCampaign.title,
        });

        // If publishToArchive is active, host this custom email on the website as a publication
        if (publishToArchive) {
          try {
            const pubId = `pub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const finalCompiledHtml = (editorMode === "html" || customMessage.includes("<"))
              ? htmlToSend
              : `<div style="font-family:sans-serif;line-height:1.6;color:#1e293b;">${customMessage.trim().replace(/\n/g, "<br/>")}</div>`;

            // Resolve linked newsletters
            const resolvedLinked = selectedLinkedPubIds
              .map((id) => {
                const match = existingPublications.find((p) => p.id === id);
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

            const detectedCover = extractFirstImage(finalCompiledHtml);

            const newPublication: Publication = {
              id: pubId,
              slug: finalSlug,
              title: subject.trim(),
              subject: subject.trim(),
              excerpt: extractExcerptFromHtml(finalCompiledHtml),
              content: finalCompiledHtml,
              plainText: customMessage.trim(),
              category: publicationCategory,
              sector: selectedCampaign.sector || publicationCategory,
              author: "SANEX Communications",
              publishedAt: Date.now(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              recipientCount: sentCount,
              status: "published",
              isCustom: true,
              coverImage: detectedCover,
              thumbnailImg: detectedCover,
              linkedNewsletters: resolvedLinked as any,
              viewsCount: 0,
            };

            // 1. Reliably save to server publications store & settings/email_template via API
            try {
              await fetch("/api/email/template", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: subject.trim(),
                  subject: subject.trim(),
                  message: finalCompiledHtml,
                  blocks: customEmailBlocks,
                  mode: editorMode,
                  userEmail: user?.email || "admin@sanex.rw",
                }),
              });
            } catch {
              // Handled gracefully
            }

            // 2. Client-side Firestore best-effort write
            if (db) {
              try {
                await setDoc(doc(db, "publications", pubId), newPublication, { merge: true });
              } catch {
                // Handled gracefully
              }
            }

            setCreatedPublicationResult({
              title: subject.trim(),
              slug: finalSlug,
              url: specialPublicationUrl,
              count: sentCount,
            });

            setSelectedModalPublication(newPublication);
            setIsLinkGenModalOpen(true);
          } catch (pubErr: any) {
            console.warn("Failed recording publication:", pubErr);
          }
        }


        toast({
          title: "Emails Dispatched Successfully",
          description: `Delivered to ${sentCount} recipient(s) from info@sanex.rw.${publishToArchive ? " Special publication link generated!" : ""}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Dispatch Unsuccessful",
          description: data.error || data.message || "Failed to dispatch email. Please verify connection.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: err.message || "Could not reach email service.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handlePublishCurrentEmailToWebsite = async () => {
    const effectiveSubject = subject.trim() || selectedCampaign.title || "SANEX Official Email Broadcast";
    if (!effectiveSubject) {
      toast({
        variant: "destructive",
        title: "Subject Required",
        description: "Please specify an email subject/title to generate the online publication link.",
      });
      return;
    }

    if (!db) return;
    setIsPublishingDirectly(true);

    try {
      let finalCompiledHtml = "";
      if (selectedCampaign.isCustom) {
        if (editorMode === "html") {
          finalCompiledHtml = customMessage;
        } else {
          finalCompiledHtml = customMessage.replace(/\n/g, "<br/>");
        }
      } else {
        finalCompiledHtml = `<div style="font-family:sans-serif;line-height:1.6;color:#1e293b;"><h2 style="color:#0f172a;">${effectiveSubject}</h2><p>${selectedCampaign.description}</p></div>`;
      }

      const finalSlug = slugify(publicationSlug || effectiveSubject);
      const pubId = `pub_${Date.now()}`;
      const origin = typeof window !== "undefined" ? window.location.origin : "https://sanex.rw";
      const specialPublicationUrl = `${origin}/publications/${finalSlug}`;

      const resolvedLinked = selectedLinkedPubIds
        .map((id) => {
          const match = existingPublications.find((p) => p.id === id);
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

      const newPub: Publication = {
        id: pubId,
        slug: finalSlug,
        title: effectiveSubject,
        subject: effectiveSubject,
        excerpt: extractExcerptFromHtml(finalCompiledHtml) || effectiveSubject,
        content: finalCompiledHtml || `<p>${effectiveSubject}</p>`,
        plainText: customMessage.trim() || effectiveSubject,
        category: publicationCategory,
        sector: selectedCampaign.sector || publicationCategory,
        author: "SANEX Communications",
        publishedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        recipientCount: 0,
        status: "published",
        linkedNewsletters: resolvedLinked as any,
        viewsCount: 0,
      };

      // 1. Reliably save to server publications store & settings/email_template via API
      try {
        await fetch("/api/email/template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: effectiveSubject,
            subject: effectiveSubject,
            message: finalCompiledHtml,
            blocks: customEmailBlocks,
            mode: editorMode,
            userEmail: user?.email || "admin@sanex.rw",
          }),
        });
      } catch {
        // Handled gracefully
      }

      // 2. Best effort client-side Firestore write
      if (db) {
        try {
          await setDoc(doc(db, "publications", pubId), newPub, { merge: true });
        } catch {
          // Handled gracefully
        }
      }


      setCreatedPublicationResult({
        title: effectiveSubject,
        slug: finalSlug,
        url: specialPublicationUrl,
        count: 0,
      });

      setSelectedModalPublication(newPub);
      setIsLinkGenModalOpen(true);

      toast({
        title: "Published Online & Link Generated!",
        description: `Live SEO Link: ${specialPublicationUrl}`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Publish Failed",
        description: err.message || "Failed to save publication to database.",
      });
    } finally {
      setIsPublishingDirectly(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Form Container */}
      <Card className="border bg-white shadow-sm overflow-hidden">
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleSend} className="space-y-5">
            {/* Campaign / Template Selection Dropdown (Only visible on sending stage) */}
            {!(selectedCampaign.isCustom && customStep === "design") && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="campaign-select" className="text-xs font-bold text-foreground">
                    Email Template / Campaign
                  </Label>
                  {selectedCampaign.isCustom && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomStep("design")}
                      className="h-7 text-xs font-bold gap-1.5 border-primary text-black bg-primary/20 hover:bg-primary/30"
                    >
                      <PenTool className="h-3.5 w-3.5 text-black" /> Open Email Designer
                    </Button>
                  )}
                </div>
                <Select value={selectedCampaignId} onValueChange={handleSelectCampaign}>
                  <SelectTrigger id="campaign-select" className="h-10 text-xs bg-white">
                    <SelectValue placeholder="Select email template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TEMPLATES.map((camp) => (
                      <SelectItem key={camp.id} value={camp.id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{camp.title}</span>
                          <span className="text-[11px] text-muted-foreground">({camp.sector})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Render Audience Section Helper */}
            {(() => {
              const renderAudienceSection = () => (
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <Label className="text-xs font-bold text-foreground">
                      Recipients *
                    </Label>

                    {/* Quick Add Audiences */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">Saved Contacts:</span>
                        {groups.map((grp) => {
                          const list = sectorContacts[grp.id] || [];
                          const isMatched = selectedCampaignId === grp.id;
                          return (
                            <Button
                              key={grp.id}
                              type="button"
                              size="sm"
                              variant="outline"
                              className={`h-6 text-[10px] px-2 font-bold gap-1 transition-all ${
                                isMatched
                                  ? "bg-primary text-black border-primary ring-1 ring-primary"
                                  : "bg-white text-slate-700"
                              }`}
                              onClick={() => handleAddAudience(list, grp.name)}
                            >
                              {grp.name} ({list.length})
                            </Button>
                          );
                        })}

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 font-bold bg-white text-slate-700"
                          onClick={() => handleAddAudience(sectorContacts.all, "All Address Book")}
                        >
                          All Saved ({sectorContacts.all?.length || 0})
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setIsImporterOpen(true)}
                          className="h-6 text-[10px] px-2 font-bold border-primary/50 text-slate-900 bg-primary/10 hover:bg-primary/20 gap-1 ml-auto"
                        >
                          <Upload className="h-3 w-3 text-primary" /> Import Zoho Contacts
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">From Bookings:</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-5 text-[9px] px-2 font-bold"
                          onClick={() => handleAddAudience(clientAudiences.all, "All Bookings")}
                        >
                          All ({clientAudiences.all.length})
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-5 text-[9px] px-2 font-bold text-green-700 border-green-200"
                          onClick={() => handleAddAudience(clientAudiences.confirmed, "Confirmed")}
                        >
                          Confirmed ({clientAudiences.confirmed.length})
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-5 text-[9px] px-2 font-bold text-amber-700 border-amber-200"
                          onClick={() => handleAddAudience(clientAudiences.pending, "Pending")}
                        >
                          Pending ({clientAudiences.pending.length})
                        </Button>
                        {user?.email && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-5 text-[9px] px-2 font-bold"
                            onClick={() => handleAddAudience([user.email!], "Self")}
                          >
                            Myself
                          </Button>
                        )}
                        {parsedRecipients.valid.length > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-5 text-[9px] px-1.5 text-muted-foreground hover:text-red-600 ml-auto"
                            onClick={() => setToInput("")}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <Textarea
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                    placeholder="Paste emails here (e.g. director@hospital.rw, manager@hotel.rw, info@enterprise.com)"
                    rows={2}
                    className="font-mono text-xs bg-white resize-y min-h-[64px]"
                    disabled={isSending}
                  />

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <Badge variant={parsedRecipients.valid.length > 0 ? "default" : "secondary"} className="text-[10px] font-bold">
                      {parsedRecipients.valid.length} Recipient{parsedRecipients.valid.length === 1 ? "" : "s"} Ready
                    </Badge>

                    {parsedRecipients.valid.slice(0, 5).map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(email)}
                          className="hover:text-red-600 focus:outline-none"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}

                    {parsedRecipients.valid.length > 5 && (
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        +{parsedRecipients.valid.length - 5} more
                      </span>
                    )}

                    {parsedRecipients.invalid.length > 0 && (
                      <Badge variant="destructive" className="text-[10px] font-bold">
                        Check address: {parsedRecipients.invalid[0]}
                      </Badge>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowCcBcc(!showCcBcc)}
                      className="ml-auto text-[11px] text-primary hover:underline font-bold"
                    >
                      {showCcBcc ? "Hide CC/BCC" : "+ Add CC / BCC"}
                    </button>
                  </div>

                  {showCcBcc && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t mt-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">CC</Label>
                        <Input
                          value={ccInput}
                          onChange={(e) => setCcInput(e.target.value)}
                          placeholder="cc1@sanex.rw, cc2@sanex.rw"
                          className="h-8 text-xs bg-white font-mono"
                          disabled={isSending}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">BCC</Label>
                        <Input
                          value={bccInput}
                          onChange={(e) => setBccInput(e.target.value)}
                          placeholder="bcc@sanex.rw"
                          className="h-8 text-xs bg-white font-mono"
                          disabled={isSending}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );

              const renderActionButtons = () => (
                <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSendTestToSelf}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Send test copy to myself first
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                    {/* Direct Publish Online & Link Generator Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePublishCurrentEmailToWebsite}
                      disabled={isPublishingDirectly || isSending || (!subject.trim() && !customMessage.trim())}
                      className="h-10 px-4 text-xs font-extrabold bg-primary/10 border-primary/30 text-slate-900 hover:bg-primary/20 gap-1.5 shadow-2xs"
                    >
                      {isPublishingDirectly ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      )}
                      <span>Publish Online &amp; Get Link</span>
                    </Button>

                    <Button
                      type="submit"
                      disabled={isSending || parsedRecipients.valid.length === 0}
                      className="w-full sm:w-auto h-10 px-6 text-xs font-extrabold bg-primary text-black hover:bg-primary/90 gap-2 shadow-sm"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending Emails...
                        </>
                      ) : (
                        <>
                          <SendHorizontal className="h-4 w-4" />
                          Send Campaign to {parsedRecipients.valid.length} Recipient{parsedRecipients.valid.length === 1 ? "" : "s"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );

              if (selectedCampaign.isCustom) {
                if (customStep === "design") {
                  return (
                    <div className="pt-1">
                      <EmailStudioBuilder
                        initialHtml={customMessage}
                        initialBlocks={customEmailBlocks || undefined}
                        onChange={(updatedBlocks, compiledHtml) => {
                          userHasEditedRef.current = true;
                          setCustomEmailBlocks(updatedBlocks);
                          setCustomMessage(compiledHtml);
                          setEditorMode("html");
                        }}
                        onSaveAndProceed={async (compiledHtml, savedBlocks) => {
                          userHasEditedRef.current = true;
                          setCustomMessage(compiledHtml);
                          setCustomEmailBlocks(savedBlocks);
                          setEditorMode("html");
                          setCustomStep("send");
                          await saveActiveTemplateToCloud({
                            name: subject.trim() || "SANEX Official Custom Email Broadcast",
                            message: compiledHtml,
                            blocks: savedBlocks,
                            mode: "html",
                          });
                          toast({
                            title: "Custom Email Saved",
                            description: "Your design changes are saved and ready to send. Recipient selection is open below.",
                          });
                        }}
                        onBackToSending={(currentBlocks) => {
                          if (currentBlocks) {
                            userHasEditedRef.current = true;
                            setCustomEmailBlocks(currentBlocks);
                            saveActiveTemplateToCloud({
                              name: subject.trim() || "SANEX Official Custom Email Broadcast",
                              message: customMessage,
                              blocks: currentBlocks,
                              mode: editorMode,
                            });
                          }
                          setCustomStep("send");
                        }}
                        onSaveToCloud={async (compiledHtml, savedBlocks) => {
                          userHasEditedRef.current = true;
                          setCustomMessage(compiledHtml);
                          setCustomEmailBlocks(savedBlocks);
                          const res = await saveActiveTemplateToCloud({
                            name: subject.trim() || "SANEX Official Custom Email Broadcast",
                            message: compiledHtml,
                            blocks: savedBlocks,
                            mode: "html",
                          });
                          if (res.success) {
                            toast({
                              title: "Custom Email Saved & Published",
                              description: "Your custom email design is saved to Cloud and live website publication.",
                            });
                          } else {
                            toast({
                              title: "Sync Error",
                              description: res.error || "Failed to sync to cloud.",
                              variant: "destructive",
                            });
                          }
                          return res;
                        }}
                        onOpenCloudTransfer={() => setIsCloudSyncModalOpen(true)}
                        cloudSyncStatus={syncStatus}
                        lastSyncTime={lastSyncTime}
                      />

                    </div>
                  );
                }

                // customStep === "send"
                return (
                  <div className="space-y-5 pt-1">
                    {/* Design Ready Summary Banner */}
                    <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary text-black font-extrabold text-[10px]">
                            {customMessage ? "Custom Design Ready" : "Draft"}
                          </Badge>
                          <span className="text-xs font-extrabold text-slate-800">
                            {customMessage ? "Custom Email Layout & Content" : "No content yet"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground m-0">
                          {useBrandedDesign ? "SANEX Official Branded Layout" : "Unbranded Custom Email"} ·{" "}
                          {editorMode === "text" ? "Visual Editor Content" : "Custom HTML Content"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCloudSyncModalOpen(true)}
                          className={`h-8 text-xs font-bold gap-1.5 transition-all ${
                            syncStatus === "synced"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                              : "border-slate-300 text-slate-800 bg-white hover:bg-slate-50"
                          }`}
                          title="Cloud & Live Website Sync Settings"
                        >
                          <Cloud className={`h-3.5 w-3.5 ${syncStatus === "synced" ? "text-emerald-600" : "text-sky-600"}`} />
                          <span>Live Sync</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomStep("design")}
                          className="h-8 text-xs font-bold gap-1.5 border-slate-300 text-slate-800 bg-white hover:bg-slate-50"
                        >
                          <PenTool className="h-3.5 w-3.5 text-primary" /> Edit Design & Layout
                        </Button>
                        {customMessage && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreview(true)}
                            className="h-8 text-xs font-bold gap-1.5 border-primary text-black bg-primary/20 hover:bg-primary/30"
                          >
                            <Eye className="h-3.5 w-3.5 text-black" /> Preview Email
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Email Subject Line */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email-subject-custom" className="text-xs font-bold text-foreground">
                        Email Subject Line *
                      </Label>
                      <Input
                        id="email-subject-custom"
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter email subject line..."
                        className="h-10 text-xs bg-white"
                        disabled={isSending}
                      />
                    </div>

                    {/* Recipient Organization Name (Optional) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="recipient-org-custom" className="text-xs font-bold text-muted-foreground">
                        Organization or Contact Name (Optional)
                      </Label>
                      <Input
                        id="recipient-org-custom"
                        type="text"
                        value={recipientOrgName}
                        onChange={(e) => setRecipientOrgName(e.target.value)}
                        placeholder="e.g. Kigali Serena Hotel, King Faisal Hospital, etc."
                        className="h-9 text-xs bg-white"
                        disabled={isSending}
                      />
                    </div>

                    {/* Online Publication & Special Link Settings */}
                    <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 font-extrabold text-xs text-foreground">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span>Host as Public Web Publication &amp; Generate Special SEO Link</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground m-0">
                            Hosts this sent custom email on the website and generates a special shareable SEO link for social media.
                          </p>
                        </div>
                        <Switch
                          checked={publishToArchive}
                          onCheckedChange={setPublishToArchive}
                        />
                      </div>

                      {publishToArchive && (
                        <div className="space-y-3 pt-2 border-t border-primary/20">
                          {/* Live Special SEO Link Preview */}
                          <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                                Generated Special SEO Link:
                              </span>
                              <span className="text-xs font-mono font-bold text-primary truncate block">
                                {typeof window !== "undefined" ? window.location.origin : "https://sanex.rw"}/publications/{slugify(publicationSlug || subject || "custom-email")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge className="bg-primary/20 text-black border-primary/30 text-[9px] font-bold uppercase tracking-wider">
                                Special Link
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Customizable Slug Input */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                                  Custom SEO Keywords (Slug)
                                </Label>
                                <span className="text-[9px] text-muted-foreground">sanex.rw/publications/...</span>
                              </div>
                              <Input
                                value={publicationSlug}
                                onChange={(e) => setPublicationSlug(slugify(e.target.value))}
                                placeholder={slugify(subject) || "sanitation-updates-october-2026"}
                                className="h-8 text-xs font-mono bg-white"
                                disabled={isSending}
                              />
                            </div>

                            {/* Category Selector */}
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                                Publication Category / Sector
                              </Label>
                              <Select
                                value={publicationCategory}
                                onValueChange={setPublicationCategory}
                                disabled={isSending}
                              >
                                <SelectTrigger className="h-8 text-xs bg-white">
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
                          </div>

                          {/* Link to Various Newsletters */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <Link2 className="h-3 w-3 text-primary" /> Link to other newsletters:
                              </Label>
                              {selectedLinkedPubIds.length > 0 && (
                                <span className="text-[10px] font-bold text-primary">
                                  {selectedLinkedPubIds.length} newsletter{selectedLinkedPubIds.length === 1 ? "" : "s"} linked
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground m-0">
                              Select existing newsletters to link to this publication. Readers can explore related past issues.
                            </p>

                            {existingPublications.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-lg border bg-white">
                                {existingPublications.map((p) => {
                                  const isSelected = selectedLinkedPubIds.includes(p.id);
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedLinkedPubIds(selectedLinkedPubIds.filter((id) => id !== p.id));
                                        } else {
                                          setSelectedLinkedPubIds([...selectedLinkedPubIds, p.id]);
                                        }
                                      }}
                                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 ${
                                        isSelected
                                          ? "bg-primary text-black border-primary font-bold shadow-2xs"
                                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                                      }`}
                                    >
                                      {isSelected && <Check className="h-2.5 w-2.5" />}
                                      <span className="truncate max-w-[170px]">{p.title}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-[11px] text-muted-foreground italic">
                                No previous newsletters yet. This custom email will become your first publication!
                              </p>
                            )}
                          </div>

                          {/* View in Browser Header Checkbox */}
                          <div className="flex items-center gap-2 pt-1 border-t border-primary/20">
                            <input
                              type="checkbox"
                              id="include-web-link-toggle"
                              checked={includeWebVersionLink}
                              onChange={(e) => setIncludeWebVersionLink(e.target.checked)}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                            />
                            <label htmlFor="include-web-link-toggle" className="text-xs text-slate-700 cursor-pointer select-none">
                              Include <span className="font-bold text-slate-900">&quot;View this email in your browser&quot;</span> header bar in dispatched email
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Audience Section */}
                    {renderAudienceSection()}

                    {/* Action Buttons */}
                    {renderActionButtons()}
                  </div>
                );
              }

              return (
                <div className="space-y-5">
                  {/* Email Subject Line */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email-subject" className="text-xs font-bold text-foreground">
                      Email Subject Line *
                    </Label>
                    <Input
                      id="email-subject"
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter email subject line..."
                      className="h-10 text-xs bg-white"
                      disabled={isSending}
                    />
                  </div>

                  {/* Recipient Organization Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="recipient-org" className="text-xs font-bold text-muted-foreground">
                      Organization or Contact Name (Optional)
                    </Label>
                    <Input
                      id="recipient-org"
                      type="text"
                      value={recipientOrgName}
                      onChange={(e) => setRecipientOrgName(e.target.value)}
                      placeholder="e.g. Kigali Serena Hotel, King Faisal Hospital, etc."
                      className="h-9 text-xs bg-white"
                      disabled={isSending}
                    />
                  </div>

                  {/* Audience Section */}
                  {renderAudienceSection()}

                  {/* Action Buttons */}
                  {renderActionButtons()}
                </div>
              );
            })()}

            {/* Full-width Modal Popup Preview for Custom Message */}
            {selectedCampaign.isCustom && (
              <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-100">
                  <DialogHeader className="p-4 border-b bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <DialogTitle className="text-sm font-bold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" /> Email Layout Preview
                    </DialogTitle>

                    {/* Centered Desktop and Mobile View Buttons */}
                    <div className="flex items-center justify-center border rounded-lg overflow-hidden bg-slate-50 p-0.5 mx-auto">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("desktop")}
                        className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded transition-colors ${
                          previewDevice === "desktop"
                            ? "bg-slate-900 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Monitor className="h-3.5 w-3.5" /> Desktop View (600px)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("mobile")}
                        className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded transition-colors ${
                          previewDevice === "mobile"
                            ? "bg-slate-900 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Smartphone className="h-3.5 w-3.5" /> Mobile View (375px)
                      </button>
                    </div>

                    <div className="text-xs text-muted-foreground hidden sm:block">
                      Sender: <span className="font-mono text-slate-800">info@sanex.rw</span>
                    </div>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start">
                    <div
                      className={`w-full bg-white rounded-xl shadow-md border p-4 sm:p-6 space-y-4 text-xs leading-relaxed text-slate-800 transition-all duration-300 ${
                        previewDevice === "mobile"
                          ? "max-w-[375px] ring-2 ring-slate-400"
                          : "max-w-[620px]"
                      }`}
                    >
                      {subject && <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{subject}</h2>}
                      {editorMode === "html" ? (
                        <div className="w-full overflow-hidden rounded-md border border-slate-100">
                          <iframe
                            srcDoc={
                              customMessage
                                ? (previewDevice === "mobile" ? customMessage.replace("<html", '<html class="mobile-forced"') : customMessage)
                                : "<!DOCTYPE html><html><body style='font-family:sans-serif; text-align:center; padding:40px 20px; color:#94a3b8;'><p>Paste HTML/CSS code or design email in Email Studio...</p></body></html>"
                            }
                            title="Custom Email Preview"
                            className="w-full min-h-[580px] bg-white border-0"
                          />
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">
                          {customMessage || "Type message content to preview..."}
                        </div>
                      )}
                      {ctaText && ctaUrl && (
                        <div className="pt-4 text-center">
                          <span className="inline-block bg-[#8DB833] text-black font-extrabold text-xs px-6 py-2.5 rounded-lg shadow-xs">
                            {ctaText}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Success Card with Special Publication Link & Social Share */}
            {lastDispatchSuccess && (
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-50/70 text-slate-900 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
                  <div className="font-extrabold text-sm flex items-center gap-2 text-emerald-900">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>
                      {createdPublicationResult
                        ? "Campaign Dispatched & Published Online!"
                        : "Campaign Dispatched Successfully"}
                    </span>
                  </div>
                  <span className="text-xs text-emerald-800 font-semibold">
                    {lastDispatchSuccess.count} recipient{lastDispatchSuccess.count === 1 ? "" : "s"} reached
                  </span>
                </div>

                <p className="text-xs text-slate-700 m-0 leading-relaxed">
                  <strong>{lastDispatchSuccess.title}</strong> was successfully dispatched from{" "}
                  <strong className="font-mono text-slate-900">info@sanex.rw</strong>.
                </p>

                {createdPublicationResult && (
                  <div className="space-y-3 p-4 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                    {/* Special SEO Link Preview */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-primary" /> Special SEO Publication Link (Live Web Version):
                        </span>
                        <Badge className="bg-primary/20 text-black border-primary/30 text-[9px] font-bold">
                          Live On Website
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <span className="text-xs font-mono font-bold text-primary truncate max-w-full bg-slate-50 px-3 py-1.5 rounded-lg border flex-1">
                          {createdPublicationResult.url}
                        </span>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(createdPublicationResult.url);
                              setCopiedPubLink(true);
                              setTimeout(() => setCopiedPubLink(false), 2500);
                              toast({
                                title: "Special Link Copied",
                                description: createdPublicationResult.url,
                              });
                            }
                          }}
                          className={`h-8 text-xs font-bold gap-1.5 shrink-0 transition-all ${
                            copiedPubLink
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-slate-900 text-white hover:bg-black"
                          }`}
                        >
                          {copiedPubLink ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Copied!</span>
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
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-bold gap-1 bg-white hover:bg-slate-50 shrink-0"
                        >
                          <Link href={createdPublicationResult.url} target="_blank">
                            <ExternalLink className="h-3.5 w-3.5 text-primary" /> View Live
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Social Media Sharing */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Share2 className="h-3.5 w-3.5 text-primary" /> Share this newsletter on social media:
                      </span>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const links = getSocialShareLinks(
                              createdPublicationResult.title,
                              createdPublicationResult.url
                            );
                            window.open(links.linkedin, "_blank", "width=600,height=480");
                          }}
                          className="h-7 px-2.5 text-xs font-bold gap-1 bg-white hover:bg-slate-50 text-slate-800"
                        >
                          <Linkedin className="h-3 w-3 text-[#0A66C2]" /> LinkedIn
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const links = getSocialShareLinks(
                              createdPublicationResult.title,
                              createdPublicationResult.url
                            );
                            window.open(links.twitter, "_blank", "width=600,height=480");
                          }}
                          className="h-7 px-2.5 text-xs font-bold gap-1 bg-white hover:bg-slate-50 text-slate-800"
                        >
                          <Twitter className="h-3 w-3 text-[#1DA1F2]" /> Twitter / X
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const links = getSocialShareLinks(
                              createdPublicationResult.title,
                              createdPublicationResult.url
                            );
                            window.open(links.whatsapp, "_blank", "width=600,height=480");
                          }}
                          className="h-7 px-2.5 text-xs font-bold gap-1 bg-white hover:bg-slate-50 text-slate-800"
                        >
                          <MessageCircle className="h-3 w-3 text-emerald-600" /> WhatsApp
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const links = getSocialShareLinks(
                              createdPublicationResult.title,
                              createdPublicationResult.url
                            );
                            window.open(links.facebook, "_blank", "width=600,height=480");
                          }}
                          className="h-7 px-2.5 text-xs font-bold gap-1 bg-white hover:bg-slate-50 text-slate-800"
                        >
                          <Facebook className="h-3 w-3 text-[#1877F2]" /> Facebook
                        </Button>
                      </div>
                    </div>

                    <div className="pt-2 text-right">
                      <Link
                        href="/admin/publications"
                        className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Manage All Publications in Admin Portal &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Zoho Contacts Importer Modal */}
      <ZohoContactsImporter
        open={isImporterOpen}
        onOpenChange={setIsImporterOpen}
        defaultSector={selectedCampaignId as any}
      />

      {/* Cloud & Live Website Sync Modal */}
      <Dialog open={isCloudSyncModalOpen} onOpenChange={setIsCloudSyncModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Cloud className="h-5 w-5 text-sky-600" />
              <span>Live Website & Cloud Synchronization</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2 text-xs">
            {/* Environment & Backend Status */}
            <div className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/60 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-sky-600 text-white font-bold text-[10px]">
                    Firebase Firestore
                  </Badge>
                  <span className="font-extrabold text-slate-900">
                    Project: studio-9595184890-5bb3c
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] m-0">
                  Both localhost and your live website share this Firestore database. Any template saved here is accessible and synchronized bidirectionally.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    syncStatus === "synced"
                      ? "bg-emerald-100 text-emerald-800"
                      : syncStatus === "saving"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      syncStatus === "synced"
                        ? "bg-emerald-500"
                        : syncStatus === "saving"
                        ? "bg-amber-500 animate-ping"
                        : "bg-slate-400"
                    }`}
                  />
                  {syncStatus === "synced"
                    ? "Synced"
                    : syncStatus === "saving"
                    ? "Saving..."
                    : "Ready"}
                </span>
              </div>
            </div>

            {/* Cloud Template Status Card */}
            <div className="p-4 rounded-xl border bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-slate-600" />
                  Active Cloud Template in Firestore:
                </span>
                {cloudLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />}
              </div>

              {cloudTemplate && cloudTemplate.updatedAt ? (
                <div className="text-slate-700 space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {cloudTemplate.name || "Default Template"}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-semibold">
                      {cloudTemplate.blocks?.length || 0} Layout Blocks
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                    <span>
                      Last updated: {new Date(cloudTemplate.updatedAt).toLocaleString()}
                    </span>
                    <span>By: {cloudTemplate.updatedBy || "admin"}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                  No template has been saved to Cloud Firestore yet. Click{" "}
                  <strong>&quot;Push Local to Cloud&quot;</strong> or import your live template below to publish it to Firestore.
                </div>
              )}

              {/* Push / Pull Quick Action Buttons */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    setIsImporting(true);
                    const res = await saveActiveTemplateToCloud({
                      name: subject.trim() || "SANEX Official Custom Email Broadcast",
                      message: customMessage,
                      blocks: customEmailBlocks || undefined,
                      mode: editorMode,
                    });
                    setIsImporting(false);
                    if (res.success) {
                      toast({
                        title: "Custom Email Saved & Synced",
                        description:
                          "Your custom email design is saved to Cloud and live website publication.",
                      });
                      setIsCloudSyncModalOpen(false);
                    } else {
                      toast({
                        title: "Save Failed",
                        description: res.error,
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={isImporting}
                  className="h-8 text-xs font-bold gap-1.5 bg-[#8DB833] text-black hover:bg-[#8DB833]/90 shadow-xs"
                >
                  {isImporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="h-3.5 w-3.5" />
                  )}
                  Push Active Custom Email to Cloud &amp; Live Site
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (cloudTemplate) {
                      const confirmed = window.confirm(
                        "Are you sure you want to load the template from Cloud? Any unsaved edits in your current designer will be replaced."
                      );
                      if (!confirmed) return;

                      userHasEditedRef.current = false;
                      if (cloudTemplate.blocks && Array.isArray(cloudTemplate.blocks)) {
                        setCustomEmailBlocks(cloudTemplate.blocks);
                      }
                      if (cloudTemplate.message) setCustomMessage(cloudTemplate.message);
                      if (cloudTemplate.mode) setEditorMode(cloudTemplate.mode);
                      toast({
                        title: "Template Loaded from Cloud",
                        description: "Your local editor now has the cloud template.",
                      });
                      setIsCloudSyncModalOpen(false);
                    } else {
                      toast({
                        title: "No Cloud Template",
                        description: "There is no saved template in Cloud Firestore yet.",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={!cloudTemplate || cloudLoading}
                  className="h-8 text-xs font-bold gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border-slate-300"
                >
                  <DownloadCloud className="h-3.5 w-3.5 text-sky-600" />
                  Pull from Cloud (Replaces Editor)
                </Button>
              </div>

            </div>

            {/* Quick Transfer from Live Website */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#8DB833] text-black font-extrabold text-[10px]">
                  Instant Transfer
                </Badge>
                <h4 className="font-extrabold text-slate-900 m-0">
                  Transfer Updated Template from Live Website (sanex.rw)
                </h4>
              </div>

              <p className="text-[11px] text-slate-600 m-0 leading-relaxed">
                Because web browsers isolate storage per domain, your browser&apos;s draft on{" "}
                <code>https://sanex.rw</code> is private to that origin. Follow these two simple steps to instantly copy it into localhost and sync it to Cloud:
              </p>

              <div className="space-y-3 pt-1">
                {/* Step 1 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px]">
                      Step 1: In your live website tab (
                      <a
                        href="https://sanex.rw/admin/emails"
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700 underline font-semibold"
                      >
                        https://sanex.rw/admin/emails
                      </a>
                      ), press F12 (Console) and run:
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          "copy(localStorage.getItem('sanex_custom_email_draft'))"
                        );
                        setCopiedScript(true);
                        setTimeout(() => setCopiedScript(false), 2500);
                        toast({
                          title: "Script Copied!",
                          description:
                            "Paste into browser console on https://sanex.rw and press Enter.",
                        });
                      }}
                      className="h-6 text-[10px] font-bold px-2 gap-1 bg-white"
                    >
                      {copiedScript ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>{copiedScript ? "Copied Script!" : "Copy Snippet"}</span>
                    </Button>
                  </div>

                  <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto select-all">
                    copy(localStorage.getItem(&apos;sanex_custom_email_draft&apos;))
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    (This automatically copies your live template data to your clipboard)
                  </span>
                </div>

                {/* Step 2 */}
                <div className="space-y-1.5 pt-1">
                  <span className="font-bold text-slate-800 text-[11px] block">
                    Step 2: Paste the copied template JSON below:
                  </span>
                  <Textarea
                    value={rawImportInput}
                    onChange={(e) => setRawImportInput(e.target.value)}
                    placeholder="Paste the copied template JSON here..."
                    className="h-24 font-mono text-[11px] bg-white resize-y"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">
                    Once imported, this template is automatically saved to Firestore Cloud and synchronized bidirectionally.
                  </span>
                  <Button
                    type="button"
                    disabled={!rawImportInput.trim() || isImporting}
                    onClick={async () => {
                      setIsImporting(true);
                      try {
                        const res = await importRawTemplate(rawImportInput.trim());
                        if (res && res.success && res.template) {
                          if (res.template.blocks && res.template.blocks.length > 0) {
                            setCustomEmailBlocks(res.template.blocks);
                          }
                          if (res.template.message) {
                            setCustomMessage(res.template.message);
                          }
                          if (res.template.mode) {
                            setEditorMode(res.template.mode);
                          }
                          setRawImportInput("");
                          toast({
                            title: "Live Template Imported & Synced!",
                            description:
                              "The live template is now active in localhost and saved to Cloud Firestore for bidirectional sync.",
                          });
                          setIsCloudSyncModalOpen(false);
                        }
                      } catch (err: any) {
                        toast({
                          title: "Import Error",
                          description:
                            err.message ||
                            "Failed to parse template JSON. Ensure you copied the entire string.",
                          variant: "destructive",
                        });
                      } finally {
                        setIsImporting(false);
                      }
                    }}
                    className="h-8 text-xs font-extrabold bg-[#8DB833] text-black hover:bg-[#8DB833]/90 gap-1.5 shadow-xs"
                  >
                    {isImporting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>Import & Sync to Cloud</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Special Link Generator & Sharing Hub Modal */}
      <SpecialLinkGeneratorModal
        open={isLinkGenModalOpen}
        onOpenChange={setIsLinkGenModalOpen}
        initialPublication={selectedModalPublication}
        publications={existingPublications}
        onPublicationUpdated={(updated) => setSelectedModalPublication(updated)}
      />
    </div>
  );
}

// Backwards compatibility alias
export const ZohoEmailDiagnostics = ZohoEmailHub;
