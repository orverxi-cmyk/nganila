
"use client";

import React from "react";
import Link from "next/link";
import { Edit3 } from "lucide-react";
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
    <section className="py-2.5 bg-background relative group overflow-hidden">
      {isAdmin && (
        <div className="absolute inset-0 z-20 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button asChild className="pointer-events-auto bg-black text-white hover:bg-black/80 gap-2 font-bold text-[14px]">
            <Link href="/admin/content?tab=impact">
              <Edit3 className="h-4 w-4" /> Edit Impact
            </Link>
          </Button>
        </div>
      )}
      <div className="container mx-auto px-4 md:px-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-5 space-y-1">
          <h2 className="text-[16px] font-bold leading-tight">{content.title}</h2>
          <p className="text-[14px] font-normal text-muted-foreground max-w-3xl mx-auto">{content.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {content.items.map((impact: any, i: number) => (
            <div 
              key={i} 
              className="p-8 rounded-2xl bg-primary text-black border border-black/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 shadow-lg flex flex-col space-y-4"
            >
              <div className="border-b border-black/15 pb-3">
                <h4 className="text-[17px] font-bold text-black font-headline leading-tight">
                  {impact.title}
                </h4>
              </div>
              
              <div className="space-y-3.5">
                {impact.points?.map((point: string, pi: number) => (
                  <div 
                    key={pi} 
                    className="text-[14px] font-medium text-black/90 leading-relaxed" 
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
