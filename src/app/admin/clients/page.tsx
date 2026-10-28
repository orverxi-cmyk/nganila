"use client";

import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, ChevronLeft, Users, Star, UserCheck, UserPlus,
  Search, X, Mail, Phone, Calendar, ChevronDown, ChevronUp,
  ShieldAlert, FileDown,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { exportToExcel } from "@/lib/exportExcel";
import { SectorAddressBook } from "@/components/admin/SectorAddressBook";

const REGULAR_CLIENT_THRESHOLD = 5;
type LifecycleTier = "potential" | "client" | "regular";

interface ClientProfile {
  email: string; name: string; phone: string; tier: LifecycleTier;
  totalBookings: number; completedCount: number; pendingCount: number;
  confirmedCount: number; cancelledCount: number;
  firstBookingDate: number; lastBookingDate: number;
  services: string[]; bookings: any[];
}

function classifyTier(completed: number): LifecycleTier {
  if (completed >= REGULAR_CLIENT_THRESHOLD) return "regular";
  if (completed >= 1) return "client";
  return "potential";
}

function buildClientProfiles(bookings: any[]): ClientProfile[] {
  const map = new Map<string, ClientProfile>();
  for (const b of bookings) {
    const email = (b.email || "").toLowerCase().trim();
    if (!email) continue;
    const ts = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt || 0).getTime();
    if (!map.has(email)) {
      map.set(email, { email, name: b.customerName || "Unknown", phone: b.phone || "-", tier: "potential",
        totalBookings: 0, completedCount: 0, pendingCount: 0, confirmedCount: 0, cancelledCount: 0,
        firstBookingDate: ts, lastBookingDate: ts, services: [], bookings: [] });
    }
    const p = map.get(email)!;
    p.totalBookings += 1;
    p.bookings.push(b);
    const status = (b.status || "pending").toLowerCase();
    if (status === "completed") p.completedCount += 1;
    else if (status === "pending") p.pendingCount += 1;
    else if (status === "confirmed") p.confirmedCount += 1;
    else if (status === "cancelled") p.cancelledCount += 1;
    if (ts < p.firstBookingDate) p.firstBookingDate = ts;
    if (ts > p.lastBookingDate) { p.lastBookingDate = ts; p.name = b.customerName || p.name; p.phone = b.phone || p.phone; }
    if (b.serviceType && !p.services.includes(b.serviceType)) p.services.push(b.serviceType);
  }
  const profiles = Array.from(map.values()).map((p) => {
    p.tier = classifyTier(p.completedCount);
    p.bookings.sort((a: any, b: any) => {
      const tA = typeof a.createdAt === "number" ? a.createdAt : new Date(a.createdAt || 0).getTime();
      const tB = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt || 0).getTime();
      return tB - tA;
    });
    return p;
  });
  profiles.sort((a, b) => {
    const order: Record<LifecycleTier, number> = { regular: 0, client: 1, potential: 2 };
    if (order[a.tier] !== order[b.tier]) return order[a.tier] - order[b.tier];
    return b.totalBookings - a.totalBookings;
  });
  return profiles;
}

function TierBadge({ tier }: { tier: LifecycleTier }) {
  if (tier === "regular") return (
    <span className="inline-flex items-center gap-1 bg-[#8DB833] text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
      <Star className="h-3 w-3 fill-black" /> Regular Client
    </span>
  );
  if (tier === "client") return (
    <span className="inline-flex items-center gap-1 bg-black text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
      <UserCheck className="h-3 w-3" /> Client
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 border border-muted-foreground/30 text-muted-foreground text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
      <UserPlus className="h-3 w-3" /> Potential Lead
    </span>
  );
}

