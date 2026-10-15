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
  UserCheck
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

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function ZohoEmailHub() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"broadcast" | "test" | "health">("broadcast");
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);
  const [config, setConfig] = useState<ConfigStatus | null>(null);

  // Broadcast / Compose Form State
  const [toInput, setToInput] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");
  const [subject, setSubject] = useState("");
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

    setIsSending(true);
    setBroadcastResult(null);

    const startTime = Date.now();
    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          to: parsedRecipients.valid,
          cc: ccInput.trim() ? ccInput.trim().split(/[\s,;\n\r]+/).filter(Boolean) : undefined,
          bcc: bccInput.trim() ? bccInput.trim().split(/[\s,;\n\r]+/).filter(Boolean) : undefined,
          subject: subject.trim(),
          message: message.trim(),
          useBrandedTemplate,
          ctaText: ctaText.trim() || undefined,
          ctaUrl: ctaUrl.trim() || undefined,
          clientReference: `admin-broadcast-${Date.now()}`,
        }),
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
                SANEX Email Center & Broadcast Console
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
                Send official communications, broadcast announcements, and transaction notifications via verified domain (@sanex.rw)
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
              <Send className="h-3.5 w-3.5 text-primary" /> Compose & Broadcast
            </TabsTrigger>
            <TabsTrigger value="test" className="text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-700" /> Diagnostic Test
            </TabsTrigger>
            <TabsTrigger value="health" className="text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Info className="h-3.5 w-3.5 text-slate-700" /> Domain & Server Health
            </TabsTrigger>
          </TabsList>

          {/* =============================================================== */}
          {/* TAB 1: COMPOSE & BROADCAST (ACTUAL EMAILS & MULTI-RECIPIENTS)   */}
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
                  placeholder="client1@example.com, client2@sanex.rw, manager@enterprise.com"
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

              {/* Subject Line & Template Toggle */}
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

              {/* Action Buttons & Preview Trigger */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t">
                <div className="flex items-center gap-2">
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
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    Dispatched from verified sender &lt;{config?.senderEmail || "info@sanex.rw"}&gt;
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
                    </>
                  )}
                </Button>
              </div>

              {/* Live Preview Box */}
              {showPreview && (
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
