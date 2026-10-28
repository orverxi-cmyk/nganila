"use client";

import React from "react";
import { 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Zap, 
  Award, 
  Target, 
  HardHat, 
  Activity,
  Droplets,
  Truck,
  Users,
  Leaf,
  Heart,
  Scale,
  Sparkles,
  Clock,
  Rocket,
  Building,
  CheckCircle,
  Lightbulb,
  Microscope,
  Stethoscope,
  Edit3
} from "lucide-react";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Highlights() {
  const db = useFirestore();
  const { user } = useUser();
  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile } = useDoc(userDocRef);
  const isAdmin = userProfile?.role === "admin";

  const highlightsRef = React.useMemo(() => (db ? doc(db, "settings", "highlights") : null), [db]);
  const { data: highlightsData, loading } = useDoc(highlightsRef);

  const items: any[] = Array.isArray(highlightsData?.items) ? highlightsData.items : [];
  const title = highlightsData?.title || "";
  const subtitle = highlightsData?.subtitle || "";

  const getIcon = (name: string) => {
    const iconClass = "h-6 w-6 text-primary";
    const normalized = name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'shield';
    switch (normalized) {
      case 'shield': case 'shieldcheck': return <ShieldCheck className={iconClass} />;
      case 'cpu': return <Cpu className={iconClass} />;
      case 'globe': return <Globe className={iconClass} />;
      case 'zap': return <Zap className={iconClass} />;
      case 'award': return <Award className={iconClass} />;
      case 'target': return <Target className={iconClass} />;
      case 'hardhat': return <HardHat className={iconClass} />;
      case 'activity': return <Activity className={iconClass} />;
      case 'droplets': return <Droplets className={iconClass} />;
      case 'truck': return <Truck className={iconClass} />;
      case 'users': return <Users className={iconClass} />;
      case 'leaf': return <Leaf className={iconClass} />;
      case 'heart': return <Heart className={iconClass} />;
      case 'scale': return <Scale className={iconClass} />;
      case 'sparkles': return <Sparkles className={iconClass} />;
      case 'clock': return <Clock className={iconClass} />;
      case 'rocket': return <Rocket className={iconClass} />;
      case 'building': return <Building className={iconClass} />;
      case 'check': case 'checkcircle': return <CheckCircle className={iconClass} />;
      case 'lightbulb': return <Lightbulb className={iconClass} />;
      case 'microscope': return <Microscope className={iconClass} />;
      case 'stethoscope': return <Stethoscope className={iconClass} />;
      default: return <ShieldCheck className={iconClass} />;
    }
  };

  if (items.length === 0 && !title) {
    if (isAdmin) {
      return (
        <div className="p-6 border border-dashed rounded-2xl text-center">
          <p className="text-xs text-muted-foreground mb-2">Highlights section has no items yet.</p>
          <Button asChild size="sm" className="bg-[#636679] text-white hover:bg-[#545667] text-[10px] font-bold">
            <Link href="/admin/content?tab=highlights"><Edit3 className="mr-1 h-3 w-3" /> Edit Highlights</Link>
          </Button>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="relative group">
      {isAdmin && (
        <div className="absolute -inset-2 z-20 bg-[#636679]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-2xl">
          <Button asChild className="pointer-events-auto bg-[#636679] text-white hover:bg-[#545667] gap-2 font-bold text-xs rounded-xl shadow-md">
            <Link href="/admin/content?tab=highlights">
              <Edit3 className="h-4 w-4 text-[#006400]" /> Edit Highlights
            </Link>
          </Button>
        </div>
      )}
      {(title || subtitle) && (
        <div className="space-y-2 mb-8">
          {subtitle && <span className="text-xs font-bold uppercase tracking-wider text-[#636679]">{subtitle}</span>}
          {title && <h2 className="text-xl font-extrabold text-[#26272e] tracking-tight">{title}</h2>}
        </div>
      )}
      <div className="space-y-6">
        {items.map((item: any, i: number) => (
          <div key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-white border border-[#d9dadf] shadow-sm hover:border-[#636679]/40 transition-all">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-[#006400]/10 border border-[#006400]/30 text-[#006400] shadow-inner">
              {getIcon(item.icon)}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold leading-tight text-[#26272e]">{item.title}</h3>
              <p className="text-xs text-[#636679] leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
