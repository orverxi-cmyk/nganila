
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { 
  Truck, Settings, Droplets, Users, Loader2, ShieldCheck, Cpu, Globe, Zap, Award, Target, HardHat, Activity, Leaf, Heart, Scale, Sparkles, Clock, Rocket, Building, CheckCircle, Stethoscope, Edit3, ArrowRight, Phone, CheckCircle2, Calendar
} from "lucide-react";

export function Services() {
  const db = useFirestore();
  const { user } = useUser();
  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile } = useDoc(userDocRef);
  const isAdmin = userProfile?.role === "admin";

  const servicesRef = React.useMemo(() => (db ? doc(db, "settings", "services") : null), [db]);
  const { data: servicesData, loading } = useDoc(servicesRef);

  const defaultServices = [
    { 
      title: "Decentralized Wastewater Treatment", 
      description: "Managing localized wastewater systems and treatment units for residential, commercial, and institutional clients.", 
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779722491089_B25A3102.jpg?alt=media", 
      icon: "droplets" 
    },
    { 
      title: "Liquid Waste Evacuation", 
      description: "Providing professional septic tank emptying, pit latrine draining (kuvidura), and vacuum tanker services across Kigali and Rwanda.", 
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779723894783_vlcsnap-2025-04-19-16h01m39s409.png?alt=media", 
      icon: "truck" 
    },
    { 
      title: "Wastewater Transportation", 
      description: "Operating a dedicated fleet of 5 modern vacuum tankers to transport liquid waste safely and responsibly to treatment facilities.", 
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media", 
      icon: "truck" 
    },
    { 
      title: "Verified ASSERWA Member", 
      description: "Proud member of ASSERWA (the Forum of Sewage Emptiers in Rwanda), certified for professional standards and public hygiene.", 
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779722938429_WhatsApp%20Image%202025-04-19%20at%2020.13.41.jpeg?alt=media", 
      icon: "shield" 
    }
  ];

  const content = {
    title: servicesData?.title || "Our Core Services",
    subtitle: servicesData?.subtitle || "Nganila Co LTD offers professional, reliable waste management and sanitation services in Kicukiro, Kigali, and across Rwanda.",
    items: servicesData?.items?.length ? servicesData.items : defaultServices
  };

  const getIcon = (name: string) => {
    const iconClass = "h-4 w-4 text-primary";
    const normalized = name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'users';
    switch (normalized) {
      case 'truck': return <Truck className={iconClass} />;
      case 'droplets': return <Droplets className={iconClass} />;
      case 'settings': return <Settings className={iconClass} />;
      case 'users': return <Users className={iconClass} />;
      case 'shield': return <ShieldCheck className={iconClass} />;
      case 'cpu': return <Cpu className={iconClass} />;
      case 'globe': return <Globe className={iconClass} />;
      case 'zap': return <Zap className={iconClass} />;
      case 'award': return <Award className={iconClass} />;
      case 'target': return <Target className={iconClass} />;
      case 'hardhat': return <HardHat className={iconClass} />;
      case 'activity': return <Activity className={iconClass} />;
      case 'leaf': return <Leaf className={iconClass} />;
      case 'heart': return <Heart className={iconClass} />;
      case 'scale': return <Scale className={iconClass} />;
      case 'sparkles': return <Sparkles className={iconClass} />;
      case 'clock': return <Clock className={iconClass} />;
      case 'rocket': return <Rocket className={iconClass} />;
      case 'building': return <Building className={iconClass} />;
      case 'check': return <CheckCircle className={iconClass} />;
      case 'stethoscope': return <Stethoscope className={iconClass} />;
      default: return <Users className={iconClass} />;
    }
  };

  return (
    <section id="services" className="py-14 lg:py-20 bg-slate-50/50 relative group">
      {isAdmin && (
        <div className="absolute inset-0 z-20 bg-sky-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button asChild className="pointer-events-auto bg-slate-900 text-white hover:bg-slate-800 gap-2 font-bold rounded-full shadow-lg">
            <Link href="/admin/content?tab=services">
              <Edit3 className="h-4 w-4" /> Edit Services
            </Link>
          </Button>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-16">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-sky-600" />
            <span>Certified ASSERWA Operations · Kicukiro, Kigali</span>
          </div>
          <h2 className="text-[28px] sm:text-[34px] lg:text-[38px] font-extrabold text-slate-900 tracking-tight">
            {content.title}
          </h2>
          <p className="text-[15px] sm:text-[16px] text-slate-600 max-w-[760px] mx-auto leading-relaxed">
            {content.subtitle}
          </p>
        </div>

        {/* Side-by-Side Operational Featurettes */}
        <div className="space-y-10 lg:space-y-14">
          {content.items.map((service: any, i: number) => {
            const isReversed = i % 2 === 1;
            return (
              <div 
                key={i} 
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/80 shadow-xl shadow-slate-900/5 transition-all duration-300 hover:shadow-2xl hover:border-sky-200"
              >
                {/* Media Column */}
                <div className={`relative h-[280px] sm:h-[340px] lg:h-[380px] lg:col-span-6 rounded-2xl overflow-hidden bg-slate-100 group/img ${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
                  {service.imageUrl && (
                    <Image 
                      src={service.imageUrl} 
                      alt={service.title} 
                      fill 
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover/img:scale-105"
                      loading="lazy"
                    />
                  )}
                  {/* Subtle Gradient & Badge */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-4 left-4 h-12 w-12 rounded-2xl bg-white/95 backdrop-blur-md flex items-center justify-center shadow-lg border border-sky-100 text-sky-600">
                    {getIcon(service.icon || 'truck')}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-[12px] font-semibold">
                    <span className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                      Nganila Service #{i + 1}
                    </span>
                    <span className="bg-sky-600/90 backdrop-blur-md px-3 py-1 rounded-full text-white">
                      Verified Standard
                    </span>
                  </div>
                </div>

                {/* Content Column */}
                <div className={`space-y-5 lg:col-span-6 ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="inline-flex items-center gap-2 text-sky-600 font-bold text-[12px] uppercase tracking-wider">
                    <span>Core Capability</span>
                  </div>

                  <h3 className="text-[22px] sm:text-[26px] font-extrabold text-slate-900 tracking-tight leading-snug">
                    {service.title}
                  </h3>

                  <div className="text-[15px] text-slate-600 leading-relaxed prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: service.description }} />
                  </div>

                  {/* Bulleted Specifications based on service */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-[13px] text-slate-700 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0" />
                      <span>Fleet of 5 Vacuum Tankers</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-slate-700 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0" />
                      <span>Compliant Treatment Disposal</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-slate-700 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0" />
                      <span>ASSERWA Forum Certified</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-slate-700 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0" />
                      <span>24/7 Rapid Mobilization</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 flex flex-wrap gap-3">
                    <Button asChild className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold uppercase tracking-wider h-11 px-5 text-[12px] shadow-md shadow-sky-600/20 gap-2">
                      <Link href="/book">
                        <Calendar className="h-4 w-4" /> Book Exhauster
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-slate-700 hover:text-sky-700 font-bold h-11 px-5 text-[12px] gap-2">
                      <a href="tel:+250788450120">
                        <Phone className="h-4 w-4 text-sky-600" /> +250 788 450 120
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guided Booking & Consultation CTA Banner */}
        <div className="mt-14 lg:mt-20 rounded-3xl p-8 sm:p-10 lg:p-12 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white shadow-2xl shadow-sky-950/20 border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-400/15 text-sky-300 border border-sky-400/30">
              <ShieldCheck className="h-3.5 w-3.5" />
              Prompt Response Guarantee
            </span>
            <h3 className="text-[24px] sm:text-[30px] font-extrabold text-white tracking-tight leading-tight">
              Looking to book an exhauster truck for a residential property, or need a commercial liquid waste management plan?
            </h3>
            <p className="text-[15px] sm:text-[16px] text-slate-300 leading-relaxed">
              Let us guide you on the next steps. Our dispatch crew operates a modern fleet of 5 vacuum tankers based in Kicukiro, Kigali, providing timely septic draining (kuvidura), transport, and decentralized treatment.
            </p>
            <div className="pt-3 flex flex-wrap gap-4 items-center">
              <Button asChild className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-bold uppercase tracking-wider h-12 px-7 text-[13px] shadow-lg shadow-sky-500/25 gap-2">
                <Link href="/book">
                  <Calendar className="h-4 w-4" /> Book an Exhauster Truck Now
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <a 
                  href="tel:+250788450120" 
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-[13px] border border-slate-700 transition-colors"
                >
                  <Phone className="h-4 w-4 text-sky-400" />
                  <span>+250 788 450 120</span>
                </a>
                <a 
                  href="tel:+250788668855" 
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[13px] border border-slate-700 transition-colors"
                >
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>+250 788 668 855</span>
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
