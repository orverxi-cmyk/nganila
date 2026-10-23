"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useFirestore, useDoc, useUser } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import type { EmailBlock } from "@/lib/email-template-compiler";
import { compileBlocksToHtml, INITIAL_SANEX_BLOCKS } from "@/lib/email-template-compiler";
import {
  Publication,
  extractFirstImage,
  extractExcerptFromHtml,
} from "@/lib/publications";

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

  // Fallback to server template endpoint to guarantee active custom email is loaded even if client Firestore has permission delays
  const [apiTemplate, setApiTemplate] = useState<CloudEmailTemplate | null>(null);

  useEffect(() => {
    fetch("/api/email/template")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.template) {
          setApiTemplate(data.template);
        }
      })
      .catch(() => {});
  }, []);

  const cloudTemplate = useMemo(() => {
    if (apiTemplate && rawCloudTemplate) {
      return (apiTemplate.updatedAt || 0) >= ((rawCloudTemplate as any).updatedAt || 0)
        ? apiTemplate
        : (rawCloudTemplate as CloudEmailTemplate);
    }
    return apiTemplate || (rawCloudTemplate as CloudEmailTemplate | null);
  }, [apiTemplate, rawCloudTemplate]);
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
    }): Promise<{
      success: boolean;
      template?: CloudEmailTemplate;
      error?: string;
      publicationUrl?: string;
    }> => {
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

      // 2. Persist via server route (/api/email/template) ensuring server-level credentials handle Firestore writes
      try {
        const token = user ? await user.getIdToken().catch(() => "") : "";
        const apiRes = await fetch("/api/email/template", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: payload.name,
            message: payload.message,
            mode: payload.mode,
            blocks: payload.blocks,
            userEmail: user?.email || "admin@sanex.rw",
          }),
        });

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.success) {
            if (apiData.template) {
              setApiTemplate(apiData.template);
            }
            setSyncStatus("synced");
            setLastSyncTime(new Date());
            return {
              success: true,
              template: apiData.template || payload,
              publicationUrl: apiData.publicationUrl,
            };
          }
        }
      } catch (apiErr) {
        console.warn("[saveActiveTemplateToCloud] API fallback:", apiErr);
      }


      // 3. Fallback direct client write (guarded without noisy console error)
      if (db) {
        try {
          await setDoc(doc(db, "settings", "email_template"), payload, { merge: true });
        } catch {
          // Handled gracefully
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
