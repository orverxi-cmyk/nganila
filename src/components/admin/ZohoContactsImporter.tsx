"use client";

import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  Upload,
  FileSpreadsheet,
  FileText,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  Hotel,
  Hospital,
  GraduationCap,
  School,
  Building2,
  Users,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { doc, writeBatch, arrayUnion } from "firebase/firestore";
import {
  ContactSector,
  SECTOR_CONFIG,
  ParsedContact,
  parseSpreadsheetContacts,
  parseRawTextContacts,
} from "@/lib/contacts-parser";
import { useContactGroups } from "@/hooks/use-contact-groups";

interface ZohoContactsImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSector?: ContactSector;
  onImportComplete?: (count: number) => void;
}

export function ZohoContactsImporter({
  open,
  onOpenChange,
  defaultSector = "hotel",
  onImportComplete,
}: ZohoContactsImporterProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const { groups, getGroupName } = useContactGroups();

  const [activeTab, setActiveTab] = useState<"file" | "paste" | "single">("file");
  const [targetSector, setTargetSector] = useState<ContactSector>(defaultSector);

  // File Upload State
  const [fileName, setFileName] = useState<string>("");
  const [parsedList, setParsedList] = useState<ParsedContact[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  // Paste Text State
  const [pasteText, setPasteText] = useState("");

  // Single Contact State
  const [singleName, setSingleName] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [singleOrg, setSingleOrg] = useState("");
  const [singlePhone, setSinglePhone] = useState("");

  // Saving State
  const [isSaving, setIsSaving] = useState(false);

  // Reset when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setTargetSector(defaultSector);
      setParsedList([]);
      setFileName("");
      setPasteText("");
    }
  }, [open, defaultSector]);

  // Handle File Input (.xlsx, .csv, .xls)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const { contacts, duplicatesSkipped } = parseSpreadsheetContacts(buffer, targetSector);

      if (contacts.length === 0) {
        toast({
          variant: "destructive",
          title: "No Contacts Found",
          description: "Could not find valid email addresses in this file. Please verify format.",
        });
        setParsedList([]);
      } else {
        setParsedList(contacts);
        toast({
          title: `Parsed ${contacts.length} Contact${contacts.length === 1 ? "" : "s"}`,
          description: duplicatesSkipped > 0 ? `${duplicatesSkipped} duplicate emails skipped.` : undefined,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "File Parse Error",
        description: err.message || "Failed to process the uploaded file.",
      });
      setParsedList([]);
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Paste Parse
  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    const { contacts, duplicatesSkipped } = parseRawTextContacts(pasteText, targetSector);

    if (contacts.length === 0) {
      toast({
        variant: "destructive",
        title: "No Valid Emails Found",
        description: "Please check that email addresses are formatted correctly.",
      });
    } else {
      setParsedList(contacts);
      toast({
        title: `Parsed ${contacts.length} Contact${contacts.length === 1 ? "" : "s"}`,
        description: duplicatesSkipped > 0 ? `${duplicatesSkipped} duplicate emails skipped.` : undefined,
      });
    }
  };

  // Remove item from preview list
  const handleRemovePreview = (index: number) => {
    setParsedList((prev) => prev.filter((_, i) => i !== index));
  };

  // Change sector for all preview items
  const handleApplySectorToAll = (sector: ContactSector) => {
    setTargetSector(sector);
    setParsedList((prev) => prev.map((c) => ({ ...c, sector })));
  };

  // Save parsed list to Firestore
  const handleSaveBatch = async () => {
    if (!db) {
      toast({ variant: "destructive", title: "Database Unavailable" });
      return;
    }

    if (parsedList.length === 0) {
      toast({ variant: "destructive", title: "No contacts to save" });
      return;
    }

    setIsSaving(true);
    try {
      const now = Date.now();
      // Chunk into batches of 450 (Firestore limit is 500 operations per batch)
      const CHUNK_SIZE = 450;
      let savedCount = 0;

      for (let i = 0; i < parsedList.length; i += CHUNK_SIZE) {
        const chunk = parsedList.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);

        chunk.forEach((c) => {
          // Use safe sanitized email as doc ID to prevent duplicates
          const safeId = c.email.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
          const ref = doc(db, "client_contacts", safeId);
          const finalSector = c.sector || targetSector;
          batch.set(
            ref,
            {
              id: safeId,
              name: c.name || c.email.split("@")[0],
              email: c.email.toLowerCase(),
              organization: c.organization || "",
              phone: c.phone || "",
              sector: finalSector,
              sectors: arrayUnion(finalSector),
              source: fileName ? "zoho_import" : "pasted_list",
              updatedAt: now,
              createdAt: now,
            },
            { merge: true }
          );
        });

        await batch.commit();
        savedCount += chunk.length;
      }

      toast({
        title: "Contacts Imported Successfully",
        description: `Saved ${savedCount} contact(s) under "${getGroupName(targetSector)}".`,
      });

      if (onImportComplete) {
        onImportComplete(savedCount);
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: err.message || "Failed to write contacts to database.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save single contact
  const handleSaveSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    const email = singleEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast({ variant: "destructive", title: "Valid email required" });
      return;
    }

    setIsSaving(true);
    try {
      const safeId = email.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const ref = doc(db, "client_contacts", safeId);
      const batch = writeBatch(db);
      const now = Date.now();

      batch.set(
        ref,
        {
          id: safeId,
          name: singleName.trim() || email.split("@")[0],
          email,
          organization: singleOrg.trim(),
          phone: singlePhone.trim(),
          sector: targetSector,
          sectors: arrayUnion(targetSector),
          source: "manual",
          updatedAt: now,
          createdAt: now,
        },
        { merge: true }
      );

      await batch.commit();

      toast({
        title: "Contact Saved",
        description: `${email} added to ${getGroupName(targetSector)}.`,
      });

      setSingleName("");
      setSingleEmail("");
      setSingleOrg("");
      setSinglePhone("");

      if (onImportComplete) onImportComplete(1);
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to Save Contact",
        description: err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden bg-white">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Import &amp; Organize Contacts
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Import from Zoho Contacts export (.csv, .xlsx) or paste emails directly into your sector lists.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Target Sector Selector */}
        <div className="py-2 px-3 bg-slate-50 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-foreground block">Assign to Sector Category:</span>
            <span className="text-[11px] text-muted-foreground">
              These contacts will be instantly available when you select this campaign.
            </span>
          </div>

          <Select
            value={targetSector}
            onValueChange={(val: ContactSector) => handleApplySectorToAll(val)}
          >
            <SelectTrigger className="w-full sm:w-[220px] h-9 text-xs bg-white font-bold">
              <SelectValue placeholder="Select Sector" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Input Methods Tabs */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="file" className="text-xs font-bold gap-1.5 py-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Upload File (CSV / Excel)
            </TabsTrigger>
            <TabsTrigger value="paste" className="text-xs font-bold gap-1.5 py-1.5">
              <FileText className="h-3.5 w-3.5" /> Paste List
            </TabsTrigger>
            <TabsTrigger value="single" className="text-xs font-bold gap-1.5 py-1.5">
              <UserPlus className="h-3.5 w-3.5" /> Single Contact
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: FILE UPLOAD */}
          <TabsContent value="file" className="flex-1 overflow-y-auto pt-3 space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-slate-50/50">
              <input
                type="file"
                id="zoho-file-input"
                accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isParsing}
              />
              <label htmlFor="zoho-file-input" className="cursor-pointer block space-y-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {fileName ? fileName : "Click to upload Zoho Contacts export (.csv or .xlsx)"}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Exports from contacts.zoho.com, Excel, or Google Contacts are automatically formatted.
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-bold bg-white"
                  disabled={isParsing}
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Parsing File...
                    </>
                  ) : (
                    "Choose File"
                  )}
                </Button>
              </label>
            </div>
          </TabsContent>

          {/* TAB 2: PASTE TEXT */}
          <TabsContent value="paste" className="flex-1 overflow-y-auto pt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Paste Contact Emails or Address Strings
              </Label>
              <Textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Example:
