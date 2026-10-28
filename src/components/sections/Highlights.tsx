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

  const defaultHighlights = [
    { icon: "shield", title: "Verified ASSERWA Member", description: "Official member of the Forum of Sewage Emptiers in Rwanda, ensuring compliant and certified liquid waste disposal." },
    { icon: "truck", title: "Fleet of 5 Vacuum Tankers", description: "Equipped with 5 specialized vacuum tankers for prompt residential, commercial, and industrial waste evacuation." },
    { icon: "globe", title: "Kicukiro & Greater Kigali", description: "Operating centrally in Kicukiro, serving residential properties and commercial establishments across Kigali and Rwanda." }
  ];

  const items = highlightsData?.items?.length ? highlightsData.items : defaultHighlights;

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

  return (
    <div className="relative group">
      {isAdmin && (
        <div className="absolute -inset-2 z-20 bg-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-2xl">
          <Button asChild className="pointer-events-auto bg-slate-950 text-white hover:bg-slate-900 gap-2 font-bold text-xs rounded-xl">
            <Link href="/admin/content?tab=highlights">
              <Edit3 className="h-4 w-4" /> Edit Highlights
            </Link>
          </Button>
        </div>
      )}
      <div className="space-y-2 mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Why Nganila Co LTD</span>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Our Operational Highlights</h2>
      </div>
      <div className="space-y-6">
        {items.map((item: any, i: number) => (
          <div key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-sky-300 transition-all">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 shadow-inner">
              {getIcon(item.icon)}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold leading-tight text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
