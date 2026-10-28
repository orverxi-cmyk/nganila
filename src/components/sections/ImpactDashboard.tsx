
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

  const defaultImpacts = [
    { 
      title: "Environmental Preservation", 
      points: [
        "<p>We have successfully treated and managed thousands of cubic meters of liquid waste, preventing harmful pollutants from contaminating natural ecosystems.</p>",
        "<p>Our decentralized wastewater treatment systems (DWTS) have contributed to cleaner water sources, promoting biodiversity and reducing environmental degradation.</p>"
      ]
    },
    { 
      title: "Public Health Improvement", 
      points: [
        "<p>By reducing the risks associated with poor liquid waste management, we have helped to mitigate waterborne diseases, improving the overall health and well-being of the communities we serve.</p>",
        "<p>Our awareness campaigns on waste management have empowered local populations to adopt safer practices, fostering healthier living.</p>"
      ]
    },
    { 
      title: "Job Creation & Community", 
      points: [
        "<p>Nganila Co LTD directly creates employment for professional drivers, sanitation operators, and technical staff in Kigali.</p>",
        "<p>We work closely with local authorities and communities to raise sanitation awareness and prevent unhygienic waste dumping.</p>"
      ]
    }
  ];

  const content = {
    title: impactData?.title || "Our Environmental & Community Impact",
    subtitle: impactData?.subtitle || "Operating from Kicukiro, Kigali, Nganila Co LTD provides responsible sanitation solutions that protect water sources and keep Rwandan communities clean.",
    items: (impactData?.items && impactData.items.length > 0 && impactData.items[0]?.points?.length > 1) 
      ? impactData.items 
      : defaultImpacts
  };

  return (
    <section className="py-14 lg:py-20 bg-gradient-to-b from-white via-sky-50/30 to-slate-50 relative group overflow-hidden border-t border-slate-100">
      {isAdmin && (
        <div className="absolute inset-0 z-20 bg-sky-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button asChild className="pointer-events-auto bg-slate-900 text-white hover:bg-slate-800 gap-2 font-bold text-[14px] rounded-full shadow-lg">
            <Link href="/admin/content?tab=impact">
              <Edit3 className="h-4 w-4" /> Edit Impact
            </Link>
          </Button>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-16 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
            <Droplets className="h-3.5 w-3.5 text-sky-600" />
            <span>Sustainable Environmental Stewardship</span>
          </div>
          <h2 className="text-[28px] sm:text-[34px] font-extrabold text-slate-900 tracking-tight leading-tight">
            {content.title}
          </h2>
          <p className="text-[15px] sm:text-[16px] text-slate-600 leading-relaxed">
            {content.subtitle}
          </p>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[24px] font-extrabold text-slate-900">5 Tankers</div>
              <div className="text-[12px] text-slate-500 font-medium">Dedicated Active Fleet</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[24px] font-extrabold text-slate-900">100% Certified</div>
              <div className="text-[12px] text-slate-500 font-medium">Verified ASSERWA Member</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[24px] font-extrabold text-slate-900">Kicukiro, Kigali</div>
              <div className="text-[12px] text-slate-500 font-medium">Centralized Strategic Hub</div>
            </div>
          </div>
        </div>

        {/* Impact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.items.map((impact: any, i: number) => (
            <div 
              key={i} 
              className="p-8 rounded-3xl bg-white text-slate-800 border border-slate-200/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-md flex flex-col space-y-4 relative group/card"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="text-[18px] font-bold text-slate-900 tracking-tight leading-tight">
                  {impact.title}
                </h4>
                <div className="h-8 w-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              
              <div className="space-y-3">
                {impact.points?.map((point: string, pi: number) => (
                  <div 
                    key={pi} 
                    className="text-[14px] text-slate-600 leading-relaxed font-normal" 
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