manager@kigalihotel.rw
Dr. Smith <director@hospital.rw>
info@campus.edu.rw, bursar@school.rw"
                rows={5}
                className="font-mono text-xs leading-relaxed"
              />
              <p className="text-[10px] text-muted-foreground">
                Supports emails separated by commas, newlines, or semicolons. Name tags like &quot;Name &lt;email&gt;&quot; are automatically parsed.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleParsePaste}
              disabled={!pasteText.trim()}
              size="sm"
              className="h-8 text-xs font-bold bg-slate-900 text-white"
            >
              Parse Pasted Contacts
            </Button>
          </TabsContent>

          {/* TAB 3: SINGLE CONTACT */}
          <TabsContent value="single" className="flex-1 overflow-y-auto pt-3">
            <form onSubmit={handleSaveSingle} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">Email Address *</Label>
                  <Input
                    required
                    type="email"
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    placeholder="director@institution.rw"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">Contact Person / Name</Label>
                  <Input
                    type="text"
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    placeholder="e.g. Jean Pierre / Operations Dir."
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">Organization / Institution</Label>
                  <Input
                    type="text"
                    value={singleOrg}
                    onChange={(e) => setSingleOrg(e.target.value)}
                    placeholder="e.g. Kigali Serena Hotel"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">Phone Number (Optional)</Label>
                  <Input
                    type="tel"
                    value={singlePhone}
                    onChange={(e) => setSinglePhone(e.target.value)}
                    placeholder="+250 788 ..."
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSaving || !singleEmail.trim()}
                  className="w-full sm:w-auto h-9 text-xs font-bold bg-primary text-black"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                  Save Contact to {getGroupName(targetSector)}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        {/* PREVIEW OF PARSED CONTACTS */}
        {parsedList.length > 0 && activeTab !== "single" && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                <span>Preview Ready Contacts:</span>
                <Badge className="bg-primary text-black text-[10px] font-bold">
                  {parsedList.length} ready to save
                </Badge>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setParsedList([])}
                className="h-6 text-[10px] text-muted-foreground hover:text-red-600"
              >
                Clear Preview
              </Button>
            </div>

            <div className="max-h-36 overflow-y-auto border rounded-lg divide-y bg-slate-50 text-xs">
              {parsedList.map((contact, idx) => (
                <div key={idx} className="p-2 flex items-center justify-between gap-2 hover:bg-white">
                  <div className="truncate">
                    <span className="font-bold text-slate-900">{contact.name || contact.email}</span>
                    <span className="text-slate-500 font-mono text-[11px] ml-2">&lt;{contact.email}&gt;</span>
                    {contact.organization && (
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded ml-2">
                        {contact.organization}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePreview(idx)}
                    className="text-muted-foreground hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveBatch}
                disabled={isSaving}
                className="h-9 text-xs font-extrabold bg-primary text-black gap-1.5"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving to Database...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Save {parsedList.length} Contacts to {getGroupName(targetSector)}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
