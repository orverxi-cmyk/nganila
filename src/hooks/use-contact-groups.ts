"use client";

import { useMemo, useCallback } from "react";
import { useFirestore, useDoc } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import {
  ContactGroup,
  DEFAULT_CONTACT_GROUPS,
  generateUniqueGroupId,
  purgeContactsBatch,
  reassignContactsBatch,
} from "@/lib/contact-groups";

const LOCAL_STORAGE_KEY = "sanex_custom_contact_groups";

export function useContactGroups() {
  const db = useFirestore();

  const groupsDocRef = useMemo(() => {
    if (!db) return null;
    return doc(db, "settings", "contact_groups");
  }, [db]);

  const { data: rawDocData, loading } = useDoc(groupsDocRef);
  const groupsDocData = rawDocData as { groups?: ContactGroup[] } | null;

  // Computed groups list with graceful local cache fallback
  const groups: ContactGroup[] = useMemo(() => {
    if (groupsDocData && Array.isArray(groupsDocData.groups) && groupsDocData.groups.length > 0) {
      return groupsDocData.groups.map((g) => ({ ...g, label: g.name }));
    }

    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((g: ContactGroup) => ({ ...g, label: g.name }));
          }
        }
      } catch {
        // Fallback to defaults
      }
    }

    return DEFAULT_CONTACT_GROUPS.map((g) => ({ ...g, label: g.name }));
  }, [groupsDocData]);

  // Persist updated groups to Firestore and localStorage
  const persistGroups = useCallback(
    async (newGroups: ContactGroup[]) => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newGroups));
        } catch {
          // Ignore storage quota warnings
        }
      }

      if (db) {
        await setDoc(
          doc(db, "settings", "contact_groups"),
          {
            groups: newGroups,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      }
    },
    [db]
  );

  // Add a new group
  const addGroup = useCallback(
    async (info: { name: string; description?: string }): Promise<ContactGroup> => {
      const trimmedName = info.name.trim();
      if (!trimmedName) {
        throw new Error("Group name is required.");
      }

      const newId = generateUniqueGroupId(trimmedName, groups);
      const newGroup: ContactGroup = {
        id: newId,
        name: trimmedName,
        label: trimmedName,
        description: info.description?.trim() || "",
        isDefault: false,
        createdAt: Date.now(),
      };

      const updated = [...groups, newGroup];
      await persistGroups(updated);
      return newGroup;
    },
    [groups, persistGroups]
  );

  // Remove a group with optional purge or reassignment of its contacts
  const removeGroup = useCallback(
    async (
      groupId: string,
      options?: {
        actionOnContacts?: "purge" | "move_to_general";
        contactIds?: string[];
        onProgress?: (progress: number, total: number) => void;
      }
    ) => {
      if (
        options?.actionOnContacts === "purge" &&
        options.contactIds &&
        options.contactIds.length > 0 &&
        db
      ) {
        await purgeContactsBatch(db, options.contactIds, options.onProgress);
      } else if (
        options?.actionOnContacts === "move_to_general" &&
        options.contactIds &&
        options.contactIds.length > 0 &&
        db
      ) {
        await reassignContactsBatch(db, options.contactIds, "general", options.onProgress);
      }

      const updated = groups.filter((g) => g.id !== groupId);
      const finalGroups = updated.length > 0 ? updated : DEFAULT_CONTACT_GROUPS;
      await persistGroups(finalGroups);
    },
    [groups, db, persistGroups]
  );

  // Reset to original default sectors
  const resetToDefaults = useCallback(async () => {
    await persistGroups(DEFAULT_CONTACT_GROUPS);
  }, [persistGroups]);

  // Lookup group by id
  const getGroup = useCallback(
    (id: string): ContactGroup | undefined => {
      return groups.find((g) => g.id === id);
    },
    [groups]
  );

  // Formatted display name for any group or "all"
  const getGroupName = useCallback(
    (id: string): string => {
      if (id === "all") return "All Contacts";
      const found = groups.find((g) => g.id === id);
      return found ? found.name : id.charAt(0).toUpperCase() + id.slice(1);
    },
    [groups]
  );

  return {
    groups,
    loading,
    addGroup,
    removeGroup,
    resetToDefaults,
    getGroup,
    getGroupName,
  };
}
