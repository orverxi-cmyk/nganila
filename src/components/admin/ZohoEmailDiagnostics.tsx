"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection } from "firebase/firestore";
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Loader2, 
  RefreshCw,
  ExternalLink,
  Info,
  Users,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  X,
  FileText,
  Bookmark,
  Code2,
  Copy,
  Layers,
  Building2,
  Hotel,
  GraduationCap,
  Hospital,
  School
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConfigStatus {
  configured: boolean;
  senderEmail?: string;
  senderName?: string;
  apiUrl?: string;
  authPrefix?: string;
}

interface DispatchResult {
  success: boolean;
  status: string;
  message: string;
  notice?: string;
  requestId?: string;
  requestIds?: string[];
  recipientCount?: number;
  batchCount?: number;
  code?: string;
  durationMs?: number;
  error?: string;
}

export interface ZohoAgentTemplate {
  id: string;
  name: string;
  subject: string;
  key: string;
  size: string;
  sector: string;
  description: string;
  icon: string;
}

// Official Zoho CPaaS Mail Agent templates from agent_1
export const ZOHO_AGENT_TEMPLATES: ZohoAgentTemplate[] = [
  {
    id: "zoho-general",
    name: "General - Institutions",
    subject: "Innovative Wastewater Management Solutions for your institution",
    key: "2d6f.7d30e4720195ecf6.k1.c87da360-c872-11f1-a620-5254009dfd0a.1a13eafd896",
    size: "5 KB",
    sector: "Institutions & Enterprises",
    description: "Commercial complexes, public bodies, and corporate headquarters.",
    icon: "building",
  },
  {
    id: "zoho-health",
    name: "Health Facilities",
    subject: "Wastewater Management Solutions for Health Facilities in Rwanda",
    key: "2d6f.7d30e4720195ecf6.k1.4e84d0b0-c872-11f1-a620-5254009dfd0a.1a13eacb93b",
    size: "4 KB",
    sector: "Hospitals & Clinics",
    description: "Clinical liquid waste containment, sanitary hygiene, and pathogen-safe disposal.",
    icon: "hospital",
  },
  {
    id: "zoho-campus",
    name: "Campus Admin",
    subject: "Wastewater Management Solutions for Campuses in Rwanda",
    key: "2d6f.7d30e4720195ecf6.k1.2941a170-c872-11f1-a620-5254009dfd0a.1a13eabc507",
    size: "4 KB",
    sector: "Universities & Colleges",
    description: "High-density student housing, decentralized treatment, and campus eco-sanitation.",
    icon: "graduation-cap",
  },
  {
    id: "zoho-schools",
    name: "Service School Admin",
    subject: "Wastewater Management Solutions for Schools in Rwanda",
    key: "2d6f.7d30e4720195ecf6.k1.37f838b0-c871-11f1-a620-5254009dfd0a.1a13ea597bb",
    size: "4 KB",
    sector: "Primary & Secondary Schools",
    description: "School pit latrine emptying, bio-digesters, and hygienic school sanitation solutions.",
    icon: "school",
  },
  {
    id: "zoho-hotel",
    name: "Service Email Hotel",
    subject: "Improve Your Hotel’s Sanitation with Reliable Wastewater Management Solutions",
    key: "2d6f.7d30e4720195ecf6.k1.f8f11ec1-c870-11f1-a620-5254009dfd0a.1a13ea3faaa",
    size: "10 KB",
    sector: "Hotels, Lodges & Resorts",
    description: "Grease trap servicing, odor elimination, and continuous hotel wastewater management.",
    icon: "hotel",
  },
];

interface EmailTemplatePreset {
  id: string;
  name: string;
  subject: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  isCustom?: boolean;
}

