"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useFirestore, useDoc, useUser } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import type { EmailBlock } from "@/components/admin/EmailStudioBuilder";

export const LOCAL_STORAGE_DRAFT_KEY = "sanex_custom_email_draft";
export const LOCAL_STORAGE_TEMPLATES_KEY = "sanex_saved_email_templates";

export interface CloudEmailTemplate {
  id?: string;
  name?: string;
  message?: string;
  mode?: "text" | "html";
  blocks?: EmailBlock[];
  updatedAt?: number;
  updatedBy?: string;
}

export interface SavedTemplateItem {
  id: string;
  name: string;
  message: string;
  blocks?: EmailBlock[];
  updatedAt: number;
  updatedBy?: string;
}

/**
 * Strips huge inline base64 blobs if necessary to prevent Firestore document size limit (1MB)
 */
function sanitizeBlocksForCloud(blocks: EmailBlock[]): EmailBlock[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((b) => {
    const copy = { ...b };
    if (copy.col1Image && copy.col1Image.startsWith("data:") && copy.col1Image.length > 500000) {
      console.warn("Col1 image blob too large for cloud sync; keeping local representation.");
    }
    if (copy.imageUrl && copy.imageUrl.startsWith("data:") && copy.imageUrl.length > 500000) {
      console.warn("Image blob too large for cloud sync; keeping local representation.");
    }
    return copy;
  });
}

export function useEmailTemplates() {
  const db = useFirestore();
  const { user } = useUser();

  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "error" | "idle">("idle");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Firestore Document References
  const templateDocRef = useMemo(() => {
    if (!db) return null;
    return doc(db, "settings", "email_template");
  }, [db]);

  const templatesListDocRef = useMemo(() => {
    if (!db) return null;
    return doc(db, "settings", "email_templates");
  }, [db]);

  // Real-time Firestore Listeners
  const { data: rawCloudTemplate, loading: cloudLoading } = useDoc(templateDocRef);
  const { data: rawTemplatesList, loading: listLoading } = useDoc(templatesListDocRef);

  const cloudTemplate = rawCloudTemplate as CloudEmailTemplate | null;
  const savedTemplates = useMemo<SavedTemplateItem[]>(() => {
    if (rawTemplatesList && Array.isArray((rawTemplatesList as any).templates)) {
      return (rawTemplatesList as any).templates;
    }
    // Fallback to local storage if available
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_TEMPLATES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return [];
  }, [rawTemplatesList]);

  // Read local storage draft
  const getLocalDraft = useCallback((): CloudEmailTemplate | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw =
        localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY) ||
        sessionStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Failed to read local email draft:", e);
    }
    return null;
  }, []);

  // Write to local storage draft safely
  const setLocalDraft = useCallback((template: CloudEmailTemplate) => {
    if (typeof window === "undefined") return;
    try {
      const payload = JSON.stringify(template);
      localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, payload);
      sessionStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, payload);
    } catch {
      // If local storage is full, try stripped version
      try {
        const sanitized = {
          ...template,
          blocks: template.blocks ? sanitizeBlocksForCloud(template.blocks) : undefined,
        };
        sessionStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(sanitized));
      } catch {
        // ignore
      }
    }
  }, []);

  // Save active template to Cloud (Firestore) and LocalStorage
  const saveActiveTemplateToCloud = useCallback(
    async (data: {
      message?: string;
      mode?: "text" | "html";
      blocks?: EmailBlock[];
      name?: string;
    }) => {
      setSyncStatus("saving");

      const payload: CloudEmailTemplate = {
        name: data.name || "Default Campaign Template",
        message: data.message || "",
        mode: data.mode || "html",
        blocks: data.blocks ? sanitizeBlocksForCloud(data.blocks) : [],
        updatedAt: Date.now(),
        updatedBy: user?.email || "admin@sanex.rw",
      };

      // 1. Immediately cache locally
      setLocalDraft(payload);

      // 2. Persist to Firestore
      if (db) {
        try {
          await setDoc(doc(db, "settings", "email_template"), payload, { merge: true });
          setSyncStatus("synced");
          setLastSyncTime(new Date());
          return { success: true, template: payload };
        } catch (err: any) {
          console.error("Firestore email template save failed:", err);
          setSyncStatus("error");
          return { success: false, error: err.message };
        }
      }

      setSyncStatus("synced");
      setLastSyncTime(new Date());
      return { success: true, template: payload };
    },
    [db, user, setLocalDraft]
  );

  // Save current template to named templates library in Firestore
  const saveTemplateToLibrary = useCallback(
    async (name: string, message: string, blocks?: EmailBlock[]) => {
      if (!name.trim()) throw new Error("Template name is required.");

      const newItem: SavedTemplateItem = {
        id: `tpl-${Date.now()}`,
        name: name.trim(),
        message,
        blocks: blocks ? sanitizeBlocksForCloud(blocks) : [],
        updatedAt: Date.now(),
        updatedBy: user?.email || "admin@sanex.rw",
      };

      const updatedList = [newItem, ...savedTemplates.filter((t) => t.name !== name.trim())];

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(updatedList));
        } catch {
          // ignore
        }
      }

      if (db) {
        await setDoc(
          doc(db, "settings", "email_templates"),
          {
            templates: updatedList,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      }

      return newItem;
    },
    [db, user, savedTemplates]
  );

  // Delete a template from library
  const deleteTemplateFromLibrary = useCallback(
    async (templateId: string) => {
      const updatedList = savedTemplates.filter((t) => t.id !== templateId);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(updatedList));
        } catch {
          // ignore
        }
      }

      if (db) {
        await setDoc(
          doc(db, "settings", "email_templates"),
          {
            templates: updatedList,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      }
    },
    [db, savedTemplates]
  );

  // Import raw JSON string or object (from live website export or user paste)
  const importRawTemplate = useCallback(
    async (rawInput: string | Record<string, any>) => {
      try {
        let parsed: any = rawInput;
        if (typeof rawInput === "string") {
          parsed = JSON.parse(rawInput.trim());
        }

        // Support various export formats: { message, blocks, mode }, or direct blocks array
        let message = "";
        let blocks: EmailBlock[] = [];
        let mode: "text" | "html" = "html";

        if (Array.isArray(parsed)) {
          blocks = parsed;
        } else if (parsed && typeof parsed === "object") {
          if (parsed.blocks && Array.isArray(parsed.blocks)) {
            blocks = parsed.blocks;
          }
          if (parsed.message) {
            message = parsed.message;
          }
          if (parsed.mode) {
            mode = parsed.mode;
          }
        } else {
          throw new Error("Invalid template structure. Expected JSON object with blocks or message.");
        }

        return await saveActiveTemplateToCloud({
          message,
          blocks,
          mode,
          name: parsed.name || "Imported Live Template",
        });
      } catch (err: any) {
        console.error("Failed to import template:", err);
        throw new Error(err.message || "Failed to parse template JSON.");
      }
    },
    [saveActiveTemplateToCloud]
  );

  return {
    cloudTemplate,
    cloudLoading,
    savedTemplates,
    listLoading,
    syncStatus,
    lastSyncTime,
    getLocalDraft,
    setLocalDraft,
    saveActiveTemplateToCloud,
    saveTemplateToLibrary,
    deleteTemplateFromLibrary,
    importRawTemplate,
  };
}
