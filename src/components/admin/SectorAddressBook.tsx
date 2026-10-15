"use client";

import React, { useState, useMemo } from "react";
import { useFirestore, useCollection, useUser } from "@/firebase";
import { collection, doc, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Upload,
  FileDown,
  Trash2,
  Mail,
  Phone,
  Building,
  Loader2,
  Plus,
  Hotel,
  Hospital,
  GraduationCap,
  School,
  Building2,
  Send,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ContactSector, SECTOR_CONFIG } from "@/lib/contacts-parser";
import { ZohoContactsImporter } from "@/components/admin/ZohoContactsImporter";
import { exportToExcel } from "@/lib/exportExcel";

export function SectorAddressBook() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState<ContactSector | "all">("all");
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [importerDefaultSector, setImporterDefaultSector] = useState<ContactSector>("hotel");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Firestore contacts query (only run when authenticated)
  const contactsQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, "client_contacts");
  }, [db, user]);

  const { data: rawContacts, loading } = useCollection(contactsQuery);

  // Sector Counts
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
      hotel: 0,
      health: 0,
      campus: 0,
      schools: 0,
      general: 0,
      other: 0,
    };

    (rawContacts || []).forEach((c: any) => {
      counts.all++;
      const s = c.sector || "general";
      if (counts[s] !== undefined) counts[s]++;
      else counts.general++;
    });

    return counts;
  }, [rawContacts]);

  // Filtered contacts list
  const filteredContacts = useMemo(() => {
    return (rawContacts || [])
      .filter((c: any) => {
        if (selectedSector !== "all" && c.sector !== selectedSector) {
          return false;
        }

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchesName = (c.name || "").toLowerCase().includes(term);
          const matchesEmail = (c.email || "").toLowerCase().includes(term);
          const matchesOrg = (c.organization || "").toLowerCase().includes(term);
          const matchesPhone = (c.phone || "").toLowerCase().includes(term);

          if (!matchesName && !matchesEmail && !matchesOrg && !matchesPhone) {
            return false;
          }
        }

        return true;
      })
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [rawContacts, selectedSector, searchTerm]);

  // Handle Delete Single Contact
  const handleDelete = async (contactId: string, email: string) => {
    if (!db) return;
    if (!window.confirm(`Delete contact "${email}"?`)) return;

    setDeletingId(contactId);
    try {
      await deleteDoc(doc(db, "client_contacts", contactId));
      toast({ title: "Contact Removed", description: `${email} was deleted from address book.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  // Export filtered contacts to Excel
  const handleExport = () => {
    if (filteredContacts.length === 0) {
      toast({ variant: "destructive", title: "No contacts to export" });
      return;
    }

    const data = filteredContacts.map((c: any) => ({
      name: c.name || "",
      email: c.email || "",
      organization: c.organization || "",
      phone: c.phone || "",
      sector: SECTOR_CONFIG[c.sector as ContactSector]?.label || c.sector || "General",
      createdAt: c.createdAt,
    }));

    exportToExcel(
      data,
      [
        { header: "Name", key: "name", width: 25 },
        { header: "Email Address", key: "email", width: 30 },
        { header: "Organization", key: "organization", width: 30 },
        { header: "Phone Number", key: "phone", width: 20 },
        { header: "Sector Category", key: "sector", width: 25 },
        { header: "Date Added", key: "createdAt", width: 22 },
      ],
      `SANEX_AddressBook_${selectedSector}_${new Date().toISOString().split("T")[0]}`
    );

    toast({ title: "Export Downloaded", description: `Exported ${data.length} contacts.` });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <Card className="border bg-white shadow-sm overflow-hidden">
        <CardHeader className="p-5 border-b bg-slate-900 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  Sector Address Book &amp; Zoho Contacts
                  <Badge className="bg-primary text-black font-extrabold text-[10px]">
                    {sectorCounts.all} Total
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-300">
                  Organized contact lists for Hotels, Health Facilities, Campuses, Schools, and Enterprises
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-8 text-xs font-bold border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 gap-1.5"
              >
                <FileDown className="h-3.5 w-3.5" /> Export Excel
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setImporterDefaultSector(selectedSector !== "all" ? selectedSector : "hotel");
                  setIsImporterOpen(true);
                }}
                className="h-8 text-xs font-bold bg-primary text-black hover:bg-primary/90 gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" /> Import Zoho Contacts
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Sector Category Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pb-2 border-b">
            <button
              onClick={() => setSelectedSector("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                selectedSector === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All Contacts ({sectorCounts.all})
            </button>

            <button
              onClick={() => setSelectedSector("hotel")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                selectedSector === "hotel"
                  ? "bg-primary text-black"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Hotel className="h-3.5 w-3.5" /> Hotels ({sectorCounts.hotel})
            </button>

            <button
              onClick={() => setSelectedSector("health")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                selectedSector === "health"
                  ? "bg-primary text-black"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Hospital className="h-3.5 w-3.5" /> Health Facilities ({sectorCounts.health})
            </button>

            <button
              onClick={() => setSelectedSector("campus")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                selectedSector === "campus"
                  ? "bg-primary text-black"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" /> Campuses ({sectorCounts.campus})
            </button>

            <button
              onClick={() => setSelectedSector("schools")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                selectedSector === "schools"
                  ? "bg-primary text-black"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <School className="h-3.5 w-3.5" /> Schools ({sectorCounts.schools})
            </button>

            <button
              onClick={() => setSelectedSector("general")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                selectedSector === "general"
                  ? "bg-primary text-black"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" /> General ({sectorCounts.general})
            </button>
          </div>

          {/* Search Bar & Sector Quick Campaign Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, organization, or phone..."
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Showing <strong>{filteredContacts.length}</strong> contacts
              </span>

              {selectedSector !== "all" && filteredContacts.length > 0 && (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-bold text-black border-primary bg-primary/10 hover:bg-primary/20 gap-1.5"
                >
                  <Link href={`/admin/emails`}>
                    <Send className="h-3 w-3 text-black" /> Launch {SECTOR_CONFIG[selectedSector].label} Campaign
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Contacts Table */}
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Loading address book...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="py-12 text-center border rounded-xl bg-slate-50 space-y-3 p-4">
              <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">No Contacts Found</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {searchTerm
                    ? "No records matched your search query."
                    : selectedSector !== "all"
                    ? `No contacts saved in ${SECTOR_CONFIG[selectedSector].label} yet.`
                    : "Your address book is currently empty."}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setImporterDefaultSector(selectedSector !== "all" ? selectedSector : "hotel");
                  setIsImporterOpen(true);
                }}
                className="h-8 text-xs font-bold bg-primary text-black"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Import Contacts Now
              </Button>
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden divide-y">
              <div className="bg-slate-50 px-4 py-2.5 grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <div className="col-span-4 sm:col-span-3">Contact / Name</div>
                <div className="col-span-5 sm:col-span-4">Email Address</div>
                <div className="hidden sm:block sm:col-span-3">Organization / Phone</div>
                <div className="col-span-3 sm:col-span-2 text-right">Sector / Action</div>
              </div>

              <div className="divide-y max-h-[500px] overflow-y-auto bg-white">
                {filteredContacts.map((c: any) => {
                  const sectorConf = SECTOR_CONFIG[c.sector as ContactSector] || SECTOR_CONFIG.general;
                  return (
                    <div
                      key={c.id}
                      className="px-4 py-3 grid grid-cols-12 items-center text-xs hover:bg-slate-50 transition-colors gap-2"
                    >
                      {/* Name */}
                      <div className="col-span-4 sm:col-span-3">
                        <div className="font-bold text-slate-900 truncate">{c.name || "—"}</div>
                        {c.organization && (
                          <div className="text-[10px] text-muted-foreground truncate sm:hidden">
                            {c.organization}
                          </div>
                        )}
                      </div>

                      {/* Email */}
                      <div className="col-span-5 sm:col-span-4">
                        <div className="font-mono text-slate-800 text-[11px] truncate flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      </div>

                      {/* Organization & Phone */}
                      <div className="hidden sm:block sm:col-span-3 truncate">
                        <div className="text-slate-700 font-medium truncate flex items-center gap-1.5">
                          {c.organization && <Building className="h-3 w-3 text-muted-foreground shrink-0" />}
                          <span className="truncate">{c.organization || "—"}</span>
                        </div>
                        {c.phone && (
                          <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="h-2.5 w-2.5" /> {c.phone}
                          </div>
                        )}
                      </div>

                      {/* Sector Badge & Delete */}
                      <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2">
                        <Badge variant="outline" className="text-[9px] font-bold py-0.5 px-2 bg-slate-50 border-slate-200 truncate">
                          {sectorConf.label.split(" ")[0]}
                        </Badge>

                        <button
                          type="button"
                          disabled={deletingId === c.id}
                          onClick={() => handleDelete(c.id, c.email)}
                          className="h-7 w-7 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 flex items-center justify-center transition-colors shrink-0"
                          title="Delete contact"
                        >
                          {deletingId === c.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Importer Dialog */}
      <ZohoContactsImporter
        open={isImporterOpen}
        onOpenChange={setIsImporterOpen}
        defaultSector={importerDefaultSector}
      />
    </div>
  );
}
