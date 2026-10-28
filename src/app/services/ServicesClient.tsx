"use client";

import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Services } from "@/components/sections/Services";
import { RegionalPortal } from "@/components/sections/RegionalPortal";
import { Highlights } from "@/components/sections/Highlights";
import { VideoHighlight } from "@/components/sections/VideoHighlight";
import { Hero } from "@/components/sections/Hero";

export function ServicesClient() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 py-10 border-b border-sky-900/30">
          <div className="container mx-auto px-4 md:px-16 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-950/80 border border-sky-500/30 rounded-full text-xs font-semibold text-sky-400 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Fleet of 5 Vacuum Tankers · Verified ASSERWA Member</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">Our Sanitation Solutions</h1>
            <p className="mt-3 text-sky-100/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Professional, eco-friendly, and compliant liquid waste evacuation, decentralized wastewater treatment, and vacuum tanker transportation across Rwanda.
            </p>
          </div>
        </div>
        <Hero />
        <Services />
        <VideoHighlight />
        
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
