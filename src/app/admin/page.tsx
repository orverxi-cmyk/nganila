
"use client";

import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { useUser, useDoc, useFirestore, useAuth, useCollection, useFunctions } from "@/firebase";
import { doc, setDoc, collection, updateDoc, deleteDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  verifyPasswordResetCode,
  confirmPasswordReset
} from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Users, 
  ShieldAlert, 
  ArrowRight, 
  Loader2, 
  LogIn, 
  Shield, 
  KeyRound, 
  Mail, 
  ClipboardList, 
  Image as ImageIcon,
  CheckCircle2,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Phone,
  ExternalLink,
  Filter,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Search,
  X,
  RefreshCw,
  LayoutDashboard,
  Globe,
  Share2,
  HelpCircle,
  Award,
  Sparkles,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  ChannelAnalyticsDashboard, 
  BookingData, 
  CHANNEL_CONFIG, 
  getChannelKey,
  getChannelConfig
} from "@/components/admin/ChannelAnalyticsDashboard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminPagination } from "@/components/admin/AdminPagination";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useUser();
  const { auth } = useAuth();
  const db = useFirestore();
  const functions = useFunctions();
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  
  const [showResetForm, setShowResetForm] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [isResetting, setIsResetting] = React.useState(false);

  // In-app password reset code handling (from email links)
  const [resetCode, setResetCode] = React.useState<string | null>(null);
  const [resetAccountEmail, setResetAccountEmail] = React.useState<string | null>(null);
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isVerifyingCode, setIsVerifyingCode] = React.useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = React.useState(false);
  const [codeError, setCodeError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined" || !auth) return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

    if (mode === "resetPassword" && oobCode) {
      setResetCode(oobCode);
      setIsVerifyingCode(true);
      verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
          setResetAccountEmail(email);
          setIsVerifyingCode(false);
        })
        .catch((err) => {
          console.error("Invalid reset code:", err);
          setCodeError("This password reset link is invalid or has expired. Please request a new link.");
          setIsVerifyingCode(false);
        });
    }
  }, [auth]);

  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user?.uid]);
  const { data: userProfile, loading: profileLoading } = useDoc(userDocRef);

  const isAuthorized = 
    userProfile?.role === "admin" || 
    (user as any)?.admin === true || 
    user?.email?.toLowerCase() === "tharushyamagara@gmail.com" ||
    user?.email?.toLowerCase() === "orverxi@gmail.com";

  const bookingsQuery = React.useMemo(() => {
    if (!db || !user || !isAuthorized) return null;
    return collection(db, "bookings");
  }, [db, user, isAuthorized]);

  const { data: firestoreBookings, loading: bookingsLoading } = useCollection(bookingsQuery);

  const [activeMenu, setActiveMenu] = React.useState<"operations" | "requests" | "platforms">("operations");
  const [selectedPlatformTab, setSelectedPlatformTab] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this request?")) return;
    setDeletingId(bookingId);
    try {
      if (db) {
        await deleteDoc(doc(db, 'bookings', bookingId));
        toast({ title: "Request Deleted", description: "The service request has been removed." });
        setDeletingId(null);
        return;
      }
      if (functions) {
        const deleteFunc = httpsCallable(functions, 'adminDeleteBooking');
        await deleteFunc({ bookingId });
        toast({ title: "Request Deleted", description: "The service request has been removed." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "requests" || tab === "platforms" || tab === "operations") {
        setActiveMenu(tab);
      }
      const statusParam = params.get("status");
      if (statusParam && (statusParam === "pending" || statusParam === "confirmed" || statusParam === "completed" || statusParam === "cancelled")) {
        setStatusFilter(statusParam as any);
        setActiveMenu("requests");
      }
      const platformParam = params.get("platform");
      if (platformParam) {
        setSelectedPlatformTab(platformParam);
        setActiveMenu("platforms");
      }
    }
  }, []);

  const statusCounts = React.useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let completed = 0;
    let cancelled = 0;
    (firestoreBookings || []).forEach((b: any) => {
      const s = (b.status || 'pending').toLowerCase();
      if (s === 'confirmed') confirmed++;
      else if (s === 'completed') completed++;
      else if (s === 'cancelled') cancelled++;
      else pending++;
    });
    return {
      all: (firestoreBookings || []).length,
      pending,
      confirmed,
      completed,
      cancelled,
    };
  }, [firestoreBookings]);

  const filteredBookings = React.useMemo(() => {
    return (firestoreBookings || []).filter((b: any) => {
      const s = (b.status || 'pending').toLowerCase();
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending' && s !== 'pending') return false;
        if (statusFilter === 'confirmed' && s !== 'confirmed') return false;
        if (statusFilter === 'completed' && s !== 'completed') return false;
        if (statusFilter === 'cancelled' && s !== 'cancelled') return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = b.customerName?.toLowerCase().includes(term);
        const matchesEmail = b.email?.toLowerCase().includes(term);
        const matchesPhone = b.phone?.toLowerCase().includes(term);
        const matchesService = b.serviceType?.toLowerCase().includes(term);
        const matchesSource = b.referralSource?.toLowerCase().includes(term);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesService && !matchesSource) {
          return false;
        }
      }
      return true;
    }).sort((a: any, b: any) => {
      const tA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime();
      const tB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime();
      return tB - tA;
    });
  }, [firestoreBookings, statusFilter, searchTerm]);

  const [requestsPage, setRequestsPage] = React.useState(1);
  const [platformPage, setPlatformPage] = React.useState(1);
  const PAGE_SIZE = 10;

  React.useEffect(() => {
    setRequestsPage(1);
  }, [statusFilter, searchTerm]);

  React.useEffect(() => {
    setPlatformPage(1);
  }, [selectedPlatformTab]);

  const paginatedRequests = React.useMemo(() => {
    const start = (requestsPage - 1) * PAGE_SIZE;
    return filteredBookings.slice(start, start + PAGE_SIZE);
  }, [filteredBookings, requestsPage]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    if (!db) return;
    setUpdatingId(bookingId);
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: Date.now()
      });

      // Find the booking details to notify requester via email
      const targetBooking = (firestoreBookings || []).find((b: any) => b.id === bookingId);
      let emailNotice = "";

      if (targetBooking?.email) {
        try {
          const res = await fetch('/api/bookings/notify-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId,
              newStatus,
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
            emailNotice = ` Email notification sent to ${targetBooking.email}.`;
          }
        } catch (mailErr) {
          console.warn("Could not dispatch status email:", mailErr);
        }
      }

      toast({ 
        title: "Status Updated", 
        description: `Request marked as ${newStatus}.${emailNotice}` 
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'confirmed':
        return <Badge className="bg-primary text-white font-bold text-[10px]">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-black text-white font-bold text-[10px]">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-black text-black font-bold text-[10px]">Cancelled</Badge>;
      default:
        return <Badge className="bg-muted text-black border border-border font-bold text-[10px]">Pending</Badge>;
    }
  };

  const bookingsList: BookingData[] = React.useMemo(() => {
    return (firestoreBookings || []).map((b: any) => ({
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
  }, [firestoreBookings]);

  const platformStats = React.useMemo(() => {
    const counts: Record<string, { total: number; confirmed: number; pending: number; cancelled: number }> = {};

    (firestoreBookings || []).forEach((booking: any) => {
      const rawSource = (booking.referralSource || "").trim();
      const key = rawSource ? getChannelKey(rawSource) : "Direct / Unspecified";
      if (!counts[key]) {
        counts[key] = { total: 0, confirmed: 0, pending: 0, cancelled: 0 };
      }
      counts[key].total += 1;
      const status = (booking.status || "pending").toLowerCase();
      if (status === "confirmed" || status === "completed") {
        counts[key].confirmed += 1;
      } else if (status === "cancelled") {
        counts[key].cancelled += 1;
      } else {
        counts[key].pending += 1;
      }
    });

    const totalAll = (firestoreBookings || []).length;
    if (totalAll === 0) return [];

    return Object.entries(counts).map(([name, data]) => {
      const share = Math.round((data.total / totalAll) * 100);
      const conversionRate = data.total > 0 ? Math.round((data.confirmed / data.total) * 100) : 0;
      return {
        name,
        total: data.total,
        confirmed: data.confirmed,
        pending: data.pending,
        cancelled: data.cancelled,
        share,
        conversionRate,
        config: getChannelConfig(name)
      };
    }).sort((a, b) => b.total - a.total);
  }, [firestoreBookings]);

  const topPlatform = React.useMemo(() => {
    const active = platformStats.filter(p => p.total > 0 && p.name !== "Direct / Unspecified");
    return active.length > 0 ? active[0] : null;
  }, [platformStats]);

  const platformFilteredBookings = React.useMemo(() => {
    if (selectedPlatformTab === "all") return firestoreBookings || [];
    return (firestoreBookings || []).filter((b: any) => {
      const rawSource = (b.referralSource || "").trim();
      const key = rawSource ? getChannelKey(rawSource) : "Direct / Unspecified";
      return key.toLowerCase() === selectedPlatformTab.toLowerCase();
    }).sort((a: any, b: any) => {
      const tA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime();
      const tB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime();
      return tB - tA;
    });
  }, [firestoreBookings, selectedPlatformTab]);

  const paginatedPlatformBookings = React.useMemo(() => {
    const start = (platformPage - 1) * PAGE_SIZE;
    return platformFilteredBookings.slice(start, start + PAGE_SIZE);
  }, [platformFilteredBookings, platformPage]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setIsLoggingIn(true);
    try {
      const result = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      if (db) {
        try {
          const userRef = doc(db, "users", result.user.uid);
          await setDoc(userRef, {
            lastLogin: Date.now(),
          }, { merge: true });
        } catch (firestoreErr) {
          console.warn("Could not update lastLogin timestamp:", firestoreErr);
        }
      }
      toast({ title: "Welcome back", description: "Authentication successful." });
    } catch (error: any) {
      console.error("Login error:", error);
      let description = "Invalid email or password. Please try again.";
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        description = "Invalid access key or credentials. Please check your details and try again.";
      } else if (error.code === "auth/too-many-requests") {
        description = "Access temporarily disabled due to multiple failed attempts. Please reset your password.";
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Login Error",
        description,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (db) {
        try {
          const userRef = doc(db, "users", result.user.uid);
          await setDoc(userRef, {
            lastLogin: Date.now(),
          }, { merge: true });
        } catch (e) {
          console.warn("Could not update lastLogin in Firestore:", e);
        }
      }
      toast({ title: "Welcome back", description: "Successfully authenticated with Google." });
    } catch (error: any) {
      if (error.code !== "auth/popup-closed-by-user") {
        console.error("Google sign in error:", error);
        toast({
          variant: "destructive",
          title: "Sign In Error",
          description: error.message || "Failed to sign in with Google.",
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !resetEmail) return;
    
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      toast({
        title: "Reset Email Sent",
        description: `A password reset link has been dispatched to ${resetEmail.trim()}. Please check your Inbox and Spam/Junk folder.`,
      });
      setShowResetForm(false);
    } catch (error: any) {
      console.error("Reset error:", error);
      let description = "Failed to send reset email.";
      if (error.code === "auth/user-not-found") {
        description = "No registered account found with that email address.";
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Reset Error",
        description,
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !resetCode) return;
    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Access key must be at least 6 characters long.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Mismatch",
        description: "Access keys do not match.",
      });
      return;
    }

    setIsConfirmingReset(true);
    try {
      await confirmPasswordReset(auth, resetCode, newPassword);
      toast({
        title: "Access Key Updated",
        description: "Your new password has been set. You can now sign in.",
      });
      setResetCode(null);
      if (resetAccountEmail) {
        setLoginEmail(resetAccountEmail);
      }
      setLoginPassword(newPassword);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error: any) {
      console.error("Confirm reset error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update access key. The link may have expired.",
      });
    } finally {
      setIsConfirmingReset(false);
    }
  };

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle in-app password reset link landing
  if (resetCode) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar isAdmin />
        <main className="flex-grow flex items-center justify-center bg-muted/30 px-4 py-8 font-arial">
          <Card className="w-full max-w-md shadow-xl border-none">
            <CardHeader className="text-center">
              <KeyRound className="mx-auto h-12 w-12 text-primary mb-2" />
              <CardTitle className="text-xl font-bold">Set New Access Key</CardTitle>
              <CardDescription className="text-[14px]">
                {isVerifyingCode ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying recovery link...
                  </span>
                ) : codeError ? (
                  <span className="text-foreground font-medium bg-[#8DB833]/20 px-2 py-0.5 rounded">{codeError}</span>
                ) : (
                  <span>Updating password for <strong>{resetAccountEmail}</strong></span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {codeError ? (
                <div className="space-y-4">
                  <Button 
                    className="w-full h-12 bg-primary text-white font-bold uppercase tracking-widest text-[12px] rounded-full hover:bg-primary/90"
                    onClick={() => {
                      setResetCode(null);
                      setCodeError(null);
                      setShowResetForm(true);
                      window.history.replaceState({}, document.title, window.location.pathname);
                    }}
                  >
                    Request New Reset Link
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full h-12 font-bold uppercase tracking-widest text-[10px]"
                    onClick={() => {
                      setResetCode(null);
                      setCodeError(null);
                      window.history.replaceState({}, document.title, window.location.pathname);
                    }}
                  >
                    Back to Login
                  </Button>
                </div>
              ) : !isVerifyingCode ? (
                <form onSubmit={handleConfirmReset} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">New Access Key / Password</Label>
                    <Input 
                      type="password" 
                      required 
                      className="h-10 text-sm" 
                      placeholder="At least 6 characters" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Confirm Access Key</Label>
                    <Input 
                      type="password" 
                      required 
                      className="h-10 text-sm" 
                      placeholder="Re-type new password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isConfirmingReset} 
                    className="w-full h-12 gap-2 bg-primary text-white font-bold uppercase tracking-widest text-[12px] rounded-full hover:bg-primary/90"
                  >
                    {isConfirmingReset ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Save & Sign In
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar isAdmin />
        <main className="flex-grow flex items-center justify-center bg-muted/30 px-4 py-8 font-arial">
          <Card className="w-full max-w-md shadow-xl border-none">
            <CardHeader className="text-center">
              {showResetForm ? <KeyRound className="mx-auto h-12 w-12 text-primary mb-2" /> : <Shield className="mx-auto h-12 w-12 text-primary mb-2" />}
              <CardTitle className="text-xl font-bold">
                {showResetForm ? "Reset Access Key" : "Admin Portal Access"}
              </CardTitle>
              <CardDescription className="text-[14px] font-normal">
                {showResetForm ? "Enter your admin email to receive a recovery link" : "Secure credentials required for operations"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showResetForm ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Admin Work Email</Label>
                    <Input 
                      type="email" 
                      required 
                      className="h-10 text-sm" 
                      placeholder="orverxi@gmail.com" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Access Key / Password</Label>
                      <Button 
                        type="button" 
                        variant="link" 
                        className="p-0 h-auto text-[10px] text-primary font-bold uppercase tracking-widest"
                        onClick={() => {
                          setResetEmail(loginEmail);
                          setShowResetForm(true);
                        }}
                      >
                        Forgot?
                      </Button>
                    </div>
                    <Input 
                      type="password" 
                      required 
                      className="h-10 text-sm" 
                      placeholder="••••••••" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                  <div className="pt-2 flex flex-col gap-3 w-full">
                    <Button type="submit" disabled={isLoggingIn} className="w-full h-12 gap-2 bg-primary text-white font-bold uppercase tracking-widest text-[12px] rounded-full hover:bg-primary/90">
                      {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Sign In to Operations
                    </Button>
                    
                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-muted"></div>
                      <span className="flex-shrink mx-4 text-[10px] font-bold uppercase text-muted-foreground">OR</span>
                      <div className="flex-grow border-t border-muted"></div>
                    </div>

                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleGoogleSignIn}
                      disabled={isLoggingIn}
                      className="w-full h-11 gap-2 font-bold uppercase tracking-widest text-[11px] rounded-full hover:bg-muted"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      Sign In with Google
                    </Button>

                    <Button asChild variant="ghost" className="w-full h-10 font-bold uppercase tracking-widest text-[10px]">
                      <Link href="/">Return to Site</Link>
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Registered Admin Email</Label>
                    <Input 
                      type="email" 
                      required 
                      className="h-10 text-sm" 
                      placeholder="orverxi@gmail.com" 
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                  <div className="pt-2 flex flex-col gap-2 w-full">
                    <Button type="submit" disabled={isResetting} className="w-full h-12 gap-2 bg-primary text-white font-bold uppercase tracking-widest text-[12px] rounded-full hover:bg-primary/90">
                      {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Send Recovery Link
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowResetForm(false)} className="w-full h-10 font-bold uppercase tracking-widest text-[10px]">
                      Back to Login
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar isAdmin />
        <main className="flex-grow flex items-center justify-center bg-muted/30 px-4 py-5 font-arial">
          <Card className="w-full max-w-md shadow-xl border-t-4 border-t-[#8DB833] border-x-0 border-b-0">
            <CardHeader className="text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-[#8DB833] mb-2" />
              <CardTitle className="text-xl font-bold">Unauthorized Access</CardTitle>
              <CardDescription className="text-sm">
                Account <strong>{user?.email}</strong> does not have operational permissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-xs text-muted-foreground">Please request administrative status from an authorized system administrator.</p>
              <div className="flex flex-wrap gap-x-[5px] gap-y-[20px] w-full">
                <Button asChild variant="secondary" className="flex-grow h-12 font-bold uppercase tracking-widest text-[10px]">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-arial text-[14px] bg-muted/10">
      <Navbar isAdmin />

      <div className="flex-grow flex flex-col lg:flex-row">
        {/* Left Side Menu */}
        <AdminSidebar 
          activeTab={activeMenu} 
          onSelectTab={setActiveMenu} 
          pendingRequestsCount={statusCounts.pending} 
        />

        {/* Right Dynamic View Area */}
        <main className="flex-grow p-4 md:p-8 space-y-6 overflow-x-hidden">
          {/* ========================================================== */}
          {/* VIEW 1: OPERATION CENTER */}
          {/* ========================================================== */}
          {activeMenu === 'operations' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-primary/20 text-black border-primary/30 font-bold uppercase text-[9px] tracking-wider">
                      Executive Overview
                    </Badge>
                    <span className="text-xs text-muted-foreground">• System Operations</span>
                  </div>
                  <h1 className="text-2xl font-bold font-headline">Operations Center</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Managing Nganira Company LTD digital infrastructure, service inquiries, and marketing attribution.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setActiveMenu('requests')}
                    className="h-9 text-xs font-bold gap-2 bg-primary text-white hover:bg-primary/90"
                  >
                    <ClipboardList className="h-4 w-4" /> View Requests ({statusCounts.all})
                  </Button>
                </div>
              </div>

              {/* High-level KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border bg-white shadow-sm hover:shadow transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between text-muted-foreground mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Total Inquiries</span>
                      <ClipboardList className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">{statusCounts.all}</div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Lifetime volume</span>
                      <button 
                        onClick={() => setActiveMenu('requests')}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                      >
                        Inspect <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border bg-white shadow-sm hover:shadow transition-shadow border-border hover:border-black/30">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between text-muted-foreground mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Pending Requests</span>
                      <Clock className="h-4 w-4 text-black" />
                    </div>
                    <div className="text-2xl font-bold text-black">{statusCounts.pending}</div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Awaiting review</span>
                      <button 
                        onClick={() => { setActiveMenu('requests'); setStatusFilter('pending'); }}
                        className="text-xs font-bold text-black hover:text-primary hover:underline flex items-center gap-0.5"
                      >
                        Action <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border bg-white shadow-sm hover:shadow transition-shadow border-border hover:border-black/30">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between text-muted-foreground mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Confirmed Bookings</span>
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-black">{statusCounts.confirmed}</div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Scheduled pickup</span>
                      <button 
                        onClick={() => { setActiveMenu('requests'); setStatusFilter('confirmed'); }}
                        className="text-xs font-bold text-black hover:text-primary hover:underline flex items-center gap-0.5"
                      >
                        Schedule <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border bg-white shadow-sm hover:shadow transition-shadow border-border hover:border-black/30">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between text-muted-foreground mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Top Lead Platform</span>
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-xl font-bold text-black truncate">
                      {topPlatform ? topPlatform.name : "None yet"}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {topPlatform ? `${topPlatform.share}% of leads` : "0 recorded leads"}
                      </span>
                      <button 
                        onClick={() => setActiveMenu('platforms')}
                        className="text-xs font-bold text-black hover:text-primary hover:underline flex items-center gap-0.5"
                      >
                        Performance <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Operational Modules Executive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* 1. Content Management */}
                <Card className="group hover:shadow-lg transition-all border bg-white">
                  <CardHeader className="pb-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-black flex items-center justify-center mb-3">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-[15px] font-bold">Content</CardTitle>
                    <CardDescription className="text-[12px] font-normal">Branding, services, and articles.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full h-9 font-bold uppercase tracking-widest text-[10px] group-hover:bg-primary group-hover:text-black transition-colors">
                      <Link href="/admin/content">Manage Content <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* 2. Bookings */}
                <Card className="group hover:shadow-lg transition-all border bg-white">
                  <CardHeader className="pb-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-black flex items-center justify-center mb-3">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-[15px] font-bold">Bookings</CardTitle>
                    <CardDescription className="text-[12px] font-normal">Requests &amp; service pipeline.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full h-9 font-bold uppercase tracking-widest text-[10px] group-hover:bg-primary group-hover:text-black transition-colors">
                      <Link href="/admin/bookings">Manage Bookings <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* 3. Clients */}
                <Card className="group hover:shadow-lg transition-all border bg-white">
                  <CardHeader className="pb-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-black flex items-center justify-center mb-3">
                      <Users className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-[15px] font-bold">Clients</CardTitle>
                    <CardDescription className="text-[12px] font-normal">Customer lifecycle &amp; history.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full h-9 font-bold uppercase tracking-widest text-[10px] group-hover:bg-primary group-hover:text-black transition-colors">
                      <Link href="/admin/clients">View Clients <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* 4. Send Email */}
                <Card className="group hover:shadow-lg transition-all border bg-white">
                  <CardHeader className="pb-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-black flex items-center justify-center mb-3">
                      <Mail className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-[15px] font-bold">Send Email</CardTitle>
                    <CardDescription className="text-[12px] font-normal">Outreach &amp; client campaigns.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full h-9 font-bold uppercase tracking-widest text-[10px] group-hover:bg-primary group-hover:text-black transition-colors">
                      <Link href="/admin/emails">Send Email <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* 5. Platform Performance */}
                <Card 
                  onClick={() => setActiveMenu('platforms')}
                  className="group hover:shadow-lg transition-all border bg-white cursor-pointer"
                >
                  <CardHeader className="pb-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-black flex items-center justify-center mb-3">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-[15px] font-bold">Analytics</CardTitle>
                    <CardDescription className="text-[12px] font-normal">Lead channels &amp; conversion.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full h-9 font-bold uppercase tracking-widest text-[10px] group-hover:bg-primary group-hover:text-black transition-colors">
                      View Stats <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Requests Snapshot on Operation Center */}
              <Card className="border bg-white shadow-sm overflow-hidden">

                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                  <div>
                    <CardTitle className="text-base font-bold">Recent Service Inquiries</CardTitle>
                    <CardDescription className="text-xs">Latest customer requests placed through the booking system</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveMenu('requests')}
                    className="h-8 text-[10px] font-bold uppercase tracking-widest gap-1"
                  >
                    View All in Requests Menu <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {bookingsLoading ? (
                    <div className="py-10 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </div>
                  ) : filteredBookings.length > 0 ? (
                    <div className="divide-y divide-border">
                      {filteredBookings.slice(0, 4).map((b: any) => (
                        <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusBadge(b.status)}
                              {b.referralSource && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                                  Via {b.referralSource}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "Recent"}
                              </span>
                            </div>
                            <div className="font-bold text-sm">{b.customerName} <span className="text-xs font-normal text-muted-foreground">• {b.serviceType}</span></div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setActiveMenu('requests'); }}
                            className="h-8 text-xs font-bold text-primary hover:bg-primary/10 self-start sm:self-auto"
                          >
                            Manage Request <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No customer inquiries placed yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW 2: REQUESTS WITH TABLED MENU & STATUS FILTERS */}
          {/* ========================================================== */}
          {activeMenu === 'requests' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-primary/20 text-black border-primary/30 font-bold uppercase text-[9px] tracking-wider">
                      Requests Pipeline
                    </Badge>
                    <span className="text-xs text-muted-foreground">• Workflow Management</span>
                  </div>
                  <h1 className="text-2xl font-bold font-headline">Service Requests</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Filter, confirm, fulfill, or cancel client liquid waste requests in real time.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="h-9 text-xs font-bold gap-1.5">
                    <Link href="/admin/bookings">
                      <ExternalLink className="h-3.5 w-3.5 text-primary" /> Bookings
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Clickable Status Filter Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Request (Pending) */}
                <button
                  type="button"
                  onClick={() => setStatusFilter(prev => prev === 'pending' ? 'all' : 'pending')}
                  className={cn(
                    "text-left p-4 rounded-xl border bg-white shadow-sm transition-all relative overflow-hidden group cursor-pointer",
                    statusFilter === 'pending'
                      ? "border-primary ring-2 ring-primary/40 bg-primary/10 shadow-md"
                      : "hover:border-black/30 hover:shadow"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center font-bold transition-colors",
                      statusFilter === 'pending' ? "bg-primary text-white" : "bg-black/5 text-black"
                    )}>
                      <Clock className="h-4 w-4" />
                    </div>
                    <Badge className={cn(
                      "text-[10px] font-bold transition-colors",
                      statusFilter === 'pending' ? "bg-primary text-white" : "bg-muted text-black border border-border"
                    )}>
                      {statusFilter === 'pending' ? 'Active Filter' : 'Filter'}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold font-headline text-black">{statusCounts.pending}</div>
                  <div className="text-xs font-bold text-black mt-0.5">Requests (Pending)</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting operator confirmation</p>
                </button>

                {/* 2. Confirmed */}
                <button
                  type="button"
                  onClick={() => setStatusFilter(prev => prev === 'confirmed' ? 'all' : 'confirmed')}
                  className={cn(
                    "text-left p-4 rounded-xl border bg-white shadow-sm transition-all relative overflow-hidden group cursor-pointer",
                    statusFilter === 'confirmed'
                      ? "border-primary ring-2 ring-primary/40 bg-primary/10 shadow-md"
                      : "hover:border-black/30 hover:shadow"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center font-bold transition-colors",
                      statusFilter === 'confirmed' ? "bg-primary text-white" : "bg-black/5 text-black"
                    )}>
                      <Calendar className="h-4 w-4" />
                    </div>
                    <Badge className={cn(
                      "text-[10px] font-bold transition-colors",
                      statusFilter === 'confirmed' ? "bg-primary text-white" : "bg-muted text-black border border-border"
                    )}>
                      {statusFilter === 'confirmed' ? 'Active Filter' : 'Filter'}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold font-headline text-black">{statusCounts.confirmed}</div>
                  <div className="text-xs font-bold text-black mt-0.5">Confirmed</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Scheduled for collection</p>
                </button>

                {/* 3. Completed */}
                <button
                  type="button"
                  onClick={() => setStatusFilter(prev => prev === 'completed' ? 'all' : 'completed')}
                  className={cn(
                    "text-left p-4 rounded-xl border bg-white shadow-sm transition-all relative overflow-hidden group cursor-pointer",
                    statusFilter === 'completed'
                      ? "border-black ring-2 ring-black/40 bg-black/5 shadow-md"
                      : "hover:border-black/30 hover:shadow"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center font-bold transition-colors",
                      statusFilter === 'completed' ? "bg-black text-white" : "bg-black/5 text-black"
                    )}>
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <Badge className={cn(
                      "text-[10px] font-bold transition-colors",
                      statusFilter === 'completed' ? "bg-black text-white" : "bg-muted text-black border border-border"
                    )}>
                      {statusFilter === 'completed' ? 'Active Filter' : 'Filter'}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold font-headline text-black">{statusCounts.completed}</div>
                  <div className="text-xs font-bold text-black mt-0.5">Completed</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Fulfilled service operations</p>
                </button>

                {/* 4. Canceled */}
                <button
                  type="button"
                  onClick={() => setStatusFilter(prev => prev === 'cancelled' ? 'all' : 'cancelled')}
                  className={cn(
                    "text-left p-4 rounded-xl border bg-white shadow-sm transition-all relative overflow-hidden group cursor-pointer",
                    statusFilter === 'cancelled'
                      ? "border-black ring-2 ring-black/40 bg-black/5 shadow-md"
                      : "hover:border-black/30 hover:shadow"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center font-bold transition-colors",
                      statusFilter === 'cancelled' ? "bg-muted text-black border border-border" : "bg-black/5 text-black"
                    )}>
                      <XCircle className="h-4 w-4" />
                    </div>
                    <Badge className={cn(
                      "text-[10px] font-bold transition-colors",
                      statusFilter === 'cancelled' ? "border border-black text-black bg-white" : "bg-muted text-black border border-border"
                    )}>
                      {statusFilter === 'cancelled' ? 'Active Filter' : 'Filter'}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold font-headline text-black">{statusCounts.cancelled}</div>
                  <div className="text-xs font-bold text-black mt-0.5">Canceled</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Declined or withdrawn</p>
                </button>
              </div>

              {/* Tabled Menu Bar (Tabs for Status) + Search Filter */}
              <Card className="border bg-white shadow-sm overflow-hidden">
                <CardHeader className="pb-3 border-b bg-muted/10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Status Tabled Menu Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1 shrink-0 flex items-center gap-1">
                        <Filter className="h-3 w-3" /> Status:
                      </span>
                      {[
                        { key: "all", label: `All Requests (${statusCounts.all})` },
                        { key: "pending", label: `Requests (${statusCounts.pending})` },
                        { key: "confirmed", label: `Confirmed (${statusCounts.confirmed})` },
                        { key: "completed", label: `Completed (${statusCounts.completed})` },
                        { key: "cancelled", label: `Canceled (${statusCounts.cancelled})` }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setStatusFilter(tab.key as any)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border",
                            statusFilter === tab.key 
                              ? "bg-primary text-white border-primary shadow-sm" 
                              : "bg-white text-muted-foreground border-border hover:text-foreground"
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-grow max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search by customer, phone, service..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-8 text-xs bg-white"
                      />
                      {searchTerm && (
                        <button 
                          onClick={() => setSearchTerm("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Tabled View Table Content */}
                <CardContent className="p-0">
                  {bookingsLoading && filteredBookings.length === 0 ? (
                    <div className="py-16 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="mt-2 text-xs text-muted-foreground">Loading service requests...</p>
                    </div>
                  ) : filteredBookings.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              <th className="py-3 px-4">Client / Contact</th>
                              <th className="py-3 px-4">Service Details</th>
                              <th className="py-3 px-4">Platform Origin</th>
                              <th className="py-3 px-4">Appointment</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-xs">
                            {paginatedRequests.map((b: any) => (
                              <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-foreground">{b.customerName}</div>
                                  <div className="text-[11px] text-muted-foreground flex flex-col gap-0.5 mt-0.5">
                                    {b.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-primary" /> {b.email}</span>}
                                    {b.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-primary" /> {b.phone}</span>}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-bold">{b.serviceType}</div>
                                  {b.description && (
                                    <div className="text-[11px] text-muted-foreground truncate max-w-xs">{b.description}</div>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {b.referralSource ? (
                                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                                      Via {b.referralSource}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-muted-foreground">Direct / Untracked</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-foreground">
                                    {b.appointmentDate || "Not Specified"}
                                  </div>
                                  {b.preferredTime && (
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-2.5 w-2.5" /> {b.preferredTime}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {getStatusBadge(b.status)}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {(!b.status || b.status === 'pending') && (
                                      <Button
                                        size="sm"
                                        className="h-7 px-2.5 text-[11px] font-bold bg-primary text-white hover:bg-primary/90"
                                        onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                        disabled={updatingId === b.id}
                                      >
                                        {updatingId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                                      </Button>
                                    )}
                                    {b.status === 'confirmed' && (
                                      <Button
                                        size="sm"
                                        className="h-7 px-2.5 text-[11px] font-bold bg-black hover:bg-black/80 text-white"
                                        onClick={() => handleUpdateStatus(b.id, 'completed')}
                                        disabled={updatingId === b.id}
                                      >
                                        {updatingId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Complete"}
                                      </Button>
                                    )}
                                    {b.status !== 'cancelled' && b.status !== 'completed' && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                                        onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                                        disabled={updatingId === b.id}
                                      >
                                        Cancel
                                      </Button>
                                    )}
                                    {(b.status === 'completed' || b.status === 'cancelled') && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-[10px] font-bold"
                                        onClick={() => handleUpdateStatus(b.id, 'pending')}
                                        disabled={updatingId === b.id}
                                      >
                                        Reset
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      title="Delete Request"
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDeleteBooking(b.id)}
                                      disabled={deletingId === b.id}
                                    >
                                      {deletingId === b.id ? <Loader2 className="h-3 w-3 animate-spin text-destructive" /> : <Trash2 className="h-3.5 w-3.5" />}
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <AdminPagination
                        currentPage={requestsPage}
                        totalItems={filteredBookings.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={setRequestsPage}
                        itemLabel="requests"
                      />
                    </>
                  ) : (
                    <div className="py-16 text-center p-6">
                      <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground opacity-30 mb-2" />
                      <p className="text-sm font-bold text-foreground">
                        No {statusFilter === 'all' ? '' : statusFilter} requests found
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {statusFilter !== 'all' ? `No bookings currently match status: ${statusFilter}.` : 'No incoming requests have been recorded yet.'}
                      </p>
                      {statusFilter !== 'all' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setStatusFilter('all')}
                          className="mt-3 h-7 text-xs font-bold"
                        >
                          Clear Status Filter
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW 3: PLATFORM PERFORMANCE WITH TABLED MENU FOR EACH PLATFORM */}
          {/* ========================================================== */}
          {activeMenu === 'platforms' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-primary/20 text-black border-primary/30 font-bold uppercase text-[9px] tracking-wider">
                      Marketing Attribution
                    </Badge>
                    <span className="text-xs text-muted-foreground">• Platform ROI Intelligence</span>
                  </div>
                  <h1 className="text-2xl font-bold font-headline">Platform Performance</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Analyze customer acquisition channels and conversion efficacy by platform.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="h-9 text-xs font-bold gap-1.5">
                    <Link href="/admin/analytics">
                      <ExternalLink className="h-3.5 w-3.5 text-primary" /> Full Analytics Center
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Tabled Menu for Each Platform - Strictly Live Platforms from Real Bookings */}
              <div className="bg-white p-2 rounded-2xl border shadow-sm flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSelectedPlatformTab('all')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2",
                    selectedPlatformTab === 'all'
                      ? "bg-black text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <BarChart3 className="h-3.5 w-3.5" /> All Platforms (Overview)
                  {firestoreBookings && firestoreBookings.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-bold">
                      {firestoreBookings.length}
                    </span>
                  )}
                </button>

                {/* Dynamically discover real platforms strictly from live booking requests */}
                {platformStats.filter(p => p.total > 0).map(stat => {
                  const Icon = stat.config?.icon || Globe;
                  const isSelected = selectedPlatformTab.toLowerCase() === stat.name.toLowerCase();
                  return (
                    <button
                      key={stat.name}
                      type="button"
                      onClick={() => setSelectedPlatformTab(stat.name)}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border",
                        isSelected
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: isSelected ? '#fff' : stat.config?.color }} />
                      <span>{stat.name}</span>
                      <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full font-bold", isSelected ? "bg-white/20 text-white" : "bg-black/10 text-foreground")}>
                        {stat.total}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Display depending on selectedPlatformTab */}
              {selectedPlatformTab === 'all' ? (
                /* Full Embedded Channel Dashboard */
                <ChannelAnalyticsDashboard 
                  bookings={bookingsList} 
                  isRefreshing={bookingsLoading}
                />
              ) : (
                /* Platform-Specific Spotlight and Requests Table */
                <div className="space-y-6">
                  {(() => {
                    const currentStat = platformStats.find(p => p.name.toLowerCase() === selectedPlatformTab.toLowerCase()) || {
                      name: selectedPlatformTab,
                      total: platformFilteredBookings.length,
                      confirmed: platformFilteredBookings.filter((b: any) => b.status === 'confirmed' || b.status === 'completed').length,
                      pending: platformFilteredBookings.filter((b: any) => !b.status || b.status === 'pending').length,
                      cancelled: platformFilteredBookings.filter((b: any) => b.status === 'cancelled').length,
                      share: 0,
                      conversionRate: platformFilteredBookings.length > 0 ? Math.round((platformFilteredBookings.filter((b: any) => b.status === 'confirmed' || b.status === 'completed').length / platformFilteredBookings.length) * 100) : 0,
                      config: getChannelConfig(selectedPlatformTab)
                    };
                    const PlatformIcon = currentStat.config?.icon || Globe;

                    if (platformFilteredBookings.length === 0) {
                      return (
                        <Card className="border bg-white shadow-sm p-10 text-center max-w-xl mx-auto my-6">
                          <div 
                            className="h-14 w-14 rounded-2xl mx-auto flex items-center justify-center mb-4 border"
                            style={{ backgroundColor: `${currentStat.config?.color}15`, color: currentStat.config?.color, borderColor: `${currentStat.config?.color}30` }}
                          >
                            <PlatformIcon className="h-7 w-7" />
                          </div>
                          <h3 className="text-lg font-bold text-foreground">{currentStat.name}</h3>
                          <Badge variant="outline" className="mt-2 text-xs">0 Inquiries Recorded</Badge>
                          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                            No service requests have listed &quot;{currentStat.name}&quot; as their acquisition source yet. When incoming requests specify this channel, live attribution metrics and bookings will appear here.
                          </p>
                          <div className="mt-4">
                            <Button size="sm" variant="outline" onClick={() => setSelectedPlatformTab('all')}>
                              Back to Overview
                            </Button>
                          </div>
                        </Card>
                      );
                    }

                    return (
                      <>
                        {/* Platform Spotlight Card */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <Card className="border bg-white shadow-sm p-5 flex items-center gap-4">
                            <div 
                              className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border bg-primary/10 text-black border-primary/20"
                            >
                              <PlatformIcon className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Platform</div>
                              <div className="text-xl font-bold text-foreground">{currentStat.name}</div>
                            </div>
                          </Card>

                          <Card className="border bg-white shadow-sm p-5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Inquiries</div>
                            <div className="text-2xl font-bold text-black">{currentStat.total}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{currentStat.share}% of all inbound requests</div>
                          </Card>

                          <Card className="border bg-white shadow-sm p-5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Confirmed / Completed</div>
                            <div className="text-2xl font-bold text-black">{currentStat.confirmed}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">Fulfillment scheduled</div>
                          </Card>

                          <Card className="border bg-white shadow-sm p-5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Conversion Rate</div>
                            <div className="text-2xl font-bold text-black">{currentStat.conversionRate}%</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{currentStat.pending} pending confirmation</div>
                          </Card>
                        </div>

                        {/* Requests Table specific to this platform */}
                        <Card className="border bg-white shadow-sm overflow-hidden">
                          <CardHeader className="border-b bg-muted/10 pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <CardTitle className="text-base font-bold">
                                  Inquiries Acquired via {currentStat.name}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  Customers who selected &quot;{currentStat.name}&quot; when requesting services
                                </CardDescription>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {platformFilteredBookings.length} Leads
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <th className="py-3 px-4">Customer</th>
                                    <th className="py-3 px-4">Service</th>
                                    <th className="py-3 px-4">Appointment</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {paginatedPlatformBookings.map((b: any) => (
                                    <tr key={b.id} className="hover:bg-muted/20">
                                      <td className="py-3 px-4">
                                        <div className="font-bold text-foreground">{b.customerName}</div>
                                        <div className="text-[11px] text-muted-foreground">{b.email} • {b.phone}</div>
                                      </td>
                                      <td className="py-3 px-4 font-semibold">{b.serviceType}</td>
                                      <td className="py-3 px-4 text-muted-foreground">{b.appointmentDate || "Not Set"}</td>
                                      <td className="py-3 px-4">{getStatusBadge(b.status)}</td>
                                      <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          {(!b.status || b.status === 'pending') && (
                                            <Button
                                              size="sm"
                                              className="h-7 text-xs font-bold bg-primary text-white hover:bg-primary/90"
                                              onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                              disabled={updatingId === b.id}
                                            >
                                              Confirm
                                            </Button>
                                          )}
                                          {b.status === 'confirmed' && (
                                            <Button
                                              size="sm"
                                              className="h-7 text-xs font-bold bg-black hover:bg-black/80 text-white"
                                              onClick={() => handleUpdateStatus(b.id, 'completed')}
                                              disabled={updatingId === b.id}
                                            >
                                              Complete
                                            </Button>
                                          )}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            title="Delete Request"
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteBooking(b.id)}
                                            disabled={deletingId === b.id}
                                          >
                                            {deletingId === b.id ? <Loader2 className="h-3 w-3 animate-spin text-destructive" /> : <Trash2 className="h-3.5 w-3.5" />}
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <AdminPagination
                              currentPage={platformPage}
                              totalItems={platformFilteredBookings.length}
                              pageSize={PAGE_SIZE}
                              onPageChange={setPlatformPage}
                              itemLabel="leads"
                            />
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
