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

  const generalRef = React.useMemo(() => (db ? doc(db, "settings", "general") : null), [db]);
  const { data: generalData } = useDoc(generalRef);

  const primaryPhone = (Array.isArray(generalData?.phones) && generalData.phones[0]) || generalData?.phone || "+250 788 450 120";

  const rawItems: any[] = Array.isArray(servicesData?.items) ? servicesData.items : [];
  const items = rawItems.filter((service: any) => {
    const t = (service?.title || "").toLowerCase();
    return !t.includes("clean water");
  });
  const title = servicesData?.title || "";
  const subtitle = servicesData?.subtitle || "";

  const getIcon = (name: string) => {
    const iconClass = "h-5 w-5 text-[#636679]";
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

  if (items.length === 0 && !title && !subtitle) {
    if (isAdmin) {
      return (
        <section id="services" className="py-12 bg-[#f6f6f8] text-center">
          <p className="text-sm text-muted-foreground mb-3">Services section has no content yet.</p>
          <Button asChild className="bg-[#636679] text-white hover:bg-[#545667] text-xs font-bold">
            <Link href="/admin/content?tab=services"><Edit3 className="mr-1.5 h-4 w-4" /> Edit Services</Link>
          </Button>
        </section>
      );
    }
    return null;
  }

  return (
    <section id="services" className="py-14 lg:py-20 bg-[#f6f6f8] relative group">
      {isAdmin && (
        <div className="absolute inset-0 z-20 bg-[#636679]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button asChild className="pointer-events-auto bg-[#636679] text-white hover:bg-[#545667] gap-2 font-bold rounded-xl shadow-lg">
            <Link href="/admin/content?tab=services">
              <Edit3 className="h-4 w-4 text-[#006400]" /> Edit Services
            </Link>
          </Button>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-16">
        {/* Section Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12 sm:mb-16 space-y-3">
            {title && (
              <h2 className="text-[28px] sm:text-[34px] lg:text-[38px] font-extrabold text-[#26272e] tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-[15px] sm:text-[16px] text-[#636679] max-w-[760px] mx-auto leading-relaxed">
                {subtitle.replace(/SANEX/gi, 'Nganira Company LTD')}
              </p>
            )}
          </div>
        )}

        {/* Services Grid: 1 column on mobile, 2 columns on tablet, 4 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((service: any, i: number) => {
            return (
              <div 
                key={i} 
                className="bg-white rounded-3xl border border-[#d9dadf] shadow-md shadow-[#636679]/5 hover:shadow-xl hover:border-[#636679]/40 transition-all duration-300 flex flex-col overflow-hidden group/card"
              >
                {/* Media Image Area */}
                <div className="relative h-48 sm:h-52 w-full bg-slate-100 overflow-hidden shrink-0">
                  {service.imageUrl ? (
                    <Image 
                      src={service.imageUrl} 
                      alt={service.title} 
                      fill 
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#636679]/10 to-[#006400]/15 flex items-center justify-center">
                      {getIcon(service.icon || 'truck')}
                    </div>
                  )}
                  {/* Subtle Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Icon Badge */}
                  <div className="absolute top-3 left-3 h-10 w-10 rounded-xl bg-white/95 backdrop-blur-md flex items-center justify-center shadow border border-[#006400]/30 text-[#636679]">
                    {getIcon(service.icon || 'truck')}
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5 sm:p-6 flex flex-col flex-grow justify-between space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-[17px] font-extrabold text-[#26272e] tracking-tight leading-snug line-clamp-2">
                      {service.title}
                    </h3>

                    {service.description && (
                      <div 
                        className="text-[13px] text-[#636679] leading-relaxed prose prose-sm max-w-none line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: service.description }}
                      />
                    )}

                    {/* Dynamic features if configured in CMS */}
                    {Array.isArray(service.features) && service.features.length > 0 && (
                      <div className="space-y-1.5 pt-3 border-t border-slate-100">
                        {service.features.map((feat: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-[12px] text-slate-700 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#636679] shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 space-y-2">
                    <Button asChild className="w-full rounded-xl bg-[#006400] hover:bg-[#005000] text-white font-bold uppercase tracking-wider h-10 text-[11px] shadow-xs border border-[#006400] gap-1.5 transition-all hover:scale-[1.02]">
                      <Link href="/book">
                        <Calendar className="h-3.5 w-3.5" /> Book a Service
                      </Link>
                    </Button>
                    <a 
                      href={`tel:${primaryPhone.replace(/[^0-9+]/g, '')}`}
                      className="w-full text-center py-1.5 text-[11px] font-bold text-[#636679] hover:text-[#26272e] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5 text-[#636679]" /> {primaryPhone}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
