"use client";

import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ChevronLeft,
  Mail,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ZohoEmailHub } from "@/components/admin/ZohoEmailDiagnostics";

export default function AdminEmailCenterPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();

  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile, loading: profileLoading } = useDoc(userDocRef);

  const isAuthorized =
    userProfile?.role === "admin" ||
    (user as any)?.admin === true ||
    user?.email?.toLowerCase() === "orverxi@gmail.com" ||
    user?.email?.toLowerCase() === "sanexcompany@gmail.com";

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
              Authenticating Email Hub...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-destructive/20 shadow-lg text-center p-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
              <p className="text-xs text-muted-foreground mt-1">
                You must possess administrative privileges to dispatch emails on behalf of SANEX Company.
              </p>
            </div>
            <Button asChild className="w-full bg-primary text-black font-bold h-9 text-xs">
              <Link href="/admin">Return to Admin Login</Link>
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Responsive Admin Sidebar Navigation */}
        <AdminSidebar />

        {/* Primary Content Container */}
        <div className="flex-1 p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header & Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href="/admin"
                  className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 font-bold transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Operations
                </Link>
                <span className="text-muted-foreground/40 text-xs">/</span>
                <Badge className="bg-primary/20 text-black border-primary/30 font-bold uppercase text-[9px] tracking-wider">
                  Outbound Communications
                </Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold font-headline tracking-tight text-foreground flex items-center gap-2.5">
                <Mail className="h-7 w-7 text-primary" /> Email Communications Center
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Compose, preview, and dispatch individual messages or multi-recipient broadcasts through verified domain{" "}
                <strong className="text-foreground font-mono">@sanex.rw</strong>.
              </p>
            </div>
          </div>

          {/* Primary Interactive Email Hub Component */}
          <ZohoEmailHub />
        </div>
      </main>

      <Footer />
    </div>
  );
}
