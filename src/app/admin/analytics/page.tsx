"use client";

import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ChevronLeft, 
  ShieldAlert, 
  TrendingUp, 
  ClipboardList 
} from "lucide-react";
import Link from "next/link";
import { ChannelAnalyticsDashboard, BookingData } from "@/components/admin/ChannelAnalyticsDashboard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();

  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile, loading: profileLoading } = useDoc(userDocRef);

  const isAuthorized = 
    userProfile?.role === "admin" || 
    (user as any)?.admin === true || 
    user?.email?.toLowerCase() === "tharushyamagara@gmail.com" ||
    user?.email?.toLowerCase() === "orverxi@gmail.com";

  // Real-time query to bookings collection
  const bookingsQuery = React.useMemo(() => {
    if (!db || !user || !isAuthorized) return null;
    return collection(db, "bookings");
  }, [db, user, isAuthorized]);

  const { data: firestoreBookings, loading: firestoreLoading } = useCollection(bookingsQuery);

  if (authLoading || (profileLoading && !userProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col font-arial">
        <Navbar isAdmin />
        <main className="flex-grow flex items-center justify-center px-4">
          <Card className="w-full max-w-md text-center py-10 shadow-lg border-t-4 border-t-[#8DB833]">
            <ShieldAlert className="mx-auto h-12 w-12 text-[#8DB833] mb-3" />
            <h2 className="text-xl font-bold">Unauthorized Access</h2>
            <p className="mt-2 text-muted-foreground text-sm">Administrative clearance required for analytics.</p>
            <div className="pt-6">
              <Button asChild className="h-10 px-8 text-[10px] font-bold uppercase tracking-widest">
                <Link href="/admin">Return to Dashboard</Link>
              </Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const bookings: BookingData[] = (firestoreBookings || []).map((b: any) => ({
    id: b.id,
    customerName: b.customerName,
    email: b.email,
    phone: b.phone,
    serviceType: b.serviceType,
    status: b.status,
    referralSource: b.referralSource,
    description: b.description,
    createdAt: b.createdAt
  }));

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar isAdmin />
      <div className="flex-grow flex flex-col lg:flex-row">
        <AdminSidebar />
        <main className="flex-grow p-4 md:p-8 space-y-6 overflow-x-hidden">
          {/* Breadcrumb Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-[10px] font-bold uppercase tracking-widest">
                <Link href="/admin"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
              </Button>
              <h1 className="text-2xl font-bold font-headline flex items-center gap-3 text-black">
                <TrendingUp className="h-7 w-7 text-primary" /> Communications & Referral Analytics
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Marketing attribution, lead channels and conversion performance.</p>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase tracking-widest gap-2">
                <Link href="/admin/bookings">
                  <ClipboardList className="h-4 w-4" /> View Bookings
                </Link>
              </Button>
            </div>
          </div>

          {firestoreLoading && bookings.length === 0 ? (
            <div className="py-24 text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Aggregating live channel metrics...</p>
            </div>
          ) : (
            <ChannelAnalyticsDashboard bookings={bookings} />
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
