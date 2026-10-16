"use client";

import React, { useState, useMemo } from "react";
import { useFirestore, useCollection, useUser } from "@/firebase";
import { collection, doc, deleteDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
  UserPlus,
  UserMinus,
  Pencil,
  ArrowRightLeft,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ContactSector, SECTOR_CONFIG } from "@/lib/contacts-parser";
import { ZohoContactsImporter } from "@/components/admin/ZohoContactsImporter";
import { exportToExcel } from "@/lib/exportExcel";
import { useContactGroups } from "@/hooks/use-contact-groups";
import { ContactGroup, purgeContactsBatch, reassignContactsBatch, addContactsToGroupBatch } from "@/lib/contact-groups";

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

  // Manual Add Recipient State
  const [isAddRecipientModalOpen, setIsAddRecipientModalOpen] = useState(false);
  const [addRecipientEmail, setAddRecipientEmail] = useState("");
  const [addRecipientName, setAddRecipientName] = useState("");
  const [addRecipientOrg, setAddRecipientOrg] = useState("");
  const [addRecipientPhone, setAddRecipientPhone] = useState("");
  const [addRecipientSector, setAddRecipientSector] = useState<string>("hotel");
  const [isSavingRecipient, setIsSavingRecipient] = useState(false);

  // Edit Recipient State
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [editRecipientEmail, setEditRecipientEmail] = useState("");
  const [editRecipientName, setEditRecipientName] = useState("");
  const [editRecipientOrg, setEditRecipientOrg] = useState("");
  const [editRecipientPhone, setEditRecipientPhone] = useState("");
  const [editRecipientSector, setEditRecipientSector] = useState<string>("hotel");
  const [isUpdatingRecipient, setIsUpdatingRecipient] = useState(false);

  // Remove Recipient State
  const [contactToRemove, setContactToRemove] = useState<any | null>(null);
  const [removeRecipientMode, setRemoveRecipientMode] = useState<"remove_from_group" | "delete_permanent">("remove_from_group");
  const [isRemovingRecipient, setIsRemovingRecipient] = useState(false);

  // Bulk Move / Add to Group State
  const [isMoveGroupModalOpen, setIsMoveGroupModalOpen] = useState(false);
  const [moveTargetGroup, setMoveTargetGroup] = useState<string>("general");
  const [moveMode, setMoveMode] = useState<"add" | "move">("add");
  const [isMovingGroup, setIsMovingGroup] = useState(false);

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
      const contactSectors: string[] = Array.isArray(c.sectors) && c.sectors.length > 0
        ? c.sectors
        : [c.sector || "general"];

      const uniqueSectors = new Set(contactSectors);
      uniqueSectors.forEach((s) => {
        if (counts[s] !== undefined) {
          counts[s]++;
        } else {
          counts[s] = 1;
        }
      });
    });

    return counts;
  }, [rawContacts, groups]);

  // Filtered contacts list
  const filteredContacts = useMemo(() => {
    return (rawContacts || [])
      .filter((c: any) => {
        if (selectedSector !== "all") {
          const contactSectors: string[] = Array.isArray(c.sectors) && c.sectors.length > 0
            ? c.sectors
            : [c.sector || "general"];
          if (!contactSectors.includes(selectedSector)) {
            return false;
          }
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

  // Standard email validation pattern
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  // Open Add Recipient Dialog
  const handleOpenAddRecipient = (targetSector?: string) => {
    const defaultSec = targetSector || (selectedSector !== "all" ? selectedSector : groups[0]?.id || "hotel");
    setAddRecipientSector(defaultSec);
    setAddRecipientEmail("");
    setAddRecipientName("");
    setAddRecipientOrg("");
    setAddRecipientPhone("");
    setIsAddRecipientModalOpen(true);
  };

  // Execute Add Recipient to Group
  const handleSaveRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      toast({ variant: "destructive", title: "Database unavailable" });
      return;
    }

    const email = addRecipientEmail.trim().toLowerCase();
    if (!email || !EMAIL_REGEX.test(email)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsSavingRecipient(true);
    try {
      const safeId = email.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const targetSec = addRecipientSector || "general";
      const now = Date.now();

      await setDoc(
        doc(db, "client_contacts", safeId),
        {
          id: safeId,
          name: addRecipientName.trim() || email.split("@")[0],
          email,
          organization: addRecipientOrg.trim(),
          phone: addRecipientPhone.trim(),
          sector: targetSec,
          sectors: arrayUnion(targetSec),
          source: "manual_entry",
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

      toast({
        title: "Recipient Added",
        description: `${email} was successfully added to ${getGroupName(targetSec)}.`,
      });

      setIsAddRecipientModalOpen(false);
      setAddRecipientEmail("");
      setAddRecipientName("");
      setAddRecipientOrg("");
      setAddRecipientPhone("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to Add Recipient",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSavingRecipient(false);
    }
  };

  // Open Edit Recipient Dialog
  const handleOpenEditRecipient = (c: any) => {
    setEditingContact(c);
    setEditRecipientEmail(c.email || "");
    setEditRecipientName(c.name || "");
    setEditRecipientOrg(c.organization || "");
    setEditRecipientPhone(c.phone || "");
    setEditRecipientSector(c.sector || "general");
  };

  // Execute Update Recipient
  const handleUpdateRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingContact) return;

    setIsUpdatingRecipient(true);
    try {
      const now = Date.now();
      await updateDoc(doc(db, "client_contacts", editingContact.id), {
        name: editRecipientName.trim() || editingContact.email.split("@")[0],
        organization: editRecipientOrg.trim(),
        phone: editRecipientPhone.trim(),
        sector: editRecipientSector,
        sectors: arrayUnion(editRecipientSector),
        updatedAt: now,
      });

      toast({
        title: "Recipient Updated",
        description: `Changes to ${editingContact.email} saved successfully.`,
      });

      setEditingContact(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Could not update recipient.",
      });
    } finally {
      setIsUpdatingRecipient(false);
    }
  };

  // Open Remove Recipient Dialog
  const handleOpenRemoveRecipient = (c: any) => {
    setContactToRemove(c);
    const isSpecificGroup = c.sector && c.sector !== "general";
    setRemoveRecipientMode(isSpecificGroup ? "remove_from_group" : "delete_permanent");
  };

  // Execute Remove Recipient
  const handleExecuteRemoveRecipient = async () => {
    if (!db || !contactToRemove) return;

    setIsRemovingRecipient(true);
    try {
      const email = contactToRemove.email;
      const groupName = getGroupName(contactToRemove.sector || "general");

      if (removeRecipientMode === "remove_from_group") {
        const sectorToRemove = selectedSector !== "all" ? selectedSector : (contactToRemove.sector || "general");
        const existingSectors: string[] = Array.isArray(contactToRemove.sectors) && contactToRemove.sectors.length > 0
          ? contactToRemove.sectors
          : [contactToRemove.sector || "general"];
        
        const remainingSectors = existingSectors.filter((s) => s !== sectorToRemove);
        const newPrimary = remainingSectors.length > 0 ? remainingSectors[0] : "general";

        await updateDoc(doc(db, "client_contacts", contactToRemove.id), {
          sector: newPrimary,
          sectors: arrayRemove(sectorToRemove),
          updatedAt: Date.now(),
        });

        toast({
          title: "Removed from Group",
          description: `${email} was removed from "${groupName}".`,
        });
      } else {
        await deleteDoc(doc(db, "client_contacts", contactToRemove.id));
        setSelectedContactIds((prev) => prev.filter((id) => id !== contactToRemove.id));

        toast({
          title: "Recipient Deleted",
          description: `${email} was permanently deleted from your address book.`,
        });
      }

      setContactToRemove(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: err.message || "Could not remove recipient.",
      });
    } finally {
      setIsRemovingRecipient(false);
    }
  };

  // Execute Move / Add Selected Contacts to Another Group
  const handleExecuteMoveGroup = async () => {
    if (!db || selectedContactIds.length === 0) return;

    setIsMovingGroup(true);
    try {
      const targetLabel = getGroupName(moveTargetGroup);
      let count = 0;

      if (moveMode === "add") {
        count = await addContactsToGroupBatch(db, selectedContactIds, moveTargetGroup);
        toast({
          title: "Contacts Added to Group",
          description: `Successfully added ${count} recipient(s) to "${targetLabel}" (kept in current group as well).`,
        });
      } else {
        count = await reassignContactsBatch(
          db,
          selectedContactIds,
          moveTargetGroup,
          selectedSector !== "all" ? selectedSector : undefined
        );
        toast({
          title: "Contacts Moved Exclusively",
          description: `Successfully moved ${count} recipient(s) to "${targetLabel}".`,
        });
      }

      setSelectedContactIds([]);
      setIsMoveGroupModalOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: err.message || "Could not process selected contacts.",
      });
    } finally {
      setIsMovingGroup(false);
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
                variant="outline"
                className="h-8 text-xs font-bold border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" /> Import Contacts
              </Button>

              <Button
                size="sm"
                onClick={() => handleOpenAddRecipient()}
                className="h-8 text-xs font-bold bg-primary text-black hover:bg-primary/90 gap-1.5 shadow-xs"
              >
                <UserPlus className="h-3.5 w-3.5" /> Add Recipient
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

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => handleOpenAddRecipient(selectedSector)}
                  className="h-7 text-xs font-bold bg-primary text-black hover:bg-primary/90 gap-1.5 shadow-xs"
                >
                  <UserPlus className="h-3 w-3" /> Add Recipient
                </Button>

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
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMoveTargetGroup(selectedSector !== "all" ? selectedSector : groups[0]?.id || "general");
                      setIsMoveGroupModalOpen(true);
                    }}
                    className="h-8 text-xs font-bold gap-1.5 border-primary/50 text-slate-800 hover:bg-primary/10"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5 text-primary" /> Move Selected ({selectedContactIds.length})
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setIsBulkDeleteModalOpen(true)}
                    className="h-8 text-xs font-bold gap-1.5 shadow-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Selected ({selectedContactIds.length})
                  </Button>
                </div>
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
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => handleOpenAddRecipient(selectedSector !== "all" ? selectedSector : undefined)}
                  className="h-8 text-xs font-bold bg-primary text-black hover:bg-primary/90 gap-1.5 shadow-xs"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {selectedSector !== "all" ? `Add Recipient to ${getGroupName(selectedSector)}` : "Add Recipient"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setImporterDefaultSector(selectedSector !== "all" ? selectedSector : "hotel");
                    setIsImporterOpen(true);
                  }}
                  className="h-8 text-xs font-bold gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" /> Import Contacts
                </Button>
              </div>
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

                      {/* Sector Badges & Actions */}
                      <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-1.5">
                        {(() => {
                          const contactSectors: string[] = Array.isArray(c.sectors) && c.sectors.length > 0
                            ? c.sectors
                            : [c.sector || "general"];

                          return (
                            <div className="flex items-center gap-1 flex-wrap justify-end max-w-[130px]">
                              {contactSectors.slice(0, 2).map((secId) => {
                                const label = getGroupName(secId);
                                return (
                                  <Badge
                                    key={secId}
                                    variant="outline"
                                    className="text-[9px] font-bold py-0.5 px-1.5 bg-slate-50 border-slate-200 truncate max-w-[80px]"
                                    title={label}
                                  >
                                    {label.split(" ")[0]}
                                  </Badge>
                                );
                              })}
                              {contactSectors.length > 2 && (
                                <Badge variant="secondary" className="text-[8px] font-bold py-0 px-1">
                                  +{contactSectors.length - 2}
                                </Badge>
                              )}
                            </div>
                          );
                        })()}

                        {/* Edit Recipient or Reassign Group */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditRecipient(c)}
                          className="h-7 w-7 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-slate-900 flex items-center justify-center transition-colors shrink-0"
                          title="Edit recipient or change group"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>

                        {/* Remove Recipient from Group / Delete */}
                        <button
                          type="button"
                          disabled={deletingId === c.id}
                          onClick={() => handleOpenRemoveRecipient(c)}
                          className="h-7 w-7 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 flex items-center justify-center transition-colors shrink-0"
                          title={selectedSector !== "all" ? `Remove recipient from ${groupLabel}` : "Delete recipient"}
                        >
                          {selectedSector !== "all" ? (
                            <UserMinus className="h-3.5 w-3.5" />
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

      {/* ======================================================== */}
      {/* 6. ADD RECIPIENT MODAL                                  */}
      {/* ======================================================== */}
      <Dialog open={isAddRecipientModalOpen} onOpenChange={setIsAddRecipientModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-primary mb-1">
              <div className="h-9 w-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Add Recipient
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Add an individual recipient directly into a target contact group
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveRecipient} className="space-y-4 py-2">
            {/* Target Group Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Contact Group</Label>
              <Select
                value={addRecipientSector}
                onValueChange={(val) => setAddRecipientSector(val)}
              >
                <SelectTrigger className="h-9 text-xs font-semibold bg-white">
                  <SelectValue placeholder="Select target group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="text-xs font-medium">
                      <div className="flex items-center gap-2">
                        {renderGroupIcon(g.id)}
                        <span>{g.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  placeholder="recipient@example.com"
                  value={addRecipientEmail}
                  onChange={(e) => setAddRecipientEmail(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Full Name or Title</Label>
              <Input
                type="text"
                placeholder="e.g. John Doe / General Manager"
                value={addRecipientName}
                onChange={(e) => setAddRecipientName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Organization & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Organization</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="e.g. Kigali Serena Hotel"
                    value={addRecipientOrg}
                    onChange={(e) => setAddRecipientOrg(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="+250 788 123 456"
                    value={addRecipientPhone}
                    onChange={(e) => setAddRecipientPhone(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={isSavingRecipient}
                onClick={() => setIsAddRecipientModalOpen(false)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingRecipient || !addRecipientEmail.trim()}
                className="text-xs h-9 font-bold bg-primary text-black hover:bg-primary/90 gap-1.5"
              >
                {isSavingRecipient ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Save Recipient
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 7. EDIT RECIPIENT MODAL                                 */}
      {/* ======================================================== */}
      {editingContact && (
        <Dialog open={Boolean(editingContact)} onOpenChange={() => setEditingContact(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2.5 text-slate-800 mb-1">
                <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Edit Recipient
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Update recipient contact details or change group assignment
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleUpdateRecipient} className="space-y-4 py-2">
              {/* Email (Readonly ID) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    disabled
                    value={editRecipientEmail}
                    className="pl-9 h-9 text-xs bg-slate-50 font-mono text-slate-600"
                  />
                </div>
              </div>

              {/* Contact Group Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Contact Group</Label>
                <Select
                  value={editRecipientSector}
                  onValueChange={(val) => setEditRecipientSector(val)}
                >
                  <SelectTrigger className="h-9 text-xs font-semibold bg-white">
                    <SelectValue placeholder="Select target group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id} className="text-xs font-medium">
                        <div className="flex items-center gap-2">
                          {renderGroupIcon(g.id)}
                          <span>{g.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Full Name or Title</Label>
                <Input
                  type="text"
                  placeholder="e.g. John Doe / General Manager"
                  value={editRecipientName}
                  onChange={(e) => setEditRecipientName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Organization & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Organization</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="e.g. Kigali Serena Hotel"
                      value={editRecipientOrg}
                      onChange={(e) => setEditRecipientOrg(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="+250 788 123 456"
                      value={editRecipientPhone}
                      onChange={(e) => setEditRecipientPhone(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUpdatingRecipient}
                  onClick={() => setEditingContact(null)}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingRecipient}
                  className="text-xs h-9 font-bold bg-primary text-black hover:bg-primary/90 gap-1.5"
                >
                  {isUpdatingRecipient ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ======================================================== */}
      {/* 8. REMOVE RECIPIENT MODAL                               */}
      {/* ======================================================== */}
      {contactToRemove && (
        <Dialog open={Boolean(contactToRemove)} onOpenChange={() => setContactToRemove(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2.5 text-red-600 mb-1">
                <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <UserMinus className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Remove Recipient
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {contactToRemove.name ? `${contactToRemove.name} (${contactToRemove.email})` : contactToRemove.email}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {contactToRemove.sector && contactToRemove.sector !== "general" ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border bg-amber-50/80 border-amber-200 text-amber-900 space-y-1">
                    <p className="font-semibold text-[11px] leading-relaxed">
                      Recipient is currently assigned to group: <strong className="font-bold underline">{getGroupName(contactToRemove.sector)}</strong>.
                      Choose an action:
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="radio"
                        name="removeRecipientMode"
                        value="remove_from_group"
                        checked={removeRecipientMode === "remove_from_group"}
                        onChange={() => setRemoveRecipientMode("remove_from_group")}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Remove from "{getGroupName(contactToRemove.sector)}"</div>
                        <div className="text-[11px] text-muted-foreground">
                          Keeps the recipient saved in SANEX, but reassigns them to General Institutions.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-red-200 bg-red-50/50 cursor-pointer hover:bg-red-50 transition-colors">
                      <input
                        type="radio"
                        name="removeRecipientMode"
                        value="delete_permanent"
                        checked={removeRecipientMode === "delete_permanent"}
                        onChange={() => setRemoveRecipientMode("delete_permanent")}
                        className="mt-0.5 text-red-600"
                      />
                      <div>
                        <div className="font-bold text-red-700">Delete Permanently</div>
                        <div className="text-[11px] text-red-600">
                          Completely deletes this recipient and their contact details from the database.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border bg-slate-50 text-slate-700">
                  <p>
                    Are you sure you want to permanently delete recipient <strong className="text-slate-900">{contactToRemove.email}</strong> from your address book?
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={isRemovingRecipient}
                onClick={() => setContactToRemove(null)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={removeRecipientMode === "delete_permanent" ? "destructive" : "default"}
                disabled={isRemovingRecipient}
                onClick={handleExecuteRemoveRecipient}
                className={`text-xs h-9 font-bold gap-1.5 ${
                  removeRecipientMode === "delete_permanent"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {isRemovingRecipient ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : removeRecipientMode === "delete_permanent" ? (
                  <Trash2 className="h-4 w-4" />
                ) : (
                  <UserMinus className="h-4 w-4" />
                )}
                {removeRecipientMode === "delete_permanent" ? "Delete Permanently" : "Remove from Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ======================================================== */}
      {/* 9. MOVE SELECTED TO GROUP MODAL                         */}
      {/* ======================================================== */}
      <Dialog open={isMoveGroupModalOpen} onOpenChange={setIsMoveGroupModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-primary mb-1">
              <div className="h-9 w-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Move Recipients to Group
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Reassign {selectedContactIds.length} selected recipient(s) to another contact group
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Select Destination Group</Label>
              <Select
                value={moveTargetGroup}
                onValueChange={(val) => setMoveTargetGroup(val)}
              >
                <SelectTrigger className="h-9 text-xs font-semibold bg-white">
                  <SelectValue placeholder="Select target group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="text-xs font-medium">
                      <div className="flex items-center gap-2">
                        {renderGroupIcon(g.id)}
                        <span>{g.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignment Mode: Add to Group vs Move Exclusively */}
            <div className="space-y-1.5 pt-1 border-t">
              <Label className="text-xs font-bold text-foreground">Assignment Action:</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMoveMode("add")}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    moveMode === "add"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5 text-primary" /> Add to Group
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                    Keep in current group AND also include in new group
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMoveMode("move")}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    moveMode === "move"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-slate-700" /> Move Exclusively
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                    Transfer completely out of current group to new group
                  </div>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isMovingGroup}
              onClick={() => setIsMoveGroupModalOpen(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isMovingGroup}
              onClick={handleExecuteMoveGroup}
              className="text-xs h-9 font-bold bg-primary text-black hover:bg-primary/90 gap-1.5"
            >
              {isMovingGroup ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : moveMode === "add" ? (
                <UserPlus className="h-4 w-4" />
              ) : (
                <ArrowRightLeft className="h-4 w-4" />
              )}
              {moveMode === "add" ? "Add" : "Move"} {selectedContactIds.length} Contact(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
