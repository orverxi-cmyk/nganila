"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Image as ImageIcon, 
  ClipboardList, 
  LayoutDashboard, 
  TrendingUp, 
  Shield, 
  ChevronRight,
  ExternalLink,
  UserCheck,
  Mail,
  BookUser,
  BookOpen,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  activeTab?: "operations" | "requests" | "platforms";
  onSelectTab?: (tab: "operations" | "requests" | "platforms") => void;
  pendingRequestsCount?: number;
}

export function AdminSidebar({ activeTab, onSelectTab, pendingRequestsCount }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const db = useFirestore();

  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user?.uid]);
  const { data: userProfile } = useDoc(userDocRef);

  // Fallback query for pending bookings count if not passed directly
  const bookingsQuery = React.useMemo(() => {
    if (!db || !user || pendingRequestsCount !== undefined) return null;
    return collection(db, "bookings");
  }, [db, user, pendingRequestsCount]);
  const { data: firestoreBookings } = useCollection(bookingsQuery);

  const pendingCount = React.useMemo(() => {
    if (pendingRequestsCount !== undefined) return pendingRequestsCount;
    return (firestoreBookings || []).filter((b: any) => !b.status || b.status === "pending").length;
  }, [pendingRequestsCount, firestoreBookings]);

  // Determine active item
  const currentTab = searchParams.get("tab");
  const isBrandingActive = pathname.startsWith("/admin/content") && currentTab === "general";
  const isContentActive = pathname.startsWith("/admin/content") && !isBrandingActive;
  const isUsersActive = pathname.startsWith("/admin/users");
  const isBookingsActive = pathname.startsWith("/admin/bookings");
  const isClientsActive = pathname.startsWith("/admin/clients");
  const isContactsActive = pathname.startsWith("/admin/contacts");
  const isEmailsActive = pathname.startsWith("/admin/emails");
  const isPublicationsActive = pathname.startsWith("/admin/publications");
  const isAnalyticsActive = pathname.startsWith("/admin/analytics") || (pathname === "/admin" && (activeTab === "platforms" || currentTab === "platforms"));
  const isRequestsActive = pathname === "/admin" && (activeTab === "requests" || currentTab === "requests");
  const isOperationsActive = pathname === "/admin" && !currentTab && (activeTab === "operations" || !activeTab);

  return (
    <aside className="w-full lg:w-72 bg-white border-r border-border shrink-0 p-4 lg:p-6 flex flex-col justify-between shadow-sm">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase text-[9px] tracking-wider">
              Control Center
            </Badge>
          </div>
          <h2 className="text-xl font-bold font-headline text-foreground">Admin Portal</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Management, operations & analytics</p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {/* 1. Content Management (First) */}
          <Link
            href="/admin/content"
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all text-left",
              isContentActive
                ? "bg-primary text-white shadow-sm"
                : "hover:bg-muted text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <ImageIcon className={cn("h-4 w-4 shrink-0", isContentActive ? "text-white" : "text-muted-foreground")} />
              <div>
                <div className="font-bold">Content Management</div>
                <div className={cn("text-[10px] font-normal", isContentActive ? "text-white/80" : "text-muted-foreground")}>
                  Pages, Media & Articles
                </div>
              </div>
            </div>
            {isContentActive && <ChevronRight className="h-4 w-4 shrink-0 text-white" />}
          </Link>

          {/* Branding & Customization */}
          <Link
            href="/admin/content?tab=general"
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all text-left",
              isBrandingActive
                ? "bg-primary text-white shadow-sm"
                : "hover:bg-muted text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Palette className={cn("h-4 w-4 shrink-0", isBrandingActive ? "text-white" : "text-primary")} />
              <div>
                <div className="font-bold">Branding & Colors</div>
                <div className={cn("text-[10px] font-normal", isBrandingActive ? "text-white/80" : "text-muted-foreground")}>
                  Colors, Logo & Tagline
                </div>
              </div>
            </div>
            {isBrandingActive && <ChevronRight className="h-4 w-4 shrink-0 text-white" />}
          </Link>

          {/* 2. Users (Second) */}
          <Link
            href="/admin/users"
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all text-left",
              isUsersActive
                ? "bg-primary text-white shadow-sm"
                : "hover:bg-muted text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Users className={cn("h-4 w-4 shrink-0", isUsersActive ? "text-white" : "text-muted-foreground")} />
              <div>
                <div className="font-bold">Users</div>
                <div className={cn("text-[10px] font-normal", isUsersActive ? "text-white/80" : "text-muted-foreground")}>
                  Accounts & Access Roles
                </div>
              </div>
            </div>
            {isUsersActive && <ChevronRight className="h-4 w-4 shrink-0 text-white" />}
          </Link>

          {/* 3. Bookings (Third) */}
          <Link
            href="/admin/bookings"
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all text-left",
              isBookingsActive
                ? "bg-primary text-white shadow-sm"
                : "hover:bg-muted text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <ClipboardList className={cn("h-4 w-4 shrink-0", isBookingsActive ? "text-white" : "text-muted-foreground")} />
              <div>
                <div className="font-bold">Bookings</div>
                <div className={cn("text-[10px] font-normal", isBookingsActive ? "text-white/80" : "text-muted-foreground")}>
                  Full Requests Pipeline
                </div>
              </div>
            </div>
            {isBookingsActive && <ChevronRight className="h-4 w-4 shrink-0 text-white" />}
          </Link>

          {/* Client Lifecycle */}
          <Link
            href="/admin/clients"
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all text-left",
              isClientsActive
                ? "bg-primary text-white shadow-sm"
                : "hover:bg-muted text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <UserCheck className={cn("h-4 w-4 shrink-0", isClientsActive ? "text-white" : "text-muted-foreground")} />
              <div>
                <div className="font-bold">Client Lifecycle</div>
                <div className={cn("text-[10px] font-normal", isClientsActive ? "text-white/80" : "text-muted-foreground")}>
                  Leads, Clients &amp; Regulars
                </div>
              </div>
            </div>
            {isClientsActive && <ChevronRight className="h-4 w-4 shrink-0 text-white" />}
          </Link>

          {/* Manage Contacts */}
          <Link
            href="/admin/contacts"
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all text-left",
              isContactsActive
                ? "bg-primary text-white shadow-sm"
                : "hover:bg-muted text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <BookUser className={cn("h-4 w-4 shrink-0", isContactsActive ? "text-white" : "text-muted-foreground")} />
              <div>
                <div className="font-bold">Manage Contacts</div>
                <div className={cn("text-[10px] font-normal", isContactsActive ? "text-white/80" : "text-muted-foreground")}>
                  Groups &amp; Recipients
                </div>
              </div>
            </div>
            {isContactsActive && <ChevronRight className="h-4 w-4 shrink-0 text-white" />}
          </Link>

          {/* Send Email */}
          <Link
            href="/admin/emails"
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all text-left",
              isEmailsActive
                ? "bg-primary text-white shadow-sm"
                : "hover:bg-muted text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Mail className={cn("h-4 w-4 shrink-0", isEmailsActive ? "text-white" : "text-muted-foreground")} />
              <div>
                <div className="font-bold">Send Email</div>
                <div className={cn("text-[10px] font-normal", isEmailsActive ? "text-white/80" : "text-muted-foreground")}>
                  Broadcasts &amp; Outbound
                </div>
              </div>
            </div>
            {isEmailsActive && <ChevronRight className="h-4 w-4 shrink-0 text-white" />}
          </Link>

          {/* Publications & Newsletters */}
          <Link
            href="/admin/publications"
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all text-left",
              isPublicationsActive
                ? "bg-primary text-white shadow-sm"
                : "hover:bg-muted text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <BookOpen className={cn("h-4 w-4 shrink-0", isPublicationsActive ? "text-white" : "text-muted-foreground")} />
              <div>
                <div className="font-bold">Publications</div>
                <div className={cn("text-[10px] font-normal", isPublicationsActive ? "text-white/80" : "text-muted-foreground")}>
                  Newsletters &amp; Special Links
                </div>
              </div>
            </div>
            {isPublicationsActive && <ChevronRight className="h-4 w-4 shrink-0 text-white" />}
          </Link>

          {/* Divider between primary modules and operational tabs */}
          <div className="pt-2 pb-1">
            <div className="border-t border-border" />
          </div>

          {/* 4. Operation Center */}
          {pathname === "/admin" && onSelectTab ? (
            <button
              type="button"
              onClick={() => onSelectTab("operations")}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all text-left",
                isOperationsActive
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={cn("h-4 w-4 shrink-0", isOperationsActive ? "text-white" : "text-muted-foreground")} />
                <div>
                  <div className="font-bold">Operation Center</div>
                  <div className={cn("text-[10px] font-normal", isOperationsActive ? "text-white/80" : "text-muted-foreground")}>
                    System Overview & Hub
                  </div>
                </div>
              </div>
              {isOperationsActive && <ChevronRight className="h-4 w-4 shrink-0 text-white" />}
            </button>
          ) : (
            <Link
              href="/admin?tab=operations"
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all text-left",
                isOperationsActive
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={cn("h-4 w-4 shrink-0", isOperationsActive ? "text-white" : "text-muted-foreground")} />
                <div>
                  <div className="font-bold">Operation Center</div>
                  <div className={cn("text-[10px] font-normal", isOperationsActive ? "text-white/80" : "text-muted-foreground")}>
                    System Overview & Hub
                  </div>
                </div>
              </div>
              {isOperationsActive && <ChevronRight className="h-4 w-4 shrink-0 text-white" />}
            </Link>
          )}

          {/* 5. Requests */}
          {pathname === "/admin" && onSelectTab ? (
            <button
              type="button"
              onClick={() => onSelectTab("requests")}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all text-left",
                isRequestsActive
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <ClipboardList className={cn("h-4 w-4 shrink-0", isRequestsActive ? "text-white" : "text-muted-foreground")} />
                <div>
                  <div className="font-bold">Requests</div>
                  <div className={cn("text-[10px] font-normal", isRequestsActive ? "text-white/80" : "text-muted-foreground")}>
                    Service Status Filter
                  </div>
                </div>
              </div>
              {pendingCount > 0 ? (
                <Badge className={cn("text-[10px] font-bold px-2 py-0.5", isRequestsActive ? "bg-white text-[#006400]" : "bg-primary text-white border-primary")}>
                  {pendingCount} new
                </Badge>
              ) : isRequestsActive ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-white" />
              ) : null}
            </button>
          ) : (
            <Link
              href="/admin?tab=requests"
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all text-left",
                isRequestsActive
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <ClipboardList className={cn("h-4 w-4 shrink-0", isRequestsActive ? "text-white" : "text-muted-foreground")} />
                <div>
                  <div className="font-bold">Requests</div>
                  <div className={cn("text-[10px] font-normal", isRequestsActive ? "text-white/80" : "text-muted-foreground")}>
                    Service Status Filter
                  </div>
                </div>
              </div>
              {pendingCount > 0 ? (
                <Badge className={cn("text-[10px] font-bold px-2 py-0.5", isRequestsActive ? "bg-white text-[#006400]" : "bg-primary text-white border-primary")}>
                  {pendingCount} new
                </Badge>
              ) : isRequestsActive ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-white" />
              ) : null}
            </Link>
          )}

          {/* 6. Platform Performance */}
          {pathname === "/admin" && onSelectTab ? (
            <button
              type="button"
              onClick={() => onSelectTab("platforms")}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all text-left",
                isAnalyticsActive
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className={cn("h-4 w-4 shrink-0", isAnalyticsActive ? "text-white" : "text-muted-foreground")} />
                <div>
                  <div className="font-bold">Platform Performance</div>
                  <div className={cn("text-[10px] font-normal", isAnalyticsActive ? "text-white/80" : "text-muted-foreground")}>
                    Channels & Attribution
                  </div>
                </div>
              </div>
              {isAnalyticsActive && <ChevronRight className="h-4 w-4 shrink-0 text-white" />}
            </button>
          ) : (
            <Link
              href="/admin?tab=platforms"
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all text-left",
                isAnalyticsActive
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className={cn("h-4 w-4 shrink-0", isAnalyticsActive ? "text-white" : "text-muted-foreground")} />
                <div>
                  <div className="font-bold">Platform Performance</div>
                  <div className={cn("text-[10px] font-normal", isAnalyticsActive ? "text-white/80" : "text-muted-foreground")}>
                    Channels & Attribution
                  </div>
                </div>
              </div>
              {isAnalyticsActive && <ChevronRight className="h-4 w-4 shrink-0 text-white" />}
            </Link>
          )}

          {/* 7. Public Portal */}
          <div className="pt-2 pb-1">
            <div className="border-t border-border" />
          </div>
          <Link
            href="/"
            className="w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <div className="font-bold">Public Portal</div>
                <div className="text-[10px] font-normal text-muted-foreground">
                  View Live Website
                </div>
              </div>
            </div>
          </Link>
        </nav>
      </div>

      {/* Operator Auth Status at bottom of sidebar */}
      <div className="pt-4 border-t mt-6">
        <div className="bg-muted/50 p-3 rounded-xl flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-bold">
            <Shield className="h-4 w-4" />
          </div>
          <div className="overflow-hidden">
            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Authorized Operator</div>
            <div className="text-xs font-bold truncate text-foreground">{userProfile?.displayName || user?.email || "Admin"}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
