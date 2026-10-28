"use client";

import React from "react";
import Link from "next/link";
import { Edit3, CheckCircle2, Droplets, Heart, Users, Truck, ShieldCheck, MapPin } from "lucide-react";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";

export function ImpactDashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile } = useDoc(userDocRef);
  const isAdmin = userProfile?.role === "admin";

  const impactRef = React.useMemo(() => (db ? doc(db, "settings", "impact") : null), [db]);
  const { data: impactData } = useDoc(impactRef);

  const items: any[] = Array.isArray(impactData?.items) ? impactData.items : [];
  const title = impactData?.title || "";
  const subtitle = impactData?.subtitle || "";
  const stats: any[] = Array.isArray(impactData?.stats) ? impactData.stats : [];

  if (items.length === 0 && !title && !subtitle) {
    if (isAdmin) {
      return (
        <section className="py-12 bg-white text-center border-t border-[#d9dadf]">
          <p className="text-sm text-muted-foreground mb-3">Impact section has no content yet.</p>
          <Button asChild className="bg-[#636679] text-white hover:bg-[#545667] text-xs font-bold">
            <Link href="/admin/content?tab=impact"><Edit3 className="mr-1.5 h-4 w-4" /> Edit Impact</Link>
          </Button>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="py-14 lg:py-20 bg-gradient-to-b from-white via-[#f6f6f8] to-white relative group overflow-hidden border-t border-[#d9dadf]">
      {isAdmin && (
        <div className="absolute inset-0 z-20 bg-[#636679]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button asChild className="pointer-events-auto bg-[#636679] text-white hover:bg-[#545667] gap-2 font-bold text-[14px] rounded-xl shadow-lg">
            <Link href="/admin/content?tab=impact">
              <Edit3 className="h-4 w-4 text-[#006400]" /> Edit Impact
            </Link>
          </Button>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-16 relative z-10">
        {/* Section Header */}
        {(title || subtitle) && (
          <div className="max-w-3xl mx-auto text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#006400]/10 text-[#006400] border border-[#006400]/30">
              <Droplets className="h-3.5 w-3.5 text-[#006400]" />
              <span>Sustainable Environmental Stewardship</span>
            </div>
            {title && (
              <h2 className="text-[28px] sm:text-[34px] lg:text-[38px] font-extrabold text-[#26272e] tracking-tight leading-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-[15px] sm:text-[16px] text-[#636679] leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Live Metrics Row (from Firestore if present) */}
        {stats.length > 0 && (
          <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(stats.length, 4)} gap-5 mb-10`}>
            {stats.map((stat: any, si: number) => (
              <div key={si} className="bg-white rounded-2xl p-6 border border-[#d9dadf] shadow-md flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-[#006400]/10 border border-[#006400]/30 flex items-center justify-center text-[#006400] shrink-0">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[24px] font-extrabold text-[#26272e]">{stat.value}</div>
                  <div className="text-[12px] text-[#636679] font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Impact Cards: 1 column on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((impact: any, i: number) => (
            <div 
              key={i} 
              className="p-8 rounded-3xl bg-white text-slate-800 border border-[#d9dadf] hover:border-[#636679]/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-md flex flex-col space-y-4 relative group/card"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="text-[18px] font-bold text-[#26272e] tracking-tight leading-tight">
                  {impact.title}
                </h4>
                <div className="h-8 w-8 rounded-lg bg-[#006400]/10 flex items-center justify-center text-[#006400] shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              
              <div className="space-y-3">
                {impact.points?.map((point: string, pi: number) => (
                  <div 
                    key={pi} 
                    className="text-[14px] text-[#636679] leading-relaxed font-normal" 
                    dangerouslySetInnerHTML={{ __html: point.startsWith('<p>') ? point : `<p>${point}</p>` }} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
