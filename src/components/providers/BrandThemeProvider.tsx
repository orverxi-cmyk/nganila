"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { BrandSettings, DEFAULT_BRAND_SETTINGS, generateBrandCss } from "@/lib/brand-theme";

interface BrandThemeContextType {
  settings: BrandSettings;
  isLoaded: boolean;
  refreshSettings: () => Promise<void>;
}

const BrandThemeContext = createContext<BrandThemeContextType>({
  settings: DEFAULT_BRAND_SETTINGS,
  isLoaded: false,
  refreshSettings: async () => {},
});

export function useBrandTheme() {
  return useContext(BrandThemeContext);
}

export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const db = useFirestore();
  const [settings, setSettings] = useState<BrandSettings>(() => {
    // Try synchronous read from localStorage for instant, zero-flicker render
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("nganila_setting_general");
        if (cached) {
          const parsed = JSON.parse(cached);
          return { ...DEFAULT_BRAND_SETTINGS, ...parsed };
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_BRAND_SETTINGS;
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Real-time Firestore sync
  const generalDocRef = useMemo(() => (db ? doc(db, "settings", "general") : null), [db]);
  const { data: firestoreData } = useDoc(generalDocRef);

  // Apply CSS variables and style block to DOM
  const applyThemeToDom = (brandData: BrandSettings) => {
    if (typeof document === "undefined") return;

    let styleEl = document.getElementById("brand-theme-styles") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "brand-theme-styles";
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = generateBrandCss(brandData);
  };

  // 1. Initial server API fetch as fallback/verification
  const refreshSettings = async () => {
    try {
      const res = await fetch("/api/settings?section=general");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setSettings((prev) => {
            const merged = { ...prev, ...data.data };
            applyThemeToDom(merged);
            try {
              localStorage.setItem("nganila_setting_general", JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn("[BrandThemeProvider] Error fetching settings:", err);
    } finally {
      setIsLoaded(true);
    }
  };

  // Run on mount
  useEffect(() => {
    applyThemeToDom(settings);
    refreshSettings();
  }, []);

  // Sync when Firestore updates
  useEffect(() => {
    if (firestoreData) {
      setSettings((prev) => {
        const merged = { ...prev, ...firestoreData };
        applyThemeToDom(merged);
        try {
          localStorage.setItem("nganila_setting_general", JSON.stringify(merged));
        } catch {}
        return merged;
      });
      setIsLoaded(true);
    }
  }, [firestoreData]);

  return (
    <BrandThemeContext.Provider value={{ settings, isLoaded, refreshSettings }}>
      {children}
    </BrandThemeContext.Provider>
  );
}

