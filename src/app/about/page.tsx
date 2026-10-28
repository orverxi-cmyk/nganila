
"use client";

import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { MilestoneTracker } from "@/components/sections/MilestoneTracker";
import { Highlights } from "@/components/sections/Highlights";
import { RegionalPortal } from "@/components/sections/RegionalPortal";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";

export default function AboutPage() {
  const db = useFirestore();
  const generalRef = React.useMemo(() => (db ? doc(db, "settings", "general") : null), [db]);
  const milestonesRef = React.useMemo(() => (db ? doc(db, "settings", "milestones") : null), [db]);
  const { data: generalData } = useDoc(generalRef);
  const { data: milestonesData } = useDoc(milestonesRef);

  const siteName = generalData?.siteName || "Nganira Company LTD";
  const title = milestonesData?.title || `About ${siteName}`;
  const subtitle = generalData?.description || "";

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-gradient-to-r from-[#636679] via-[#454755] to-[#26272e] py-10 border-b border-[#545667]">
          <div className="container mx-auto px-4 md:px-16 text-center">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-3 text-slate-200 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        <MilestoneTracker />
        
        <div className="bg-[#f6f6f8] py-14 border-t border-[#d9dadf]">
          <div className="container mx-auto px-4 md:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
              <RegionalPortal />
              <Highlights />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
