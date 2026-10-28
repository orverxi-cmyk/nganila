"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Edit3 } from "lucide-react";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";

export function RegionalPortal() {
  const db = useFirestore();
  const { user } = useUser();
  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile } = useDoc(userDocRef);
  const isAdmin = userProfile?.role === "admin";

  const regionalRef = React.useMemo(() => (db ? doc(db, "settings", "regional") : null), [db]);
  const { data: regionalData } = useDoc(regionalRef);

  const items: any[] = Array.isArray(regionalData?.items) ? regionalData.items : [];
  const title = regionalData?.title || "";
  const description = regionalData?.description || "";

  if (items.length === 0 && !title && !description) {
    if (isAdmin) {
      return (
        <div className="p-6 border border-dashed rounded-2xl text-center">
          <p className="text-xs text-muted-foreground mb-2">Our Presence section has no items yet.</p>
          <Button asChild size="sm" className="bg-[#636679] text-white hover:bg-[#545667] text-[10px] font-bold">
            <Link href="/admin/content?tab=regional"><Edit3 className="mr-1 h-3 w-3" /> Edit Our Presence</Link>
          </Button>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="relative group">
      {isAdmin && (
        <div className="absolute -inset-2 z-20 bg-[#636679]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-2xl">
          <Button asChild className="pointer-events-auto bg-[#636679] text-white hover:bg-[#545667] gap-2 font-bold text-xs rounded-xl shadow-md">
            <Link href="/admin/content?tab=regional">
              <Edit3 className="h-4 w-4 text-[#006400]" /> Edit Our Presence
            </Link>
          </Button>
        </div>
      )}
      
      {(title || description) && (
        <div className="space-y-2 mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#636679]">Operational Reach</span>
          {title && <h2 className="text-xl font-extrabold text-[#26272e] tracking-tight">{title}</h2>}
          {description && <p className="text-xs text-[#636679] leading-relaxed">{description}</p>}
        </div>
      )}

      <div className="space-y-4">
        {/* Nationwide Status Card */}
        <div className="p-4 rounded-2xl bg-[#006400]/10 border border-[#006400]/30 shadow-xs">
          <div className="flex gap-3.5 items-center">
            <div className="h-10 w-10 rounded-xl bg-white border border-[#006400]/30 flex items-center justify-center text-[#636679] shadow-xs">
              <div className="h-3 w-3 rounded-full bg-[#006400] animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#26272e]">Rwanda Nationwide Coverage</div>
              <div className="text-xs text-[#636679]">Strategic Hub in Kicukiro, Kigali · Nationwide Deployment</div>
            </div>
          </div>
        </div>

        {/* Vertical Stack of Regions */}
        <div className="space-y-3">
          {items.map((region: any, i: number) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-[#d9dadf] shadow-xs hover:border-[#636679]/40 transition-all group/card">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-[#26272e] group-hover/card:text-[#636679] transition-colors">{region.name}</h3>
                <div className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#006400]/10 text-[#006400] border border-[#006400]/30">ACTIVE</div>
              </div>
              
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-xs text-[#636679]">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                  <span>{region.status}</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-[#636679]">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#636679] flex-shrink-0" />
                  <span>{region.capacity}</span>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