function ClientCard({ profile }: { profile: ClientProfile }) {
  const [expanded, setExpanded] = React.useState(false);
  const progressToRegular = Math.min((profile.completedCount / REGULAR_CLIENT_THRESHOLD) * 100, 100);
  return (
    <Card className={cn("overflow-hidden border-l-4 transition-all hover:shadow-md",
      profile.tier === "regular" ? "border-l-[#8DB833]" : profile.tier === "client" ? "border-l-black" : "border-l-muted-foreground/30")}>
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div className="space-y-1.5">
            <TierBadge tier={profile.tier} />
            <h3 className="text-lg font-bold font-headline mt-1.5">{profile.name}</h3>
            <div className="space-y-0.5 text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-[#8DB833]" />{profile.email}</div>
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-[#8DB833]" />{profile.phone}</div>
            </div>
            <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />First contact: {new Date(profile.firstBookingDate).toLocaleDateString()}
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />Last activity: {new Date(profile.lastBookingDate).toLocaleDateString()}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            {[
              { label: "Total", value: profile.totalBookings, color: "text-foreground" },
              { label: "Completed", value: profile.completedCount, color: "text-[#8DB833]" },
              { label: "Pending", value: profile.pendingCount, color: "text-amber-600" },
              { label: "Cancelled", value: profile.cancelledCount, color: "text-destructive" },
            ].map((stat) => (
              <div key={stat.label} className="bg-muted/40 rounded-lg p-2">
                <div className={cn("text-2xl font-black", stat.color)}>{stat.value}</div>
                <div className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {profile.tier === "regular" ? (
              <div className="bg-[#8DB833]/10 border border-[#8DB833]/30 rounded-lg p-3 text-center">
                <Star className="h-5 w-5 text-[#8DB833] mx-auto mb-1 fill-[#8DB833]" />
                <div className="text-xs font-black text-[#4a6b1a]">Valued Regular Client</div>
                <div className="text-[10px] text-muted-foreground">{profile.completedCount} completed orders</div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  <span>Progress to Regular</span>
                  <span>{profile.completedCount}/{REGULAR_CLIENT_THRESHOLD}</span>
                </div>
                <Progress value={progressToRegular} className="h-2" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {REGULAR_CLIENT_THRESHOLD - profile.completedCount} more completed order(s) needed
                </p>
              </div>
            )}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Services Used</div>
              <div className="flex flex-wrap gap-1">
                {profile.services.slice(0, 3).map((s) => (
                  <span key={s} className="text-[9px] bg-primary/10 text-black border border-primary/20 font-bold px-2 py-0.5 rounded-full">{s}</span>
                ))}
                {profile.services.length > 3 && (
                  <span className="text-[9px] bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-full">+{profile.services.length - 3} more</span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold gap-1 w-full justify-center border border-dashed" onClick={() => setExpanded((e) => !e)}>
              {expanded ? (<><ChevronUp className="h-3 w-3" /> Hide History</>) : (<><ChevronDown className="h-3 w-3" /> View All {profile.totalBookings} Bookings</>)}
            </Button>
          </div>
        </div>
        {expanded && (
          <div className="mt-4 border-t pt-4 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Booking History</div>
            {profile.bookings.map((b: any) => {
              const ts = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt || 0).getTime();
              const status = (b.status || "pending").toLowerCase();
              return (
                <div key={b.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 text-xs">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-2 w-2 rounded-full shrink-0",
                      status === "completed" ? "bg-[#8DB833]" : status === "confirmed" ? "bg-black" : status === "cancelled" ? "bg-destructive" : "bg-amber-500")} />
                    <span className="font-bold">{b.serviceType || "-"}</span>
                    <span className="text-muted-foreground hidden sm:block">#{b.id?.slice(-6)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{new Date(ts).toLocaleDateString()}</span>
                    <span className={cn("font-black uppercase text-[9px]",
                      status === "completed" ? "text-[#8DB833]" : status === "confirmed" ? "text-black" : status === "cancelled" ? "text-destructive" : "text-amber-600")}>
                      {status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

function FunnelStat({ icon: Icon, label, count, total, accent, description }: {
  icon: any; label: string; count: number; total: number; accent: string; description: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className={cn("rounded-2xl p-5 border space-y-3", accent)}>
      <div className="flex items-center justify-between">
        <Icon className="h-6 w-6" />
        <span className="text-3xl font-black">{count}</span>
      </div>
      <div>
        <div className="font-black text-sm uppercase tracking-wide">{label}</div>
        <div className="text-xs opacity-70 mt-0.5">{description}</div>
      </div>
      <div className="text-xs font-bold opacity-80">{pct}% of all contacts</div>
    </div>
  );
}

export default function ClientLifecyclePage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile, loading: profileLoading } = useDoc(userDocRef);
  const isAuthorized = userProfile?.role === "admin" || (user as any)?.admin === true
    || user?.email?.toLowerCase() === "tharushyamagara@gmail.com"
    || user?.email?.toLowerCase() === "orverxi@gmail.com"
    || user?.email?.toLowerCase() === "sanexcompany@gmail.com";
  const bookingsQuery = React.useMemo(() => {
    if (!db || !user || !isAuthorized) return null;
    return collection(db, "bookings");
  }, [db, user, isAuthorized]);
  const { data: rawBookings, loading: bookingsLoading } = useCollection(bookingsQuery);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [tierFilter, setTierFilter] = React.useState<"all" | LifecycleTier>("all");
  const [activeView, setActiveView] = React.useState<"addressbook" | "lifecycle">("addressbook");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "lifecycle" || params.get("tab") === "lifecycle") {
        setActiveView("lifecycle");
      }
    }
  }, []);

  const allProfiles = React.useMemo(() => buildClientProfiles(rawBookings || []), [rawBookings]);
  const filteredProfiles = React.useMemo(() => {
    return allProfiles.filter((p) => {
      if (tierFilter !== "all" && p.tier !== tierFilter) return false;
      if (searchTerm.trim()) {
        const t = searchTerm.toLowerCase();
        return p.name.toLowerCase().includes(t) || p.email.toLowerCase().includes(t) || p.phone.toLowerCase().includes(t);
      }
      return true;
    });
  }, [allProfiles, tierFilter, searchTerm]);

  const potentialCount = allProfiles.filter((p) => p.tier === "potential").length;
  const clientCount = allProfiles.filter((p) => p.tier === "client").length;
  const regularCount = allProfiles.filter((p) => p.tier === "regular").length;
  const totalContacts = allProfiles.length;

  const handleExport = () => {
    const rows = filteredProfiles.map((p) => ({
      name: p.name, email: p.email, phone: p.phone,
      tier: p.tier === "regular" ? "Regular Client" : p.tier === "client" ? "Client" : "Potential Lead",
      totalBookings: p.totalBookings, completedOrders: p.completedCount,
      pendingOrders: p.pendingCount, cancelledOrders: p.cancelledCount,
      firstContact: new Date(p.firstBookingDate).toLocaleDateString(),
      lastActivity: new Date(p.lastBookingDate).toLocaleDateString(),
      servicesUsed: p.services.join(", "),
    }));
    exportToExcel(rows, [
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Tier", key: "tier", width: 18 },
      { header: "Total Bookings", key: "totalBookings", width: 15 },
      { header: "Completed Orders", key: "completedOrders", width: 17 },
      { header: "Pending Orders", key: "pendingOrders", width: 15 },
      { header: "Cancelled Orders", key: "cancelledOrders", width: 16 },
      { header: "First Contact", key: "firstContact", width: 18 },
      { header: "Last Activity", key: "lastActivity", width: 18 },
      { header: "Services Used", key: "servicesUsed", width: 45 },
    ], `Nganira_Clients_${new Date().toISOString().slice(0, 10)}`, "Client Lifecycle");
  };

  if (authLoading || (profileLoading && !userProfile)) {
    return (<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#8DB833]" /></div>);
  }
  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar isAdmin />
        <main className="flex-grow flex items-center justify-center px-4">
          <Card className="w-full max-w-md text-center py-12 border-t-4 border-t-[#8DB833]">
            <ShieldAlert className="mx-auto h-12 w-12 text-[#8DB833] mb-4" />
            <CardTitle>Unauthorized Access</CardTitle>
            <p className="mt-2 text-muted-foreground">You do not have permission to view this page.</p>
            <Button asChild className="mt-6"><Link href="/admin">Return to Dashboard</Link></Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar isAdmin />
      <div className="flex-grow flex flex-col lg:flex-row">
        <AdminSidebar />
        <main className="flex-grow p-4 md:p-8 space-y-6 overflow-x-hidden">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" className="mb-2 -ml-2">
              <Link href="/admin"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>
          </div>

          {/* Top View Selector Tabs */}
          <div className="flex items-center gap-2 border-b pb-3">
            <button
              type="button"
              onClick={() => setActiveView("addressbook")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeView === "addressbook"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border"
              }`}
            >
              <Users className="h-4 w-4 text-primary" /> Sector Address Book &amp; Zoho Contacts
            </button>
            <button
              type="button"
              onClick={() => setActiveView("lifecycle")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeView === "lifecycle"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border"
              }`}
            >
              <Star className="h-4 w-4 text-primary" /> Booking Client Lifecycle ({totalContacts})
            </button>
          </div>

          {activeView === "addressbook" ? (
            <SectorAddressBook />
          ) : (
            <>
              <div className="flex flex-wrap justify-between items-end gap-3">
                <div>
                  <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                    <Users className="h-8 w-8 text-[#8DB833]" /> Client Lifecycle
                  </h1>
                  <p className="text-muted-foreground text-xs mt-1">
                    Track contacts from first enquiry to loyal regular client. Regular = {REGULAR_CLIENT_THRESHOLD}+ completed orders.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" className="gap-2 h-9 text-xs font-bold border-[#8DB833] text-[#4a6b1a] hover:bg-[#8DB833]/10"
                    onClick={handleExport} disabled={filteredProfiles.length === 0}>
                    <FileDown className="h-3.5 w-3.5" />
                    Export Excel
                    {filteredProfiles.length > 0 && (
                      <span className="ml-1 bg-[#8DB833] text-black rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none">{filteredProfiles.length}</span>
                    )}
                  </Button>
                  <Badge variant="outline" className="text-sm px-4 py-1.5">{filteredProfiles.length} of {totalContacts} Contacts</Badge>
                </div>
              </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FunnelStat icon={UserPlus} label="Potential Leads" description="Submitted a request with no completed order yet"
              count={potentialCount} total={totalContacts} accent="bg-muted/50 border-muted-foreground/20 text-foreground" />
            <FunnelStat icon={UserCheck} label="Clients" description="At least 1 successfully completed service"
              count={clientCount} total={totalContacts} accent="bg-black text-white border-black" />
            <FunnelStat icon={Star} label="Regular Clients" description={`${REGULAR_CLIENT_THRESHOLD}+ completed orders`}
              count={regularCount} total={totalContacts} accent="bg-[#8DB833] text-black border-[#8DB833]" />
          </div>

          {totalContacts > 0 && (
            <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-5">
              <div className="flex flex-wrap gap-6 items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Lead to Client Conversion Rate</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#8DB833]">
                      {Math.round(((clientCount + regularCount) / totalContacts) * 100)}%
                    </span>
                    <span className="text-sm text-muted-foreground">of contacts have at least 1 completed service</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Client to Regular</div>
                    <div className="text-2xl font-black">
                      {clientCount + regularCount > 0 ? Math.round((regularCount / (clientCount + regularCount)) * 100) : 0}%
                    </div>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Unique Contacts</div>
                    <div className="text-2xl font-black">{totalContacts}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-1 h-4 rounded-full overflow-hidden w-full">
                  {regularCount > 0 && <div className="bg-[#8DB833]" style={{ width: `${(regularCount / totalContacts) * 100}%` }} />}
                  {clientCount > 0 && <div className="bg-black" style={{ width: `${(clientCount / totalContacts) * 100}%` }} />}
                  {potentialCount > 0 && <div className="bg-muted-foreground/30 flex-1" />}
                </div>
                <div className="flex gap-4 text-[10px] font-bold">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#8DB833] inline-block" />Regular ({regularCount})</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-black inline-block" />Client ({clientCount})</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-muted-foreground/30 inline-block" />Potential ({potentialCount})</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name, email or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-10 text-xs" />
                {searchTerm && (<button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>)}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1 shrink-0">Tier:</span>
                {([{ key: "all", label: "All" }, { key: "potential", label: "Potential" }, { key: "client", label: "Client" }, { key: "regular", label: "Regular" }] as const).map((item) => (
                  <button key={item.key} onClick={() => setTierFilter(item.key)}
                    className={cn("px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0",
                      tierFilter === item.key ? "bg-[#8DB833] text-black shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground")}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {bookingsLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-[#8DB833]" />
                <p className="mt-3 text-sm text-muted-foreground">Building client profiles...</p>
              </div>
            ) : filteredProfiles.length > 0 ? (
              filteredProfiles.map((p) => <ClientCard key={p.email} profile={p} />)
            ) : allProfiles.length > 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed p-6">
                <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <h3 className="text-lg font-bold">No Matching Contacts</h3>
                <p className="text-xs text-muted-foreground mb-4">No clients match your current filters.</p>
                <Button variant="outline" size="sm" onClick={() => { setSearchTerm(""); setTierFilter("all"); }}>Clear Filters</Button>
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-xl font-bold">No Client Data Yet</h3>
                <p className="text-muted-foreground text-sm">Client profiles are built automatically from booking data.</p>
              </div>
            )}
          </div>
          </>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}