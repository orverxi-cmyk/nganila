"use client";

import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { useUser, useDoc, useFirestore, useCollection, useFunctions } from "@/firebase";
import { doc, collection, updateDoc, deleteDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  ChevronLeft, 
  ClipboardList, 
  ExternalLink, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  ShieldAlert,
  RefreshCw,
  Search,
  Filter,
  X,
  TrendingUp,
  Trash2,
  FileDown
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { getChannelKey } from "@/components/admin/ChannelAnalyticsDashboard";
import { exportBookingsToExcel } from "@/lib/exportExcel";

export default function BookingsManagementPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const functions = useFunctions();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const [backupBookings, setBackupBookings] = React.useState<any[] | null>(null);
  const [isFetchingBackup, setIsFetchingBackup] = React.useState(false);

  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile, loading: profileLoading } = useDoc(userDocRef);

  const isAuthorized = 
    userProfile?.role === "admin" || 
    (user as any)?.admin === true || 
    user?.email?.toLowerCase() === "tharushyamagara@gmail.com" ||
    user?.email?.toLowerCase() === "orverxi@gmail.com" ||
    user?.email?.toLowerCase() === "sanexcompany@gmail.com";

  // Only create Firestore query once user authorization is confirmed
  const bookingsQuery = React.useMemo(() => {
    if (!db || !user || !isAuthorized) return null;
    return collection(db, "bookings");
  }, [db, user, isAuthorized]);

  const { data: firestoreBookings, loading: firestoreLoading, error: firestoreError } = useCollection(bookingsQuery);

  const fetchBookingsViaFunction = React.useCallback(async () => {
    if (!functions) return;
    setIsFetchingBackup(true);
    try {
      const getBookingsFunc = httpsCallable(functions, 'adminGetBookings');
      const result: any = await getBookingsFunc();
      if (Array.isArray(result.data)) {
        setBackupBookings(result.data);
      }
    } catch (err: any) {
      console.warn("Could not fetch bookings via callable function:", err.message);
    } finally {
      setIsFetchingBackup(false);
    }
  }, [functions]);

  // If firestore returns an error or empty while authorized, try callable function
  React.useEffect(() => {
    if (user && isAuthorized && (firestoreError || (!firestoreLoading && (!firestoreBookings || firestoreBookings.length === 0)))) {
      fetchBookingsViaFunction();
    }
  }, [user, isAuthorized, firestoreError, firestoreLoading, firestoreBookings, fetchBookingsViaFunction]);

  const [channelFilter, setChannelFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const channelParam = params.get("channel");
      if (channelParam) {
        setChannelFilter(channelParam);
      }
      const statusParam = params.get("status");
      if (statusParam) {
        setStatusFilter(statusParam);
      }
    }
  }, []);

  const rawBookings = (firestoreBookings && firestoreBookings.length > 0)
    ? firestoreBookings
    : (backupBookings || firestoreBookings || []);

  const sortedBookings = React.useMemo(() => {
    if (!rawBookings) return [];
    return [...rawBookings].sort((a: any, b: any) => {
      const tA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime();
      const tB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime();
      return tB - tA;
    });
  }, [rawBookings]);

  const availableChannels = React.useMemo(() => {
    const set = new Set<string>();
    sortedBookings.forEach((b: any) => {
      const raw = (b.referralSource || "").trim();
      const channel = raw ? getChannelKey(raw) : "Direct / Unspecified";
      set.add(channel);
    });
    return Array.from(set).sort();
  }, [sortedBookings]);

  const filteredBookings = React.useMemo(() => {
    return sortedBookings.filter((b: any) => {
      // 1. Status Filter
      if (statusFilter !== "all" && (b.status || "pending").toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // 2. Channel Filter
      if (channelFilter !== "all") {
        const raw = (b.referralSource || "").trim();
        const sourceKey = raw ? getChannelKey(raw) : "Direct / Unspecified";
        if (sourceKey.toLowerCase() !== channelFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = b.customerName?.toLowerCase().includes(term);
        const matchesEmail = b.email?.toLowerCase().includes(term);
        const matchesPhone = b.phone?.toLowerCase().includes(term);
        const matchesService = b.serviceType?.toLowerCase().includes(term);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesService) {
          return false;
        }
      }

      return true;
    });
  }, [sortedBookings, statusFilter, channelFilter, searchTerm]);

  const [currentPage, setCurrentPage] = React.useState(1);
  const PAGE_SIZE = 10;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, channelFilter, searchTerm]);

  const paginatedBookings = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredBookings.slice(start, start + PAGE_SIZE);
  }, [filteredBookings, currentPage]);

  const isLoading = (firestoreLoading && !backupBookings) || (isFetchingBackup && sortedBookings.length === 0);

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    setUpdatingId(bookingId);
    
    // Helper to send email notification to requester
    const notifyRequester = async () => {
      const targetBooking = (firestoreBookings || backupBookings || []).find((b: any) => b.id === bookingId);
      if (!targetBooking?.email) return "";
      try {
        const res = await fetch('/api/bookings/notify-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            newStatus: status,
            customerEmail: targetBooking.email,
            customerName: targetBooking.customerName || 'Valued Customer',
            serviceType: targetBooking.serviceType || 'Liquid Waste Management',
            appointmentDate: targetBooking.appointmentDate || targetBooking.appointmentDateFormatted,
            preferredTime: targetBooking.preferredTime,
            locationUrl: targetBooking.locationUrl,
            phone: targetBooking.phone
          })
        });
        const data = await res.json();
        if (data.success) {
          return ` Email notification sent to ${targetBooking.email}.`;
        }
      } catch (e) {
        console.warn("Email notification error:", e);
      }
      return "";
    };

    // 1. Direct Firestore update (Instant, real-time sync, zero CORS issues from sanex.rw)
    if (db) {
      try {
        const bookingRef = doc(db, 'bookings', bookingId);
        await updateDoc(bookingRef, {
          status,
          updatedAt: Date.now()
        });
        if (backupBookings) {
          setBackupBookings(prev => prev ? prev.map(b => b.id === bookingId ? { ...b, status } : b) : null);
        }
        const emailNotice = await notifyRequester();
        toast({ title: "Status Updated", description: `Booking marked as ${status}.${emailNotice}` });
        setUpdatingId(null);
        return;
      } catch (firestoreError: any) {
        console.warn("Direct Firestore update failed, falling back to callable function:", firestoreError);
      }
    }

    // 2. Fallback to Cloud Function
    try {
      if (functions) {
        const updateFunc = httpsCallable(functions, 'adminUpdateBookingStatus');
        await updateFunc({ bookingId, status });
        if (backupBookings) {
          setBackupBookings(prev => prev ? prev.map(b => b.id === bookingId ? { ...b, status } : b) : null);
        }
        const emailNotice = await notifyRequester();
        toast({ title: "Status Updated", description: `Booking marked as ${status}.${emailNotice}` });
        return;
      }
      throw new Error("No database or function connection available.");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this service request?")) return;
    setDeletingId(bookingId);
    try {
      if (db) {
        await deleteDoc(doc(db, 'bookings', bookingId));
        if (backupBookings) {
          setBackupBookings(prev => prev ? prev.filter(b => b.id !== bookingId) : null);
        }
        toast({ title: "Request Deleted", description: "The service request has been removed." });
        setDeletingId(null);
        return;
      }
      if (functions) {
        const deleteFunc = httpsCallable(functions, 'adminDeleteBooking');
        await deleteFunc({ bookingId });
        if (backupBookings) {
          setBackupBookings(prev => prev ? prev.filter(b => b.id !== bookingId) : null);
        }
        toast({ title: "Request Deleted", description: "The service request has been removed." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-primary text-white font-bold">Confirmed</Badge>;
      case 'completed': return <Badge className="bg-black text-white font-bold">Completed</Badge>;
      case 'cancelled': return <Badge variant="outline" className="border-black text-black font-bold">Cancelled</Badge>;
      default: return <Badge variant="secondary" className="font-bold">Pending</Badge>;
    }
  };

  if (authLoading || (profileLoading && !userProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar isAdmin />
        <main className="flex-grow flex items-center justify-center px-4">
          <Card className="w-full max-w-md text-center py-12 border-t-4 border-t-[#8DB833]">
            <ShieldAlert className="mx-auto h-12 w-12 text-[#8DB833] mb-4" />
            <CardTitle>Unauthorized Access</CardTitle>
            <p className="mt-2 text-muted-foreground">You do not have permission to view bookings.</p>
            <Button asChild className="mt-6">
              <Link href="/admin">Return to Dashboard</Link>
            </Button>
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
          <Button asChild variant="ghost" className="mb-2 -ml-2">
            <Link href="/admin"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
          </Button>
          
          <div className="flex flex-wrap justify-between items-end mb-5 gap-3">
            <div>
              <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                <ClipboardList className="h-8 w-8 text-primary" /> Bookings
              </h1>
              <p className="text-muted-foreground text-xs">Manage incoming bookings and track service requests.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9 text-xs font-bold"
                onClick={() => fetchBookingsViaFunction()}
                disabled={isFetchingBackup}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isFetchingBackup && "animate-spin")} />
                Refresh
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2 h-9 text-xs font-bold">
                <Link href="/admin/analytics">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" /> Channel Analytics
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9 text-xs font-bold border-[#8DB833] text-[#4a6b1a] hover:bg-[#8DB833]/10"
                onClick={() => {
                  const label =
                    statusFilter !== "all"
                      ? statusFilter
                      : channelFilter !== "all"
                      ? channelFilter.replace(/[^a-z0-9]/gi, "_")
                      : "all";
                  exportBookingsToExcel(filteredBookings, label);
                }}
                disabled={filteredBookings.length === 0}
                title={`Export ${filteredBookings.length} booking(s) to Excel`}
              >
                <FileDown className="h-3.5 w-3.5" />
                Export Excel
                {filteredBookings.length > 0 && (
                  <span className="ml-1 bg-primary text-white rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none">
                    {filteredBookings.length}
                  </span>
                )}
              </Button>
              <Badge variant="outline" className="text-sm px-4 py-1.5">
                {filteredBookings.length} of {sortedBookings.length} Requests
              </Badge>
            </div>
          </div>

          {/* Interactive Filters Bar */}
          <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3 mb-6">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search input */}
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, email, phone, or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 text-xs"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1 shrink-0">Status:</span>
                {[
                  { key: "all", label: "All" },
                  { key: "pending", label: "Pending" },
                  { key: "confirmed", label: "Confirmed" },
                  { key: "completed", label: "Completed" },
                  { key: "cancelled", label: "Cancelled" }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setStatusFilter(item.key)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0",
                      statusFilter === item.key 
                        ? "bg-primary text-white shadow-sm" 
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Channels Filter Row - Dynamically derived from real bookings */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t">
              <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1 flex items-center gap-1 shrink-0">
                <Filter className="h-3 w-3" /> Channel:
              </span>
              <button
                onClick={() => setChannelFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 border",
                  channelFilter === "all" 
                    ? "bg-black text-white border-black shadow-sm" 
                    : "bg-white text-muted-foreground border-muted-foreground/20 hover:border-foreground/40 hover:text-foreground"
                )}
              >
                All Channels
              </button>

              {availableChannels.map(channelName => (
                <button
                  key={channelName}
                  onClick={() => setChannelFilter(channelName)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 border",
                    channelFilter.toLowerCase() === channelName.toLowerCase() 
                      ? "bg-black text-white border-black shadow-sm" 
                      : "bg-white text-muted-foreground border-muted-foreground/20 hover:border-foreground/40 hover:text-foreground"
                  )}
                >
                  {channelName}
                </button>
              ))}

              {(channelFilter !== "all" || statusFilter !== "all" || searchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setChannelFilter("all");
                    setStatusFilter("all");
                    setSearchTerm("");
                    if (typeof window !== "undefined") {
                      window.history.replaceState({}, document.title, window.location.pathname);
                    }
                  }}
                  className="h-7 text-[10px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 ml-auto gap-1"
                >
                  <X className="h-3 w-3" /> Clear Filters
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-5">
            {isLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Loading service requests...</p>
              </div>
            ) : filteredBookings.length > 0 ? (
              <>
                {paginatedBookings.map((booking: any) => (
                <Card key={booking.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 p-5">
                    <div className="space-y-2 lg:col-span-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(booking.status)}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold">
                          <Calendar className="h-3 w-3" /> 
                          {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "Recent"}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold font-headline">{booking.customerName}</h3>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground font-medium">
                        <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {booking.email}</span>
                        <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {booking.phone}</span>
                        {booking.referralSource && (
                          <div className="pt-1">
                            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                              Via {booking.referralSource}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Requested Service</div>
                          <div className="text-lg font-bold">{booking.serviceType}</div>
                        </div>

                        {booking.appointmentDate && (
                          <div className="bg-primary/10 border border-primary/20 px-3 py-2 rounded-lg text-left">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-0.5">
                              <Calendar className="h-3 w-3 text-primary" /> Appointment Date
                            </div>
                            <div className="text-sm font-bold text-foreground">
                              {booking.appointmentDateFormatted || (
                                !isNaN(Date.parse(booking.appointmentDate))
                                  ? new Date(booking.appointmentDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                                  : booking.appointmentDate
                              )}
                            </div>
                            {booking.preferredTime && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3 text-primary" /> {booking.preferredTime}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {booking.description && (
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Details</div>
                          <p className="text-xs bg-muted/50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">{booking.description}</p>
                        </div>
                      )}

                      {booking.locationUrl && (
                        <Button asChild variant="outline" size="sm" className="gap-2 h-8 text-[10px] uppercase font-bold tracking-widest border-primary text-primary">
                          <a href={booking.locationUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" /> View Location Link
                          </a>
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 justify-center border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 text-center">Actions</div>
                      {booking.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="gap-2 bg-primary text-white hover:bg-primary/90 font-bold h-9"
                          onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                          disabled={updatingId === booking.id}
                        >
                          {updatingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />} Confirm Request
                        </Button>
                      )}
                      {booking.status === 'confirmed' && (
                        <Button 
                          size="sm" 
                          variant="default" 
                          className="bg-black hover:bg-black/90 text-white font-bold gap-2 h-9"
                          onClick={() => handleUpdateStatus(booking.id, 'completed')}
                          disabled={updatingId === booking.id}
                        >
                          {updatingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Mark Completed
                        </Button>
                      )}
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 h-9 text-[10px] font-bold uppercase tracking-widest"
                          onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                          disabled={updatingId === booking.id}
                        >
                          <XCircle className="h-4 w-4" /> Cancel Request
                        </Button>
                      )}
                      {(booking.status === 'completed' || booking.status === 'cancelled') && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-9 text-[10px] font-bold uppercase tracking-widest"
                          onClick={() => handleUpdateStatus(booking.id, 'pending')}
                          disabled={updatingId === booking.id}
                        >
                          Reset to Pending
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 px-3 text-xs text-destructive hover:bg-destructive/10 gap-1.5"
                        onClick={() => handleDeleteBooking(booking.id)}
                        disabled={deletingId === booking.id}
                      >
                        {deletingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              <AdminPagination
                currentPage={currentPage}
                totalItems={filteredBookings.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                itemLabel="bookings"
                className="rounded-xl border shadow-sm"
              />
            </>
            ) : sortedBookings.length > 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed p-6">
                <Filter className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <h3 className="text-lg font-bold">No Matching Requests</h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
                  No service requests match your current channel, status, or search filters.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setChannelFilter("all");
                    setStatusFilter("all");
                    setSearchTerm("");
                    if (typeof window !== "undefined") {
                      window.history.replaceState({}, document.title, window.location.pathname);
                    }
                  }}
                  className="h-8 text-[11px] font-bold uppercase tracking-wider"
                >
                  Reset All Filters
                </Button>
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
                <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-xl font-bold">No Bookings Found</h3>
                <p className="text-muted-foreground mb-4">When customers request services, they will appear here.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchBookingsViaFunction()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" /> Check for New Requests
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
