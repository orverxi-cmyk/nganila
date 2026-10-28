"use client";

import React from "react";
import { 
  Clock, 
  Shield, 
  Rocket, 
  TrendingUp,
  Edit3
} from "lucide-react";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function MilestoneTracker() {
  const db = useFirestore();
  const { user } = useUser();
  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile } = useDoc(userDocRef);
  const isAdmin = userProfile?.role === "admin";

  const milestonesRef = React.useMemo(() => (db ? doc(db, "settings", "milestones") : null), [db]);
  const { data: milestonesData } = useDoc(milestonesRef);

  const title = milestonesData?.title || "";
  const description = milestonesData?.description || "";
  const vision = milestonesData?.vision || "";
  const mission = milestonesData?.mission || "";
  const items: any[] = Array.isArray(milestonesData?.items) ? milestonesData.items : [];

  const getIcon = (name: string) => {
    const iconClass = "h-5 w-5 text-[#26272e]";
    const normalized = name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'clock';
    switch (normalized) {
      case 'clock': return <Clock className={iconClass} />;
      case 'shield': return <Shield className={iconClass} />;
      case 'rocket': return <Rocket className={iconClass} />;
      default: return <Clock className={iconClass} />;
    }
  };

  return (
    <section className="py-12 lg:py-16 bg-white relative group">
      {isAdmin && (
        <div className="absolute inset-0 z-20 bg-[#636679]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button asChild className="pointer-events-auto bg-[#636679] text-white hover:bg-[#545667] gap-2 font-bold text-[14px] rounded-xl shadow-lg">
            <Link href="/admin/content?tab=milestones">
              <Edit3 className="h-4 w-4 text-[#d9eaa4]" /> Edit Who We Are
            </Link>
          </Button>
        </div>
      )}
      <div className="container mx-auto px-4 md:px-16">
        <div className={`grid grid-cols-1 ${items.length > 0 ? 'lg:grid-cols-12' : ''} gap-10 items-stretch`}>
          {/* Left Column: Who We Are Story */}
          <div className={`space-y-6 ${items.length > 0 ? 'lg:col-span-7' : 'max-w-4xl mx-auto'} flex flex-col justify-between`}>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#d9eaa4]/40 text-[#383944] border border-[#d9eaa4]">
                <Shield className="h-3.5 w-3.5 text-[#636679]" />
                <span>Verified ASSERWA Sanitation Partner</span>
              </div>
              {title && (
                <h2 className="text-[26px] sm:text-[32px] font-extrabold text-[#26272e] tracking-tight leading-tight">
                  {title}
                </h2>
              )}
              {description && (
                <div 
                  className="text-[15px] text-[#636679] leading-relaxed space-y-4 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              )}
            </div>

            {(vision || mission) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {vision && (
                  <div className="p-5 rounded-2xl bg-[#f6f6f8] border border-[#d9dadf] border-l-4 border-l-[#636679] shadow-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-[#636679]" />
                      <h3 className="text-[16px] font-bold text-[#26272e]">Our Vision</h3>
                    </div>
                    <p className="text-[13px] text-[#636679] leading-relaxed">{vision}</p>
                  </div>
                )}

                {mission && (
                  <div className="p-5 rounded-2xl bg-[#f6f6f8] border border-[#d9dadf] border-l-4 border-l-[#d9eaa4] shadow-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-[#636679]" />
                      <h3 className="text-[16px] font-bold text-[#26272e]">Our Mission</h3>
                    </div>
                    <p className="text-[13px] text-[#636679] leading-relaxed">{mission}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Evolution & Operational Highlights */}
          {items.length > 0 && (
            <div className="bg-gradient-to-br from-[#636679] via-[#454755] to-[#26272e] text-white rounded-3xl p-7 lg:p-9 shadow-xl shadow-[#636679]/10 lg:col-span-5 flex flex-col justify-between border border-[#545667]">
              <div>
                <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#545667]">
                  <h3 className="text-[18px] font-bold text-white tracking-tight">Our Evolution &amp; Fleet</h3>
                  <span className="text-[11px] font-bold text-[#26272e] uppercase tracking-wider bg-[#d9eaa4] border border-[#cbe090] px-2.5 py-1 rounded-full">
                    Verified ASSERWA
                  </span>
                </div>
                
                <div className="relative space-y-8">
                  {/* Vertical line */}
                  <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-[#545667] z-0" />
                  
                  {items.map((milestone: any, i: number) => (
                    <div key={i} className="relative z-10 flex gap-5 items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-[#d9eaa4] flex items-center justify-center shadow-lg shadow-[#d9eaa4]/20 border border-[#cbe090]">
                        {getIcon(milestone.icon)}
                      </div>
                      <div className="flex-grow pt-0.5">
                        <div className="text-[12px] font-bold uppercase tracking-wider text-[#d9eaa4] mb-0.5">{milestone.year}</div>
                        <h4 className="text-[16px] font-bold text-white mb-1">{milestone.title}</h4>
                        <div 
                          className="text-[13px] text-slate-200 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: milestone.description }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