const PRESET_TEMPLATES: EmailTemplatePreset[] = [
  {
    id: "booking-confirmation",
    name: "Booking Request Confirmation",
    subject: "Service Request Received - SANEX Company Ltd",
    message: `Dear Valued Customer,\n\nWe have received your service request for liquid waste management and eco-sanitation. Our operations team is currently reviewing your designated schedule, address, and equipment requirements.\n\nYou will receive an update once dispatch confirmation is assigned to our field operations crew.\n\nThank you for choosing SANEX Company Ltd for sustainable wastewater solutions.`,
    ctaText: "View Our Services",
    ctaUrl: "https://sanex.rw/services",
  },
  {
    id: "service-reminder",
    name: "Upcoming Service Reminder",
    subject: "Upcoming Sanitation Service Reminder - SANEX Company Ltd",
    message: `Dear Valued Customer,\n\nThis is a friendly reminder that your scheduled liquid waste emptying / wastewater inspection service is slated for the upcoming operations window.\n\nPlease ensure that site access is available and that our vacuum tanker crew can safely park and access your collection point or septic infrastructure.\n\nShould you need to adjust your timing, please call our operations desk at +250 788 385 838 immediately.`,
    ctaText: "Contact Operations",
    ctaUrl: "tel:+250788385838",
  },
  {
    id: "maintenance-advisory",
    name: "Facility Maintenance Advisory",
    subject: "Facility Advisory: Preventive Maintenance & Septic Inspection",
    message: `Dear Facility Manager,\n\nOur engineering and environmental health teams are conducting scheduled preventive maintenance and decentralized sanitation audits across facilities in Kigali.\n\nRoutine maintenance prevents blockages, eliminates odor risks, and guarantees regulatory compliance with Rwandan sanitation standards.\n\nContact our desk today to schedule your facility's comprehensive inspection.`,
    ctaText: "Schedule Maintenance",
    ctaUrl: "https://sanex.rw/booking",
  },
  {
    id: "safe-disposal-cert",
    name: "Disposal Certification & Invoice Notice",
    subject: "Safe Waste Disposal Certification - SANEX Company Ltd",
    message: `Dear Valued Partner,\n\nWe are pleased to inform you that the liquid waste collected from your premises has been safely transported and disposed of at the designated municipal wastewater treatment site in full compliance with REMA & WASAC environmental guidelines.\n\nYour disposal documentation and billing statement have been processed. Please find your reference ID and payment instructions attached.\n\nThank you for your commitment to environmental sustainability.`,
    ctaText: "Download Receipt",
    ctaUrl: "https://sanex.rw",
  },
];

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function ZohoEmailHub() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"broadcast" | "test" | "health">("broadcast");
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);
  const [config, setConfig] = useState<ConfigStatus | null>(null);

  // Template Mode & Selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("zoho-general");
  const [isZohoKeyMode, setIsZohoKeyMode] = useState(true);
  const [selectedZohoTemplate, setSelectedZohoTemplate] = useState<ZohoAgentTemplate | null>(ZOHO_AGENT_TEMPLATES[0]);
  const [templateKey, setTemplateKey] = useState(ZOHO_AGENT_TEMPLATES[0].key);
  const [templateAlias, setTemplateAlias] = useState("");
  const [mergeVars, setMergeVars] = useState<{ key: string; value: string }[]>([
    { key: "institution_name", value: "" },
    { key: "contact_person", value: "" },
  ]);

  // Saved client-side custom templates
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplatePreset[]>([]);

  // Load custom templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sanex_admin_email_templates");
      if (stored) {
        setSavedTemplates(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Broadcast / Compose Form State
  const [toInput, setToInput] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");
  const [subject, setSubject] = useState(ZOHO_AGENT_TEMPLATES[0].subject);
  const [message, setMessage] = useState("");
  const [useBrandedTemplate, setUseBrandedTemplate] = useState(true);
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<DispatchResult | null>(null);

  // Diagnostic Test Form State
  const [testRecipient, setTestRecipient] = useState("");
  const [testSubject, setTestSubject] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<DispatchResult | null>(null);

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
    const completed = new Set<string>();

    (bookings || []).forEach((b: any) => {
      const email = (b.customerEmail || b.email || "").trim().toLowerCase();
      if (email && EMAIL_REGEX.test(email)) {
        all.add(email);
        const status = (b.status || "pending").toLowerCase();
        if (status === "confirmed") confirmed.add(email);
        else if (status === "pending") pending.add(email);
        else if (status === "completed") completed.add(email);
      }
    });

    return {
      all: Array.from(all),
      confirmed: Array.from(confirmed),
      pending: Array.from(pending),
      completed: Array.from(completed),
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

  // Set default recipient to current user's email once loaded
  useEffect(() => {
    if (user?.email && !testRecipient) {
      setTestRecipient(user.email);
    }
  }, [user?.email, testRecipient]);

  // Fetch current server-side configuration status
  const fetchConfig = async () => {
    setIsCheckingConfig(true);
    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetch("/api/email/test", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        setConfig({ configured: false });
      }
    } catch {
      setConfig({ configured: false });
    } finally {
      setIsCheckingConfig(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConfig();
    }
  }, [user]);

  // Template Selection Handler (handles both Zoho Agent Templates and Website Presets)
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);

    // 1. Check if it's one of the 5 Zoho Agent templates
    const zohoTemplate = ZOHO_AGENT_TEMPLATES.find((t) => t.id === templateId);
    if (zohoTemplate) {
      setIsZohoKeyMode(true);
      setSelectedZohoTemplate(zohoTemplate);
      setTemplateKey(zohoTemplate.key);
      setTemplateAlias("");
      setSubject(zohoTemplate.subject);
      toast({
        title: `Zoho Cloud Template Selected`,
        description: `Ready to dispatch "${zohoTemplate.name}" via Zoho CPaaS template key.`,
      });
      return;
    }

    // 2. Check if it's a manual key mode
    if (templateId === "zoho-manual") {
      setIsZohoKeyMode(true);
      setSelectedZohoTemplate(null);
      setTemplateKey("");
      setTemplateAlias("");
      return;
    }

    // 3. Custom blank email
    if (templateId === "custom") {
      setIsZohoKeyMode(false);
      setSelectedZohoTemplate(null);
      setSubject("");
      setMessage("");
      return;
    }

    // 4. Pre-built or saved website template
    const allPresets = [...PRESET_TEMPLATES, ...savedTemplates];
    const foundPreset = allPresets.find((p) => p.id === templateId);
    if (foundPreset) {
      setIsZohoKeyMode(false);
      setSelectedZohoTemplate(null);
      setSubject(foundPreset.subject);
      setMessage(foundPreset.message);
      setCtaText(foundPreset.ctaText || "");
      setCtaUrl(foundPreset.ctaUrl || "");
      toast({
        title: "Template Loaded",
        description: `Applied "${foundPreset.name}".`,
      });
    }
  };

  // Save current message as a reusable custom template
  const handleSaveCurrentAsTemplate = () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "Subject and Message Required",
        description: "Please enter a subject line and message before saving as a template.",
      });
      return;
    }

    const templateName = window.prompt("Enter a name for this reusable email template:", subject.slice(0, 30));
    if (!templateName || !templateName.trim()) return;

    const newTemplate: EmailTemplatePreset = {
      id: `custom-${Date.now()}`,
      name: templateName.trim(),
      subject: subject.trim(),
      message: message.trim(),
      ctaText: ctaText.trim() || undefined,
      ctaUrl: ctaUrl.trim() || undefined,
      isCustom: true,
    };

    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    try {
      localStorage.setItem("sanex_admin_email_templates", JSON.stringify(updated));
    } catch {
      // ignore
    }

    setSelectedTemplateId(newTemplate.id);
    setIsZohoKeyMode(false);
    toast({
      title: "Template Saved",
      description: `"${templateName.trim()}" is now saved in your template selector.`,
    });
  };

  // Audience quick-insert handler
  const handleAddAudience = (emails: string[]) => {
    if (!emails || emails.length === 0) {
      toast({ title: "No emails in this list", description: "No customer bookings matched this category." });
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
      toast({ title: "Already added", description: "All emails from this group are already in your recipient list." });
      return;
    }

    const updated = toInput.trim()
      ? `${toInput.trim()}, ${added.join(", ")}`
      : added.join(", ");
    setToInput(updated);
    toast({ title: `Added ${added.length} recipient(s)`, description: "Emails inserted into the To field." });
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    const updated = parsedRecipients.valid
      .filter((e) => e.toLowerCase() !== emailToRemove.toLowerCase())
      .join(", ");
    setToInput(updated);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "Key Copied", description: "Template Key copied to clipboard." });
  };

  // Merge Info helpers
  const handleAddMergeVar = () => {
    setMergeVars([...mergeVars, { key: "", value: "" }]);
  };

  const handleUpdateMergeVar = (index: number, field: "key" | "value", val: string) => {
    const next = [...mergeVars];
    next[index][field] = val;
    setMergeVars(next);
  };

  const handleRemoveMergeVar = (index: number) => {
    setMergeVars(mergeVars.filter((_, i) => i !== index));
  };

  // Handle Send Actual Email / Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (parsedRecipients.valid.length === 0) {
      toast({
        variant: "destructive",
        title: "Recipient Required",
        description: "Please specify at least one valid recipient email address.",
      });
      return;
    }

    if (parsedRecipients.invalid.length > 0) {
      toast({
        variant: "destructive",
        title: "Invalid Email Address",
        description: `Please remove or fix invalid entry: "${parsedRecipients.invalid[0]}"`,
      });
      return;
    }

    if (isZohoKeyMode) {
      if (!templateKey.trim() && !templateAlias.trim()) {
        toast({
          variant: "destructive",
          title: "Template Key Required",
          description: "Please select or enter a valid Zoho CPaaS Template Key.",
        });
        return;
      }
    } else {
      if (!subject.trim()) {
        toast({
          variant: "destructive",
          title: "Subject Required",
          description: "Please enter an email subject line.",
        });
        return;
      }

      if (!message.trim()) {
        toast({
          variant: "destructive",
          title: "Message Body Required",
          description: "Please enter the email body content.",
        });
        return;
      }
    }

    setIsSending(true);
    setBroadcastResult(null);

    // Build mergeInfo object if in Zoho Key mode
    const mergeInfoObj: Record<string, any> = {};
    if (isZohoKeyMode) {
      mergeVars.forEach((mv) => {
        if (mv.key.trim() && mv.value.trim()) {
          mergeInfoObj[mv.key.trim()] = mv.value.trim();
        }
      });
    }

    const startTime = Date.now();
    try {
      const token = user ? await user.getIdToken() : "";
      const payload: any = {
        to: parsedRecipients.valid,
        cc: ccInput.trim() ? ccInput.trim().split(/[\s,;\n\r]+/).filter(Boolean) : undefined,
        bcc: bccInput.trim() ? bccInput.trim().split(/[\s,;\n\r]+/).filter(Boolean) : undefined,
        clientReference: `admin-dispatch-${Date.now()}`,
      };

      if (isZohoKeyMode) {
        payload.templateKey = templateKey.trim() || undefined;
        payload.templateAlias = templateAlias.trim() || undefined;
        payload.subject = subject.trim() || undefined;
        if (Object.keys(mergeInfoObj).length > 0) {
          payload.mergeInfo = mergeInfoObj;
        }
      } else {
        payload.subject = subject.trim();
        payload.message = message.trim();
        payload.useBrandedTemplate = useBrandedTemplate;
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
      const durationMs = Date.now() - startTime;
      const resultData = { ...data, durationMs };
      setBroadcastResult(resultData);

      if (res.ok && data.success) {
        toast({
          title: "Email Dispatch Successful",
          description: `Dispatched to ${data.recipientCount || parsedRecipients.valid.length} recipient(s) via Zoho CPaaS!`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Dispatch Unsuccessful",
          description: data.error || data.message || "Failed to send email.",
        });
      }
    } catch (err: any) {
      setBroadcastResult({
        success: false,
        status: "network_error",
        message: err.message || "Failed to communicate with send endpoint.",
      });
      toast({
        variant: "destructive",
        title: "Network Error",
        description: err.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  // Handle Diagnostic Test Send
  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient.trim()) {
      toast({
        variant: "destructive",
        title: "Recipient Required",
        description: "Please enter a valid recipient email address.",
      });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipientEmail: testRecipient.trim(),
          customSubject: testSubject.trim() || undefined,
        }),
      });

      const data = await res.json();
      setTestResult(data);

      if (res.ok && data.success) {
        toast({
          title: "Test Email Dispatched",
          description: `Accepted by Zoho CPaaS (Req ID: ${data.requestId || "OK"})`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Dispatch Unsuccessful",
          description: data.error || data.message || "Failed to send test email.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        status: "network_error",
        message: err.message || "Network error communicating with test endpoint",
      });
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: err.message,
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <Card className="border bg-white shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-900 text-white p-5 border-b border-primary/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                SANEX Email Center &amp; Templates Console
                {isCheckingConfig ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                ) : config?.configured ? (
                  <Badge className="bg-primary text-black font-bold text-[10px]">
                    Zoho CPaaS Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-400 text-amber-300 font-bold text-[10px]">
                    Fallback Mode
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Dispatch official communications, broadcast campaigns, and Zoho CPaaS Mail Agent templates (@sanex.rw)
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchConfig}
              className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-8 gap-1.5"
              disabled={isCheckingConfig}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isCheckingConfig ? "animate-spin" : ""}`} /> Refresh Status
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="broadcast" className="text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Send className="h-3.5 w-3.5 text-primary" /> Compose &amp; Broadcast
            </TabsTrigger>
            <TabsTrigger value="test" className="text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-700" /> Diagnostic Test
            </TabsTrigger>
            <TabsTrigger value="health" className="text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Info className="h-3.5 w-3.5 text-slate-700" /> Domain &amp; Server Health
            </TabsTrigger>
          </TabsList>

          {/* =============================================================== */}
          {/* TAB 1: COMPOSE & BROADCAST WITH EMBEDDED ZOHO TEMPLATES         */}
          {/* =============================================================== */}
          <TabsContent value="broadcast" className="space-y-5 pt-3">
            <form onSubmit={handleSendBroadcast} className="space-y-5">
              {/* Recipient Audience Selection */}
              <div className="space-y-2 border rounded-xl p-4 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-primary" /> Recipients (To) *
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      Enter single or multiple addresses (comma, semicolon, or newline separated)
                    </span>
                  </div>

                  {/* Quick-add Audiences */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">Insert Group:</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2 font-bold"
                      onClick={() => handleAddAudience(clientAudiences.all)}
                    >
                      All Clients ({clientAudiences.all.length})
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2 font-bold text-green-700 border-green-200"
                      onClick={() => handleAddAudience(clientAudiences.confirmed)}
                    >
                      Confirmed ({clientAudiences.confirmed.length})
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2 font-bold text-amber-700 border-amber-200"
                      onClick={() => handleAddAudience(clientAudiences.pending)}
                    >
                      Pending ({clientAudiences.pending.length})
                    </Button>
                    {user?.email && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 font-bold"
                        onClick={() => handleAddAudience([user.email!])}
                      >
                        Self
                      </Button>
                    )}
                    {parsedRecipients.valid.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] px-1.5 text-muted-foreground hover:text-red-600"
                        onClick={() => setToInput("")}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                <Textarea
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  placeholder="client1@example.com, hospital.admin@moh.gov.rw, hotel.manager@sanex.rw"
                  rows={2}
                  className="font-mono text-xs bg-white resize-y min-h-[64px]"
                  disabled={isSending}
                />

                {/* Parsed Recipients Indicators */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Badge variant={parsedRecipients.valid.length > 0 ? "default" : "secondary"} className="text-[10px] font-bold">
                    {parsedRecipients.valid.length} Valid Recipient{parsedRecipients.valid.length === 1 ? "" : "s"}
                  </Badge>

                  {parsedRecipients.valid.slice(0, 6).map((email) => (
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

                  {parsedRecipients.valid.length > 6 && (
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      +{parsedRecipients.valid.length - 6} more
                    </span>
                  )}

                  {parsedRecipients.invalid.length > 0 && (
                    <Badge variant="destructive" className="text-[10px] font-bold">
                      {parsedRecipients.invalid.length} Invalid: {parsedRecipients.invalid[0]}
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

                {/* Optional CC / BCC Fields */}
                {showCcBcc && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t mt-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">CC Recipients</Label>
                      <Input
                        value={ccInput}
                        onChange={(e) => setCcInput(e.target.value)}
                        placeholder="cc1@sanex.rw, cc2@sanex.rw"
                        className="h-8 text-xs bg-white font-mono"
                        disabled={isSending}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">BCC Recipients</Label>
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

              {/* Template Master Selector */}
              <div className="border rounded-xl p-4 bg-slate-50/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-xs font-bold text-foreground">Select Email Template</div>
                      <div className="text-[11px] text-muted-foreground">
                        Choose your pre-configured Zoho CPaaS Cloud Template (agent_1) or compose a custom email
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsZohoKeyMode(!isZohoKeyMode)}
                      className={`h-7 text-[11px] font-bold gap-1.5 ${
                        isZohoKeyMode ? "bg-slate-900 text-white border-slate-900" : "bg-white"
                      }`}
                    >
                      <Code2 className="h-3 w-3" />
                      {isZohoKeyMode ? "Zoho Agent Template Mode" : "Website Composer Mode"}
                    </Button>
                  </div>
                </div>

                {/* Dropdown Selector */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                    Available Templates
                  </Label>
                  <Select value={selectedTemplateId} onValueChange={handleSelectTemplate}>
                    <SelectTrigger className="h-10 text-xs bg-white font-semibold shadow-sm">
                      <SelectValue placeholder="Choose a template..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {/* Section 1: Zoho Cloud Mail Agent Templates */}
                      <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary bg-slate-900 text-white rounded my-1">
                        Zoho CPaaS Cloud Templates (agent_1)
                      </div>
                      {ZOHO_AGENT_TEMPLATES.map((tmpl) => (
                        <SelectItem key={tmpl.id} value={tmpl.id} className="text-xs py-2">
                          <div className="flex items-center justify-between gap-4 w-full">
                            <div>
                              <div className="font-bold text-foreground flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-[#8DB833]" />
                                {tmpl.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {tmpl.sector} · {tmpl.size} HTML Template
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}

                      {/* Section 2: Website Pre-Built SANEX Presets */}
                      <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-t mt-2">
                        Website Operational Presets
                      </div>
                      {PRESET_TEMPLATES.map((tmpl) => (
                        <SelectItem key={tmpl.id} value={tmpl.id} className="text-xs">
                          {tmpl.name}
                        </SelectItem>
                      ))}

                      {/* Section 3: Custom & Manual */}
                      <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-t mt-2">
                        Other Options
                      </div>
                      <SelectItem value="custom" className="text-xs font-semibold">
                        ✏️ Custom Blank Email (Manual Composer)
                      </SelectItem>
                      <SelectItem value="zoho-manual" className="text-xs font-semibold font-mono">
                        🔑 Enter Custom Zoho Template Key...
                      </SelectItem>

                      {savedTemplates.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-t mt-2">
                            Saved Templates ({savedTemplates.length})
                          </div>
                          {savedTemplates.map((tmpl) => (
                            <SelectItem key={tmpl.id} value={tmpl.id} className="text-xs">
                              {tmpl.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* ACTIVE ZOHO CLOUD TEMPLATE CARD */}
                {isZohoKeyMode && selectedZohoTemplate && (
                  <div className="border border-[#8DB833]/40 rounded-xl p-4 bg-[#8DB833]/5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#8DB833]/20 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-[#8DB833] text-black font-extrabold flex items-center justify-center text-xs">
                          {selectedZohoTemplate.size}
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-foreground flex items-center gap-2">
                            {selectedZohoTemplate.name}
                            <Badge className="bg-[#8DB833] text-black font-bold text-[9px]">
                              Cloud Design Active
                            </Badge>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Sector: <strong>{selectedZohoTemplate.sector}</strong> · {selectedZohoTemplate.description}
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyKey(selectedZohoTemplate.key)}
                        className="h-7 text-[10px] font-mono gap-1 bg-white"
                      >
                        <Copy className="h-3 w-3" /> Copy Key
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded bg-white border">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground block">
                          Zoho Template Key
                        </span>
                        <code className="text-[10px] font-bold text-slate-800 break-all block">
                          {selectedZohoTemplate.key}
                        </code>
                      </div>
                      <div className="p-2.5 rounded bg-white border">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground block">
                          Template Source &amp; Mail Agent
                        </span>
                        <span className="text-[11px] text-slate-700 block font-semibold">
                          Zoho CPaaS &middot; Agent Alias: <code>7c6dc6fcbb934ccb</code> (agent_1)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-foreground">Subject Line Override (Optional)</Label>
                      <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject line configured on template"
                        className="h-9 text-xs bg-white"
                        disabled={isSending}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Pre-filled from your Zoho template. You can edit this subject or leave it as is.
                      </p>
                    </div>

                    {/* Optional Merge Variables for Template */}
                    <div className="space-y-2 pt-2 border-t border-[#8DB833]/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            Dynamic Merge Variables (Optional)
                          </Label>
                          <span className="text-[10px] text-muted-foreground block">
                            If your Zoho HTML has Mustache tags like &#123;&#123;institution_name&#125;&#125;, enter their values here.
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddMergeVar}
                          className="h-6 text-[10px] font-bold gap-1 bg-white"
                        >
                          <Plus className="h-3 w-3" /> Add Tag
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {mergeVars.map((mv, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              value={mv.key}
                              onChange={(e) => handleUpdateMergeVar(idx, "key", e.target.value)}
                              placeholder="Tag name (e.g. institution_name)"
                              className="h-8 font-mono text-xs bg-white w-1/3"
                              disabled={isSending}
                            />
                            <Input
                              value={mv.value}
                              onChange={(e) => handleUpdateMergeVar(idx, "value", e.target.value)}
                              placeholder="Value to substitute in email"
                              className="h-8 text-xs bg-white flex-1"
                              disabled={isSending}
                            />
                            {mergeVars.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMergeVar(idx)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual Zoho Template Key Entry (when user selects 'zoho-manual') */}
                {isZohoKeyMode && !selectedZohoTemplate && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-foreground">Custom Template Key *</Label>
                        <Input
                          value={templateKey}
                          onChange={(e) => setTemplateKey(e.target.value)}
                          placeholder="e.g. 2d6f.7d30e4720195ecf6.k1..."
                          className="h-9 font-mono text-xs bg-white"
                          disabled={isSending}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-foreground">Subject Line Override (Optional)</Label>
                        <Input
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Custom subject line"
                          className="h-9 text-xs bg-white"
                          disabled={isSending}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Standard Subject & Message Inputs (when in Website Composer Mode) */}
              {!isZohoKeyMode && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Subject Line *
                      </Label>
                      <Input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Scheduled Service Reminder: SANEX Liquid Waste Management"
                        className="h-9 text-xs"
                        disabled={isSending}
                      />
                    </div>

                    <div className="space-y-1.5 border rounded-lg p-2.5 bg-slate-50 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-foreground">SANEX Branded Layout</div>
                        <div className="text-[10px] text-muted-foreground">Header, logo &amp; footer wrapper</div>
                      </div>
                      <Switch
                        checked={useBrandedTemplate}
                        onCheckedChange={setUseBrandedTemplate}
                        disabled={isSending}
                      />
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Message Content *
                      </Label>
                      <span className="text-[11px] text-muted-foreground">
                        Separate paragraphs with a blank line. Links are automatically styled.
                      </span>
                    </div>
                    <Textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Dear Valued Customer,\n\nWe are writing to update you on our upcoming eco-sanitation service schedule for your facility...\n\nPlease let us know if you require any specific assistance from our operations team.\n\nThank you,\nSANEX Company Ltd Operations Team`}
                      rows={6}
                      className="text-xs leading-relaxed font-sans resize-y"
                      disabled={isSending}
                    />
                  </div>

                  {/* Optional Call to Action Button */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-xl p-3 bg-slate-50/50">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Optional Action Button Text
                      </Label>
                      <Input
                        type="text"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        placeholder="e.g. View Service Portal or Confirm Schedule"
                        className="h-8 text-xs bg-white"
                        disabled={isSending}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Action Button URL
                      </Label>
                      <Input
                        type="url"
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        placeholder="https://sanex.rw/services"
                        className="h-8 text-xs bg-white"
                        disabled={isSending}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSaveCurrentAsTemplate}
                      className="h-8 text-[11px] font-bold gap-1 text-slate-700 hover:text-black"
                    >
                      <Bookmark className="h-3.5 w-3.5 text-primary" /> Save Current as Custom Template
                    </Button>
                  </div>
                </>
              )}

              {/* Action Buttons & Preview Trigger */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t">
                <div className="flex items-center gap-2">
                  {!isZohoKeyMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                      className="h-9 text-xs font-bold gap-1.5"
                    >
                      {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                      {showPreview ? "Hide Preview" : "Preview Email Layout"}
                    </Button>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    Sender: &lt;{config?.senderEmail || "info@sanex.rw"}&gt;
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={isSending || parsedRecipients.valid.length === 0}
                  className="w-full sm:w-auto h-9 text-xs font-bold bg-primary text-black hover:bg-primary/90 gap-2 shadow-sm"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Transmitting to Zoho CPaaS...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Send to {parsedRecipients.valid.length} Recipient{parsedRecipients.valid.length === 1 ? "" : "s"}
                      {isZohoKeyMode && selectedZohoTemplate ? ` (${selectedZohoTemplate.name})` : ""}
                    </>
                  )}
                </Button>
              </div>

              {/* Live Preview Box (for website composer mode) */}
              {showPreview && !isZohoKeyMode && (
                <div className="border rounded-xl p-4 bg-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary" /> Live Responsive Email Preview
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-white">
                      From: {config?.senderName || "SANEX Company Ltd"} &lt;{config?.senderEmail || "info@sanex.rw"}&gt;
                    </Badge>
                  </div>

                  <div className="max-w-[600px] mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
                    {useBrandedTemplate ? (
                      <>
                        <div className="bg-slate-900 p-5 border-b-4 border-primary text-left">
                          <h1 className="text-base font-extrabold text-primary uppercase tracking-wide m-0">
                            SANEX <span className="text-white font-normal">Company Ltd</span>
                          </h1>
                          <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-1">
                            Sustainable Liquid Waste Management · Rwanda
                          </p>
                        </div>
                        <div className="p-6 space-y-4 text-sm text-slate-700 leading-relaxed">
                          {subject && <h2 className="text-base font-bold text-slate-900 m-0">{subject}</h2>}
                          {message ? (
                            message
                              .split(/\n\s*\n/)
                              .map((paragraph, i) => (
                                <p key={i} className="m-0 text-slate-700 leading-relaxed">
                                  {paragraph}
                                </p>
                              ))
                          ) : (
                            <p className="italic text-muted-foreground">Type your message above to preview body...</p>
                          )}

                          {ctaText && ctaUrl && (
                            <div className="pt-2 pb-2 text-center">
                              <span className="inline-block bg-[#8DB833] text-black font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-sm">
                                {ctaText}
                              </span>
                            </div>
                          )}

                          <div className="border-t border-slate-200 pt-3 text-xs text-slate-500">
                            For operational inquiries, call <strong>+250 788 385 838</strong> or email{" "}
                            <strong>info@sanex.rw</strong>.
                          </div>
                        </div>
                        <div className="bg-slate-100 p-4 text-center border-t border-slate-200 text-[11px] text-slate-500">
                          <div className="font-bold text-slate-800">SANEX Company Ltd</div>
                          <div>Kigali, Rwanda · Phone: +250 788 385 838 · Email: info@sanex.rw</div>
                        </div>
                      </>
                    ) : (
                      <div className="p-6 text-sm text-slate-800 space-y-3 font-sans">
                        {subject && <div className="font-bold text-base border-b pb-2">{subject}</div>}
                        <div className="whitespace-pre-wrap">{message || "Type message to preview..."}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>

            {/* Broadcast Outcome Report */}
            {broadcastResult && (
              <div
                className={`rounded-xl border p-4 text-xs space-y-2.5 transition-all ${
                  broadcastResult.success
                    ? "bg-[#8DB833]/10 border-[#8DB833]/40 text-[#0f172a]"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {broadcastResult.success ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-[#8DB833] shrink-0" />
                        <span>Accepted for Delivery Queue by Zoho CPaaS</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                        <span>Dispatch Unsuccessful</span>
                      </>
                    )}
                  </div>
                  {broadcastResult.durationMs && (
                    <Badge variant="outline" className="text-[10px] bg-white">
                      {broadcastResult.durationMs}ms
                    </Badge>
                  )}
                </div>

                <p className="text-xs leading-relaxed">{broadcastResult.message || broadcastResult.error}</p>

                {broadcastResult.requestIds && broadcastResult.requestIds.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 font-mono text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                        Zoho Request ID(s)
                      </span>
                      <span className="font-bold truncate block">{broadcastResult.requestIds.join(", ")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                        Recipients Queued
                      </span>
                      <span className="font-bold">{broadcastResult.recipientCount || parsedRecipients.valid.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                        Batches Executed
                      </span>
                      <span className="font-bold">{broadcastResult.batchCount || 1}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* =============================================================== */}
          {/* TAB 2: SINGLE DIAGNOSTIC TEST (PRESERVES EXISTING TOOL)          */}
          {/* =============================================================== */}
          <TabsContent value="test" className="space-y-4 pt-3">
            <form onSubmit={handleSendTest} className="border rounded-xl p-4 bg-muted/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" /> Send Diagnostic Test Email
                </h3>
                <span className="text-[11px] text-muted-foreground">Privileged Admin Verification</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Recipient Email Address *
                  </Label>
                  <Input
                    type="email"
                    required
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="recipient@example.com"
                    className="h-9 text-xs"
                    disabled={isSendingTest}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Destination mailbox to receive the verification dispatch.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Custom Subject (Optional)
                  </Label>
                  <Input
                    type="text"
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                    placeholder="Zoho CPaaS Test Dispatch"
                    className="h-9 text-xs"
                    disabled={isSendingTest}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Leave blank to use the default automated test subject.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Rate limited to 5 test dispatches/min to protect sender reputation
                </div>
                <Button
                  type="submit"
                  disabled={isSendingTest}
                  className="w-full sm:w-auto h-9 text-xs font-bold bg-primary text-black hover:bg-primary/90 gap-2"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transmitting to Zoho...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> Transmit Test Email
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Test Result Inspection Box */}
            {testResult && (
              <div
                className={`rounded-xl border p-4 text-xs space-y-2.5 transition-all ${
                  testResult.success
                    ? "bg-[#8DB833]/10 border-[#8DB833]/40 text-[#0f172a]"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {testResult.success ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-[#8DB833] shrink-0" />
                        <span>Dispatched Successfully (Accepted by Zoho CPaaS)</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                        <span>Transmission Failed</span>
                      </>
                    )}
                  </div>
                  {testResult.durationMs && (
                    <Badge variant="outline" className="text-[10px] bg-white">
                      {testResult.durationMs}ms latency
                    </Badge>
                  )}
                </div>

                <p className="text-xs leading-relaxed">{testResult.message || testResult.error}</p>

                {testResult.notice && (
                  <div className="flex items-start gap-1.5 p-2 rounded bg-white/70 border border-slate-200 text-[11px] text-slate-700">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{testResult.notice}</span>
                  </div>
                )}

                {testResult.requestId && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 font-mono text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                        Zoho Request ID
                      </span>
                      <span className="font-bold">{testResult.requestId}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                        Response Code
                      </span>
                      <span className="font-bold">{testResult.code || "EM_104"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                        Recipient
                      </span>
                      <span className="font-bold">{testRecipient}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* =============================================================== */}
          {/* TAB 3: DOMAIN & INFRASTRUCTURE HEALTH                           */}
          {/* =============================================================== */}
          <TabsContent value="health" className="space-y-4 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border bg-slate-50">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Provider Status
                </div>
                <div className="font-bold flex items-center gap-1.5 text-foreground">
                  {config?.configured ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-[#8DB833]" />
                      <span>Zoho CPaaS Configured</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span>Token Missing in Environment</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  API Key secured in Google Secret Manager (<code>ZOHO_CPAAS_SEND_MAIL_TOKEN</code>).
                </p>
              </div>

              <div className="p-3.5 rounded-xl border bg-slate-50">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Verified Sender Identity
                </div>
                <div className="font-bold text-foreground truncate">
                  {config?.senderName || "SANEX Company Ltd"}
                </div>
                <div className="text-[11px] text-muted-foreground truncate mt-0.5 font-mono">
                  &lt;{config?.senderEmail || "info@sanex.rw"}&gt;
                </div>
              </div>

              <div className="p-3.5 rounded-xl border bg-slate-50">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  API Endpoint &amp; Auth
                </div>
                <div className="font-mono text-[11px] text-foreground truncate">
                  {config?.apiUrl || "https://cpaas.zoho.com/v1.1/email"}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Auth: Zoho-enczapikey
                </div>
              </div>
            </div>

            {/* Active Mail Agent Templates Summary */}
            <div className="border rounded-xl p-4 bg-white space-y-3 text-xs">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Configured Zoho Mail Agent Templates (agent_1)
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">5 Templates Synced</Badge>
              </div>
              <div className="divide-y border rounded-lg overflow-hidden">
                {ZOHO_AGENT_TEMPLATES.map((tmpl) => (
                  <div key={tmpl.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{tmpl.name}</div>
                      <div className="text-[11px] text-muted-foreground italic">&ldquo;{tmpl.subject}&rdquo;</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">Key: {tmpl.key}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="bg-slate-100 text-slate-800 text-[9px]">{tmpl.size}</Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          handleSelectTemplate(tmpl.id);
                          setActiveTab("broadcast");
                        }}
                        className="h-7 text-[10px] font-bold text-primary hover:underline"
                      >
                        Use in Broadcast &rarr;
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DNS & Domain Verification Summary */}
            <div className="border rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> DNS &amp; Sender Reputation Guidance (@sanex.rw)
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                To ensure high inbox delivery and avoid recipient spam filters, confirm your domain DNS records:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded bg-white border border-slate-200">
                  <span className="font-bold block text-slate-800 text-[10px] uppercase">SPF Record</span>
                  <span className="text-slate-600">v=spf1 include:zeptomail.net ~all</span>
                </div>
                <div className="p-2.5 rounded bg-white border border-slate-200">
                  <span className="font-bold block text-slate-800 text-[10px] uppercase">DKIM Signature</span>
                  <span className="text-slate-600">Configured in Zoho CPaaS domain settings</span>
                </div>
              </div>
            </div>

            {/* Documentation & Help Link */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
              <span>Official Zoho CPaaS API Documentation</span>
              <a
                href="https://www.zoho.com/cpaas/help/api/email-sending.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-bold inline-flex items-center gap-1"
              >
                zoho.com/cpaas/help/api/email-sending.html <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Backwards compatibility alias
export const ZohoEmailDiagnostics = ZohoEmailHub;
