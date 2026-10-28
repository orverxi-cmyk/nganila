
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { 
  Truck, Settings, Droplets, Users, Loader2, ShieldCheck, Cpu, Globe, Zap, Award, Target, HardHat, Activity, Leaf, Heart, Scale, Sparkles, Clock, Rocket, Building, CheckCircle, Stethoscope, Edit3
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
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/studio-9595184890-5bb3c.firebasestorage.app/o/uploads%2F1779722491089_B25A3102.jpg?alt=media&token=e7f97250-ccbd-4a24-a9fa-793f86798a7d", 
      icon: "droplets" 
    },
    { 
      title: "Liquid Waste Evacuation", 
      description: "Providing professional septic tank emptying, pit latrine draining (kuvidura), and vacuum tanker services across Kigali and Rwanda.", 
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/studio-9595184890-5bb3c.firebasestorage.app/o/uploads%2F1779723894783_vlcsnap-2025-04-19-16h01m39s409.png?alt=media&token=40440145-c8f7-4e34-a3cb-a21f4565d9c0", 
      icon: "truck" 
    },
    { 
      title: "Wastewater Transportation", 
      description: "Operating a dedicated fleet of 5 modern vacuum tankers to transport liquid waste safely and responsibly to treatment facilities.", 
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/studio-9595184890-5bb3c.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media&token=d3048d2c-2d02-4fdb-8eaa-f741686a4401", 
      icon: "truck" 
    },
    { 
      title: "Verified ASSERWA Member", 
      description: "Proud member of ASSERWA (the Forum of Sewage Emptiers in Rwanda), certified for professional standards and public hygiene.", 
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/studio-9595184890-5bb3c.firebasestorage.app/o/uploads%2F1779722938429_WhatsApp%20Image%202025-04-19%20at%2020.13.41.jpeg?alt=media&token=3f2a420d-9624-4356-be91-cf8fea746965", 
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
    <section id="services" className="py-2.5 bg-background relative group">
      {isAdmin && (
        <div className="absolute inset-0 z-20 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button asChild className="pointer-events-auto bg-black text-white hover:bg-black/80 gap-2">
            <Link href="/admin/content?tab=services">
              <Edit3 className="h-4 w-4" /> Edit Services
            </Link>
          </Button>
        </div>
      )}
      <div className="container mx-auto px-4 md:px-16">
        <div className="text-center mb-5 space-y-1">
          <h2 className="text-[16px] font-bold">{content.title}</h2>
          <p className="text-[14px] font-normal text-muted-foreground max-w-[800px] mx-auto">{content.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {content.items.map((service: any, i: number) => (
            <Card key={i} className="group overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-md bg-white rounded-xl">
              <div className="relative h-40 overflow-hidden bg-muted">
                {service.imageUrl && (
                  <Image 
                    src={service.imageUrl} 
                    alt={service.title} 
                    fill 
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
                <div className="absolute top-2 left-2 h-8 w-8 rounded-lg bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-sm border border-primary/20">
                  {getIcon(service.icon || 'users')}
                </div>
              </div>
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-[16px] font-bold leading-tight group-hover:text-primary transition-colors">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-[14px] font-normal text-muted-foreground leading-relaxed prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: service.description }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
