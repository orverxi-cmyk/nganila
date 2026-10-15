"use client";

import React, { useState, useMemo } from "react";
import { useFirestore, useCollection, useUser } from "@/firebase";
import { collection, doc, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  AlertTriangle,
  FolderCog,
  CheckCircle2,
  Layers,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ContactSector, SECTOR_CONFIG } from "@/lib/contacts-parser";
import { ZohoContactsImporter } from "@/components/admin/ZohoContactsImporter";
import { exportToExcel } from "@/lib/exportExcel";
import { useContactGroups } from "@/hooks/use-contact-groups";
import { ContactGroup, purgeContactsBatch } from "@/lib/contact-groups";

export function SectorAddressBook() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const {
    groups,
    addGroup,
    removeGroup,
    resetToDefaults,
    getGroupName,
    loading: groupsLoading,
  } = useContactGroups();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState<ContactSector | "all">("all");
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [importerDefaultSector, setImporterDefaultSector] = useState<ContactSector>("hotel");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Multi-select state
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  // Purge Dialog State
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeTargetSector, setPurgeTargetSector] = useState<string>("all");
  const [purgeConfirmed, setPurgeConfirmed] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeProgress, setPurgeProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });

  // Group Management Modals State
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const [isManageGroupsModalOpen, setIsManageGroupsModalOpen] = useState(false);
  const [groupToRemove, setGroupToRemove] = useState<ContactGroup | null>(null);
  const [removeAction, setRemoveAction] = useState<"purge" | "move_to_general">("move_to_general");
  const [isRemovingGroup, setIsRemovingGroup] = useState(false);

  // Bulk Selected Delete Modal State
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Firestore contacts query (only run when authenticated)
  const contactsQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, "client_contacts");
  }, [db, user]);

  const { data: rawContacts, loading } = useCollection(contactsQuery);

  // Dynamic Contact Counts per Group
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
    };

    // Initialize all registered groups
    groups.forEach((g) => {
      counts[g.id] = 0;
    });

    // Count contacts
    (rawContacts || []).forEach((c: any) => {
      counts.all++;
      const s = c.sector || "general";
      if (counts[s] !== undefined) {
        counts[s]++;
      } else {
        counts[s] = (counts[s] || 0) + 1;
      }
    });

    return counts;
  }, [rawContacts, groups]);

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

  // Handle single contact deletion
  const handleDelete = async (contactId: string, email: string) => {
    if (!db) return;
    if (!window.confirm(`Delete contact "${email}"?`)) return;

    setDeletingId(contactId);
    try {
      await deleteDoc(doc(db, "client_contacts", contactId));
      setSelectedContactIds((prev) => prev.filter((id) => id !== contactId));
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
      sector: getGroupName(c.sector || "general"),
      createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "",
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

  // Open Purge Modal
  const handleOpenPurgeModal = (targetSector: string) => {
    setPurgeTargetSector(targetSector);
    setPurgeConfirmed(false);
    setPurgeProgress({ current: 0, total: 0 });
    setIsPurgeModalOpen(true);
  };

  // Execute Purge Contacts in Group
  const handleExecutePurge = async () => {
    if (!db) return;

    // Determine target contacts to purge
    const contactsToPurge = (rawContacts || []).filter((c: any) => {
      if (purgeTargetSector === "all") return true;
      return c.sector === purgeTargetSector;
    });

    const targetIds = contactsToPurge.map((c: any) => c.id);
    const targetLabel = getGroupName(purgeTargetSector);

    if (targetIds.length === 0) {
      toast({ title: "No contacts found", description: `No contacts exist in ${targetLabel}.` });
      setIsPurgeModalOpen(false);
      return;
    }

    setIsPurging(true);
    setPurgeProgress({ current: 0, total: targetIds.length });

    try {
      const purgedCount = await purgeContactsBatch(db, targetIds, (current, total) => {
        setPurgeProgress({ current, total });
      });

      setSelectedContactIds([]);
      toast({
        title: "Contacts Purged Successfully",
        description: `Permanently removed ${purgedCount} contact(s) from "${targetLabel}".`,
      });

      setIsPurgeModalOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Purge Failed",
        description: err.message || "An error occurred while purging contacts.",
      });
    } finally {
      setIsPurging(false);
    }
  };

  // Execute Bulk Selected Contacts Purge
  const handleExecuteBulkDelete = async () => {
    if (!db || selectedContactIds.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const count = await purgeContactsBatch(db, selectedContactIds);
      toast({
        title: "Contacts Deleted",
        description: `Successfully deleted ${count} selected contact(s).`,
      });
      setSelectedContactIds([]);
      setIsBulkDeleteModalOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Bulk Delete Failed",
        description: err.message || "Failed to delete selected contacts.",
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Add a new Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast({ variant: "destructive", title: "Name required", description: "Please enter a group name." });
      return;
    }

    setIsAddingGroup(true);
    try {
      const created = await addGroup({
        name: newGroupName.trim(),
        description: newGroupDescription.trim(),
      });

      toast({
        title: "Group Created",
        description: `Group "${created.name}" is now available.`,
      });

      setSelectedSector(created.id);
      setNewGroupName("");
      setNewGroupDescription("");
      setIsAddGroupModalOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Could not create group",
        description: err.message || "Failed to create group.",
      });
    } finally {
      setIsAddingGroup(false);
    }
  };

  // Remove Group handler
  const handleConfirmRemoveGroup = async () => {
    if (!groupToRemove) return;

    setIsRemovingGroup(true);
    try {
      const contactsInGroup = (rawContacts || [])
        .filter((c: any) => c.sector === groupToRemove.id)
        .map((c: any) => c.id);

      await removeGroup(groupToRemove.id, {
        actionOnContacts: removeAction,
        contactIds: contactsInGroup,
      });

      toast({
        title: "Group Removed",
        description: `Group "${groupToRemove.name}" was removed.${
          contactsInGroup.length > 0
            ? removeAction === "purge"
              ? ` Also purged ${contactsInGroup.length} contact(s).`
              : ` Reassigned ${contactsInGroup.length} contact(s) to General Institutions.`
            : ""
        }`,
      });

      if (selectedSector === groupToRemove.id) {
        setSelectedSector("all");
      }

      setGroupToRemove(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Remove Group Failed",
        description: err.message || "Could not remove group.",
      });
    } finally {
      setIsRemovingGroup(false);
    }
  };

  // Helper icons for groups
  const renderGroupIcon = (groupId: string) => {
    switch (groupId) {
      case "hotel":
        return <Hotel className="h-3.5 w-3.5" />;
      case "health":
        return <Hospital className="h-3.5 w-3.5" />;
      case "campus":
        return <GraduationCap className="h-3.5 w-3.5" />;
      case "schools":
        return <School className="h-3.5 w-3.5" />;
      case "general":
        return <Building2 className="h-3.5 w-3.5" />;
      default:
        return <Layers className="h-3.5 w-3.5" />;
    }
  };

  // Toggle select all contacts
  const handleToggleSelectAll = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredContacts.map((c: any) => c.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const activeGroupCount = sectorCounts[selectedSector] || 0;
  const purgeModalCount = sectorCounts[purgeTargetSector] || 0;

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
                    {sectorCounts.all} Total Contacts
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-300">
                  Organized contact lists for Hotels, Health Facilities, Campuses, Schools, and Custom Groups
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Purge Active Group Button */}
              {selectedSector !== "all" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenPurgeModal(selectedSector)}
                  disabled={activeGroupCount === 0}
                  className="h-8 text-xs font-bold border-red-500/40 bg-red-950/40 text-red-300 hover:bg-red-900/60 hover:text-white gap-1.5 transition-all"
                  title={`Purge all ${activeGroupCount} contacts in this group`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" /> Purge Group ({activeGroupCount})
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenPurgeModal("all")}
                  disabled={sectorCounts.all === 0}
                  className="h-8 text-xs font-bold border-red-500/40 bg-red-950/40 text-red-300 hover:bg-red-900/60 hover:text-white gap-1.5"
                  title="Purge all contacts in address book"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" /> Purge All ({sectorCounts.all})
                </Button>
              )}

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
                <Upload className="h-3.5 w-3.5" /> Import Contacts
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Dynamic Groups / Sector Category Pills */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* All Contacts Tab */}
              <button
                type="button"
                onClick={() => setSelectedSector("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  selectedSector === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                All Contacts ({sectorCounts.all})
              </button>

              {/* Dynamic Group Pills with Live Counters */}
              {groups.map((group) => {
                const count = sectorCounts[group.id] || 0;
                const isSelected = selectedSector === group.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedSector(group.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary text-black shadow-xs ring-1 ring-primary/40"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {renderGroupIcon(group.id)}
                    <span>{group.name}</span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        isSelected ? "bg-black/15 text-black" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Group Management Actions (Add Group & Manage Groups) */}
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddGroupModalOpen(true)}
                className="h-7 text-xs font-bold border-dashed border-primary/60 text-primary hover:bg-primary/10 gap-1"
              >
                <Plus className="h-3 w-3" /> Add Group
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsManageGroupsModalOpen(true)}
                className="h-7 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1"
                title="Manage all contact groups"
              >
                <FolderCog className="h-3.5 w-3.5" /> Manage Groups
              </Button>
            </div>
          </div>

          {/* Active Group Information & Context Banner */}
          {selectedSector !== "all" && (
            <div className="p-3 bg-slate-50 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
                  {renderGroupIcon(selectedSector)}
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span>{getGroupName(selectedSector)}</span>
                    <Badge variant="outline" className="font-mono text-[10px] bg-white font-extrabold">
                      {activeGroupCount} {activeGroupCount === 1 ? "Contact" : "Contacts"}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {groups.find((g) => g.id === selectedSector)?.description ||
                      "Contacts categorized under this target sector group."}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenPurgeModal(selectedSector)}
                  disabled={activeGroupCount === 0}
                  className="h-7 text-xs font-bold text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700 gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Purge Contacts ({activeGroupCount})
                </Button>

                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs font-bold text-black border-primary bg-primary/20 hover:bg-primary/30 gap-1.5"
                >
                  <Link href="/admin/emails">
                    <Send className="h-3 w-3" /> Send Campaign
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Search Bar & Multi-Select Toolbar */}
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
                Showing <strong>{filteredContacts.length}</strong> of{" "}
                <strong>{selectedSector === "all" ? sectorCounts.all : activeGroupCount}</strong> contacts
              </span>

              {selectedContactIds.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="h-8 text-xs font-bold gap-1.5 shadow-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Selected ({selectedContactIds.length})
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
                    ? `No contacts saved in "${getGroupName(selectedSector)}" yet.`
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
              {/* Table Header */}
              <div className="bg-slate-50 px-4 py-2.5 grid grid-cols-12 items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground gap-2">
                <div className="col-span-1 flex items-center">
                  <Checkbox
                    checked={
                      selectedContactIds.length > 0 &&
                      selectedContactIds.length === filteredContacts.length
                    }
                    onCheckedChange={handleToggleSelectAll}
                    title="Select all filtered contacts"
                  />
                </div>
                <div className="col-span-3 sm:col-span-3">Contact / Name</div>
                <div className="col-span-4 sm:col-span-3">Email Address</div>
                <div className="hidden sm:block sm:col-span-3">Organization / Phone</div>
                <div className="col-span-4 sm:col-span-2 text-right">Sector / Action</div>
              </div>

              {/* Table Body */}
              <div className="divide-y max-h-[500px] overflow-y-auto bg-white">
                {filteredContacts.map((c: any) => {
                  const isChecked = selectedContactIds.includes(c.id);
                  const groupLabel = getGroupName(c.sector || "general");

                  return (
                    <div
                      key={c.id}
                      className={`px-4 py-3 grid grid-cols-12 items-center text-xs transition-colors gap-2 ${
                        isChecked ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-slate-50"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="col-span-1 flex items-center">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggleSelectOne(c.id)}
                        />
                      </div>

                      {/* Name */}
                      <div className="col-span-3 sm:col-span-3">
                        <div className="font-bold text-slate-900 truncate">{c.name || "—"}</div>
                        {c.organization && (
                          <div className="text-[10px] text-muted-foreground truncate sm:hidden">
                            {c.organization}
                          </div>
                        )}
                      </div>

                      {/* Email */}
                      <div className="col-span-4 sm:col-span-3">
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
                      <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-2">
                        <Badge
                          variant="outline"
                          className="text-[9px] font-bold py-0.5 px-2 bg-slate-50 border-slate-200 truncate max-w-[100px]"
                          title={groupLabel}
                        >
                          {groupLabel.split(" ")[0]}
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

      {/* ======================================================== */}
      {/* 1. PURGE CONTACTS IN GROUP MODAL WITH LIVE COUNTER       */}
      {/* ======================================================== */}
      <Dialog open={isPurgeModalOpen} onOpenChange={setIsPurgeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-red-600 mb-1">
              <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Purge Contacts: {getGroupName(purgeTargetSector)}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Permanently delete all contacts from this category
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Highlighted Warning Counter Box */}
            <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50/70 text-center space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
                Total Contacts to be Purged
              </span>
              <div className="text-4xl font-extrabold text-red-600 font-mono">
                {purgeModalCount}
              </div>
              <p className="text-xs text-red-800 font-medium pt-1">
                {purgeModalCount === 1 ? "1 contact" : `${purgeModalCount} contacts`} will be permanently removed
                from <strong>"{getGroupName(purgeTargetSector)}"</strong>.
              </p>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border">
              ⚠️ <strong>Warning:</strong> This operation deletes these contact records from Firestore. Any ongoing
              or future email campaigns will no longer reach them through this group. This action{" "}
              <strong>cannot be undone</strong>.
            </div>

            {/* Live Purge Progress Bar */}
            {isPurging && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" /> Purging in progress...
                  </span>
                  <span>
                    {purgeProgress.current} / {purgeProgress.total} deleted
                  </span>
                </div>
                <Progress
                  value={
                    purgeProgress.total > 0
                      ? Math.round((purgeProgress.current / purgeProgress.total) * 100)
                      : 0
                  }
                  className="h-2 bg-slate-100"
                />
              </div>
            )}

            {/* Checkbox confirmation */}
            {!isPurging && (
              <div className="flex items-start gap-2 pt-2">
                <Checkbox
                  id="confirm-purge-checkbox"
                  checked={purgeConfirmed}
                  onCheckedChange={(val) => setPurgeConfirmed(Boolean(val))}
                  className="mt-0.5"
                />
                <label
                  htmlFor="confirm-purge-checkbox"
                  className="text-xs font-bold text-slate-800 cursor-pointer select-none leading-snug"
                >
                  I confirm that I want to permanently delete all {purgeModalCount} contacts in "
                  {getGroupName(purgeTargetSector)}".
                </label>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isPurging}
              onClick={() => setIsPurgeModalOpen(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!purgeConfirmed || isPurging || purgeModalCount === 0}
              onClick={handleExecutePurge}
              className="text-xs h-9 font-bold bg-red-600 hover:bg-red-700 gap-1.5"
            >
              {isPurging ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Purging {purgeProgress.current} /{" "}
                  {purgeProgress.total}...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" /> Yes, Purge {purgeModalCount} Contacts
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 2. BULK DELETE SELECTED CONTACTS MODAL                  */}
      {/* ======================================================== */}
      <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" /> Delete Selected Contacts
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Confirm deletion of highlighted address book items
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-center">
            <div className="p-4 rounded-xl border bg-slate-50 space-y-1">
              <span className="text-[11px] font-bold uppercase text-muted-foreground">Selected Contacts</span>
              <div className="text-3xl font-extrabold text-foreground font-mono">
                {selectedContactIds.length}
              </div>
              <p className="text-xs text-muted-foreground">
                These {selectedContactIds.length} chosen contacts will be removed from your database.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isBulkDeleting}
              onClick={() => setIsBulkDeleteModalOpen(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isBulkDeleting}
              onClick={handleExecuteBulkDelete}
              className="text-xs h-9 font-bold bg-red-600 hover:bg-red-700"
            >
              {isBulkDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1.5" />
              )}
              Delete {selectedContactIds.length} Contacts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 3. ADD NEW GROUP MODAL                                   */}
      {/* ======================================================== */}
      <Dialog open={isAddGroupModalOpen} onOpenChange={setIsAddGroupModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary mb-1">
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Plus className="h-5 w-5 text-black" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Add New Contact Group
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Create a targeted industry or customer category for SANEX campaigns
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Group / Sector Name *
                </label>
                <Input
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Commercial Banks &amp; Finance, NGOs &amp; Churches, Embassies..."
                  className="h-9 text-xs"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Description (Optional)
                </label>
                <Input
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="e.g. Commercial banks, financial institutions, and insurance headquarters"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isAddingGroup}
                onClick={() => setIsAddGroupModalOpen(false)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAddingGroup || !newGroupName.trim()}
                className="text-xs h-9 font-bold bg-primary text-black hover:bg-primary/90 gap-1.5"
              >
                {isAddingGroup ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Create Group
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 4. MANAGE CONTACT GROUPS MODAL (ADD & REMOVE GROUPS)    */}
      {/* ======================================================== */}
      <Dialog open={isManageGroupsModalOpen} onOpenChange={setIsManageGroupsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderCog className="h-5 w-5 text-primary" />
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Manage Contact Groups
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Add new categories, purge group contacts, or remove groups
                  </DialogDescription>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setIsManageGroupsModalOpen(false);
                  setIsAddGroupModalOpen(true);
                }}
                className="h-8 text-xs font-bold bg-primary text-black hover:bg-primary/90 gap-1"
              >
                <Plus className="h-3 w-3" /> Add Group
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2 py-3 divide-y border rounded-xl bg-slate-50">
            {groups.map((grp) => {
              const count = sectorCounts[grp.id] || 0;
              const isDefault = grp.isDefault;

              return (
                <div
                  key={grp.id}
                  className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{grp.name}</span>
                      <Badge variant="outline" className="text-[9px] font-mono font-bold bg-slate-50">
                        {count} {count === 1 ? "Contact" : "Contacts"}
                      </Badge>
                      {isDefault && (
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold">
                          (Built-in)
                        </span>
                      )}
                    </div>
                    {grp.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{grp.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Quick Purge Group Contacts */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={count === 0}
                      onClick={() => {
                        setIsManageGroupsModalOpen(false);
                        handleOpenPurgeModal(grp.id);
                      }}
                      className="h-7 text-[11px] font-bold text-red-600 border-red-200 hover:bg-red-50 gap-1"
                      title="Purge contacts in this group"
                    >
                      <Trash2 className="h-3 w-3" /> Purge ({count})
                    </Button>

                    {/* Remove Group Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setGroupToRemove(grp)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                      title="Remove this group"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (window.confirm("Restore original built-in sector groups?")) {
                  await resetToDefaults();
                  toast({ title: "Groups Reset", description: "Default sector categories restored." });
                }
              }}
              className="text-xs text-muted-foreground hover:text-slate-800"
            >
              Reset to Defaults
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsManageGroupsModalOpen(false)}
              className="text-xs h-8 font-bold"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 5. REMOVE GROUP CONFIRMATION MODAL                      */}
      {/* ======================================================== */}
      {groupToRemove && (
        <Dialog open={Boolean(groupToRemove)} onOpenChange={() => setGroupToRemove(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" /> Remove Group: "{groupToRemove.name}"
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Confirm deletion of this group category
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* If group has contacts, give explicit choice */}
              {(sectorCounts[groupToRemove.id] || 0) > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border bg-amber-50/80 border-amber-200 text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>Group contains {sectorCounts[groupToRemove.id]} contact(s)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Choose what to do with the {sectorCounts[groupToRemove.id]} contacts currently saved in this group:
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="radio"
                        name="removeAction"
                        value="move_to_general"
                        checked={removeAction === "move_to_general"}
                        onChange={() => setRemoveAction("move_to_general")}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Move contacts to "General Institutions"</div>
                        <div className="text-[11px] text-muted-foreground">
                          Keep all {sectorCounts[groupToRemove.id]} contacts safe and recategorize them as General.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-red-200 bg-red-50/50 cursor-pointer hover:bg-red-50 transition-colors">
                      <input
                        type="radio"
                        name="removeAction"
                        value="purge"
                        checked={removeAction === "purge"}
                        onChange={() => setRemoveAction("purge")}
                        className="mt-0.5 text-red-600"
                      />
                      <div>
                        <div className="font-bold text-red-700">Purge &amp; delete all {sectorCounts[groupToRemove.id]} contacts</div>
                        <div className="text-[11px] text-red-600">
                          Permanently delete all contacts belonging to this group from your database.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <p className="text-slate-600">
                  This group currently contains <strong>0 contacts</strong>. Are you sure you want to remove it?
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={isRemovingGroup}
                onClick={() => setGroupToRemove(null)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isRemovingGroup}
                onClick={handleConfirmRemoveGroup}
                className="text-xs h-9 font-bold bg-red-600 hover:bg-red-700 gap-1.5"
              >
                {isRemovingGroup ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Confirm Remove Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Importer Dialog */}
      <ZohoContactsImporter
        open={isImporterOpen}
        onOpenChange={setIsImporterOpen}
        defaultSector={importerDefaultSector}
      />
    </div>
  );
}
