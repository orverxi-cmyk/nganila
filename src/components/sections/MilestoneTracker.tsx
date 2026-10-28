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

  const defaultMilestones = [
    { year: "ASSERWA", title: "Verified Member", description: "Official member of the Forum of Sewage Emptiers in Rwanda.", icon: "shield" },
    { year: "5 Trucks", title: "Modern Fleet", description: "Fleet of 5 vacuum tankers serving residential and commercial clients.", icon: "rocket" },
    { year: "Kicukiro", title: "Kigali & Rwanda", description: "Strategic base providing rapid response liquid waste solutions.", icon: "clock" }
  ];

  const content = {
    title: milestonesData?.title || "Who We Are",
    description: milestonesData?.description || `
      <p><strong>Nganila Co LTD</strong> is a professional waste management and sanitation company operating in Kicukiro, Kigali, Rwanda. The company is a verified member of <strong>ASSERWA</strong> (the Forum of Sewage Emptiers in Rwanda).</p>
      <p>We specialize in decentralized wastewater treatment, professional septic tank emptying, pit latrine draining (kuvidura), and wastewater transportation. Operating a fleet of 5 vacuum tankers, we transport liquid waste safely to treatment facilities, promoting public health and environmental sustainability.</p>
    `,
    items: milestonesData?.items?.length ? milestonesData.items : defaultMilestones
  };

  const getIcon = (name: string) => {
    const iconClass = "h-5 w-5 text-white";
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
        <div className="absolute inset-0 z-20 bg-sky-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button asChild className="pointer-events-auto bg-slate-900 text-white hover:bg-slate-800 gap-2 font-bold text-[14px] rounded-full shadow-lg">
            <Link href="/admin/content?tab=milestones">
              <Edit3 className="h-4 w-4" /> Edit Who We Are
            </Link>
          </Button>
        </div>
      )}
      <div className="container mx-auto px-4 md:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column: Who We Are Story */}
          <div className="space-y-6 lg:col-span-7 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                <Shield className="h-3.5 w-3.5" />
                <span>Verified ASSERWA Sanitation Partner</span>
              </div>
              <h2 className="text-[26px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight leading-tight">
                {content.title}
              </h2>
              <div 
                className="text-[15px] text-slate-600 leading-relaxed space-y-4 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content.description }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50/70 to-slate-50 border border-sky-100 border-l-4 border-l-sky-500 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-sky-600" />
                  <h3 className="text-[16px] font-bold text-slate-900">Our Vision</h3>
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  To be Rwanda's leading provider of sustainable liquid waste management, fostering cleaner communities across Kigali.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50/70 to-slate-50 border border-sky-100 border-l-4 border-l-cyan-500 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-cyan-600" />
                  <h3 className="text-[16px] font-bold text-slate-900">Our Mission</h3>
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  To deliver dependable, hygienic, and compliant septic evacuation (kuvidura) and decentralized treatment operations.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Evolution & Operational Highlights */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-7 lg:p-9 shadow-xl shadow-slate-900/10 lg:col-span-5 flex flex-col justify-between border border-slate-800">
            <div>
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800">
                <h3 className="text-[18px] font-bold text-white tracking-tight">Our Evolution &amp; Fleet</h3>
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider bg-sky-950/80 border border-sky-800 px-2.5 py-1 rounded-full">
                  Verified ASSERWA
                </span>
              </div>
              
              <div className="relative space-y-8">
                {/* Vertical line */}
                <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-slate-800 z-0" />
                
                {content.items.map((milestone: any, i: number) => (
                  <div key={i} className="relative z-10 flex gap-5 items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/30">
                      {getIcon(milestone.icon)}
                    </div>
                    <div className="flex-grow pt-0.5">
                      <div className="text-[12px] font-bold uppercase tracking-wider text-sky-400 mb-0.5">{milestone.year}</div>
                      <h4 className="text-[16px] font-bold text-white mb-1">{milestone.title}</h4>
                      <div 
                        className="text-[13px] text-slate-300 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: milestone.description }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80 text-[12px] text-slate-400 flex items-center justify-between">
              <span>📍 Kicukiro, Kigali, Rwanda</span>
              <span className="text-sky-400 font-semibold">Fleet of 5 Tankers</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
