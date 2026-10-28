
"use client";

import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { MilestoneTracker } from "@/components/sections/MilestoneTracker";
import { Highlights } from "@/components/sections/Highlights";
import { RegionalPortal } from "@/components/sections/RegionalPortal";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 py-10 border-b border-sky-900/30">
          <div className="container mx-auto px-4 md:px-16 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-950/80 border border-sky-500/30 rounded-full text-xs font-semibold text-sky-400 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Verified ASSERWA Member · Strategic Hub in Kicukiro</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">About Nganila Co LTD</h1>
            <p className="mt-3 text-sky-100/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Professional waste management and sanitation company operating in Kicukiro, Kigali, Rwanda. Operating a specialized fleet of 5 vacuum tankers for residential and commercial sanitation.
            </p>
          </div>
        </div>
        
        <MilestoneTracker />
        
        <div className="bg-slate-50 py-14 border-t border-slate-200">
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
