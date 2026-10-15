"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection } from "firebase/firestore";
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
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ZohoContactsImporter } from "./ZohoContactsImporter";

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
  {
    id: "custom",
    title: "Custom Message",
    sector: "Tailored Communication",
    subject: "",
    isCustom: true,
    description: "Compose a personalized announcement, follow-up, or custom email from scratch.",
    icon: PenTool,
  },
];

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function ZohoEmailHub() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  // Selected Campaign / Template (defaults to Hotels)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("hotel");
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

  // When campaign selection changes, update subject line
  const handleSelectCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setLastDispatchSuccess(null);
    const campaign = CAMPAIGN_TEMPLATES.find((c) => c.id === campaignId);
    if (campaign) {
      if (!campaign.isCustom) {
        setSubject(campaign.subject);
      } else {
        setSubject("");
      }
    }
  };

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
      hotel: [],
      health: [],
      campus: [],
      schools: [],
      general: [],
      other: [],
    };
    (rawContacts || []).forEach((c: any) => {
      const email = (c.email || "").trim().toLowerCase();
      if (email && EMAIL_REGEX.test(email)) {
        map.all.push(email);
        const s = c.sector || "general";
        if (map[s]) map[s].push(email);
        else map.general.push(email);
      }
    });
    return map;
  }, [rawContacts]);

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

    try {
      const token = user ? await user.getIdToken() : "";
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
        setLastDispatchSuccess({
          count: data.recipientCount || parsedRecipients.valid.length,
          title: selectedCampaign.title,
        });
        toast({
          title: "Emails Dispatched Successfully",
          description: `Delivered to ${data.recipientCount || parsedRecipients.valid.length} recipient(s) from info@sanex.rw.`,
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

  return (
    <div className="space-y-6">
      {/* Executive Card Container */}
      <Card className="border bg-white shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-900 text-white p-6 border-b border-primary/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  Client Email Communications
                  <Badge className="bg-primary text-black font-extrabold text-[10px] tracking-wide">
                    info@sanex.rw
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-300">
                  Send targeted sector outreach campaigns or direct messages to customers across Rwanda
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs py-1 px-3 bg-slate-800/50">
                Verified Domain: sanex.rw
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleSend} className="space-y-6">
            {/* Step 1: Campaign & Template Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Step 1: Select Email Campaign</h3>
                  <p className="text-xs text-muted-foreground">
                    Choose one of your prepared sector campaigns, or compose a custom email
                  </p>
                </div>
              </div>

              {/* Visual Campaign Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CAMPAIGN_TEMPLATES.map((camp) => {
                  const Icon = camp.icon;
                  const isSelected = selectedCampaignId === camp.id;
                  return (
                    <button
                      key={camp.id}
                      type="button"
                      onClick={() => handleSelectCampaign(camp.id)}
                      className={`text-left p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            isSelected ? "bg-primary text-black" : "bg-slate-100 text-slate-700"
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {isSelected && (
                            <span className="h-5 w-5 rounded-full bg-primary text-black flex items-center justify-center">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-xs text-foreground mt-2">{camp.title}</div>
                        <div className="text-[11px] text-muted-foreground leading-snug">{camp.description}</div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
                        {camp.sector}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Campaign Info Banner */}
              {!selectedCampaign.isCustom && (
                <div className="p-3.5 rounded-xl border bg-slate-50 text-xs space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#8DB833]" />
                    Ready to send: {selectedCampaign.title}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    This email uses the official SANEX HTML layout designed specifically for {selectedCampaign.sector}.
                  </p>
                </div>
              )}
            </div>

            {/* Step 2: Subject & Message Customization */}
            <div className="space-y-3 pt-2 border-t">
              <h3 className="text-sm font-bold text-foreground">
                Step 2: Message Details
              </h3>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Email Subject Line *</Label>
                <Input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject line..."
                  className="h-10 text-xs"
                  disabled={isSending}
                />
              </div>

              {/* Recipient Organization Name (for campaigns) */}
              {!selectedCampaign.isCustom && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">
                    Optional Organization or Contact Name
                  </Label>
                  <Input
                    type="text"
                    value={recipientOrgName}
                    onChange={(e) => setRecipientOrgName(e.target.value)}
                    placeholder="e.g. Kigali Serena Hotel, King Faisal Hospital, etc."
                    className="h-9 text-xs"
                    disabled={isSending}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Personalizes the greeting in the template if applicable.
                  </p>
                </div>
              )}

              {/* Custom Message Fields (only visible when 'Custom Message' is chosen) */}
              {selectedCampaign.isCustom && (
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground">Email Content *</Label>
                      <span className="text-[11px] text-muted-foreground">
                        Separate paragraphs with blank lines
                      </span>
                    </div>
                    <Textarea
                      required
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Type your message here..."
                      rows={6}
                      className="text-xs leading-relaxed"
                      disabled={isSending}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50">
                    <div>
                      <div className="text-xs font-bold text-foreground">Apply SANEX Official Design</div>
                      <div className="text-[10px] text-muted-foreground">
                        Wraps email with SANEX header banner, phone +250 788 385 838, and registered address footer
                      </div>
                    </div>
                    <Switch
                      checked={useBrandedDesign}
                      onCheckedChange={setUseBrandedDesign}
                      disabled={isSending}
                    />
                  </div>

                  {/* Optional Action Button */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-xl p-3 bg-slate-50/50">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Optional Action Button Label
                      </Label>
                      <Input
                        type="text"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        placeholder="e.g. View Service Portal or Schedule Call"
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
                </div>
              )}
            </div>

            {/* Step 3: Recipients (Send To) */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Step 3: Select Recipients</h3>
                  <p className="text-xs text-muted-foreground">
                    Enter email addresses separated by commas or new lines, or choose a client group
                  </p>
                </div>

                {/* Quick Add Audiences (Sector Address Book & Bookings) */}
                <div className="flex flex-col gap-2">
                  {/* Row 1: Sector Address Book */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">Saved Contacts:</span>
                    
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={`h-6 text-[10px] px-2 font-bold gap-1 transition-all ${
                        selectedCampaignId === "hotel"
                          ? "bg-primary text-black border-primary ring-1 ring-primary"
                          : "bg-white text-slate-700"
                      }`}
                      onClick={() => handleAddAudience(sectorContacts.hotel, "Hotels & Lodges")}
                    >
                      <Hotel className="h-3 w-3" /> Hotels ({sectorContacts.hotel.length})
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={`h-6 text-[10px] px-2 font-bold gap-1 transition-all ${
                        selectedCampaignId === "health"
                          ? "bg-primary text-black border-primary ring-1 ring-primary"
                          : "bg-white text-slate-700"
                      }`}
                      onClick={() => handleAddAudience(sectorContacts.health, "Health Facilities")}
                    >
                      <Hospital className="h-3 w-3" /> Health ({sectorContacts.health.length})
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={`h-6 text-[10px] px-2 font-bold gap-1 transition-all ${
                        selectedCampaignId === "campus"
                          ? "bg-primary text-black border-primary ring-1 ring-primary"
                          : "bg-white text-slate-700"
                      }`}
                      onClick={() => handleAddAudience(sectorContacts.campus, "Campuses")}
                    >
                      <GraduationCap className="h-3 w-3" /> Campuses ({sectorContacts.campus.length})
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={`h-6 text-[10px] px-2 font-bold gap-1 transition-all ${
                        selectedCampaignId === "schools"
                          ? "bg-primary text-black border-primary ring-1 ring-primary"
                          : "bg-white text-slate-700"
                      }`}
                      onClick={() => handleAddAudience(sectorContacts.schools, "Schools")}
                    >
                      <School className="h-3 w-3" /> Schools ({sectorContacts.schools.length})
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={`h-6 text-[10px] px-2 font-bold gap-1 transition-all ${
                        selectedCampaignId === "general"
                          ? "bg-primary text-black border-primary ring-1 ring-primary"
                          : "bg-white text-slate-700"
                      }`}
                      onClick={() => handleAddAudience(sectorContacts.general, "General")}
                    >
                      <Building2 className="h-3 w-3" /> General ({sectorContacts.general.length})
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2 font-bold bg-white text-slate-700"
                      onClick={() => handleAddAudience(sectorContacts.all, "All Address Book")}
                    >
                      All Saved ({sectorContacts.all.length})
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

                  {/* Row 2: Website Bookings Audiences */}
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

              {/* Recipient Status Chips */}
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

              {/* Optional CC/BCC */}
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

            {/* Step 4: Dispatch Action */}
            <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {selectedCampaign.isCustom && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="h-9 text-xs font-bold gap-1.5"
                  >
                    {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                    {showPreview ? "Hide Preview" : "Preview Layout"}
                  </Button>
                )}

                <button
                  type="button"
                  onClick={handleSendTestToSelf}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Send test copy to myself first
                </button>
              </div>

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

            {/* Preview Box for Custom Message */}
            {showPreview && selectedCampaign.isCustom && (
              <div className="border rounded-xl p-4 bg-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" /> Email Layout Preview
                  </span>
                  <span>From: SANEX Company Ltd &lt;info@sanex.rw&gt;</span>
                </div>

                <div className="max-w-[600px] mx-auto bg-white rounded-xl shadow border p-6 space-y-3 text-xs leading-relaxed text-slate-800">
                  {subject && <h2 className="text-base font-bold text-slate-900 border-b pb-2">{subject}</h2>}
                  <div className="whitespace-pre-wrap">{customMessage || "Type message content above to preview..."}</div>
                  {ctaText && ctaUrl && (
                    <div className="pt-3 text-center">
                      <span className="inline-block bg-[#8DB833] text-black font-extrabold text-xs px-5 py-2 rounded-lg">
                        {ctaText}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Success Card */}
            {lastDispatchSuccess && (
              <div className="p-4 rounded-xl border border-[#8DB833]/40 bg-[#8DB833]/10 text-[#0f172a] space-y-1">
                <div className="font-extrabold text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#8DB833]" />
                  Campaign Dispatched Successfully
                </div>
                <p className="text-xs text-slate-700">
                  <strong>{lastDispatchSuccess.title}</strong> was successfully dispatched to{" "}
                  <strong>{lastDispatchSuccess.count} recipient(s)</strong> from{" "}
                  <strong>info@sanex.rw</strong>.
                </p>
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
    </div>
  );
}

// Backwards compatibility alias
export const ZohoEmailDiagnostics = ZohoEmailHub;
