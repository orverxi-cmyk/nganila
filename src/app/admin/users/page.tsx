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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { 
  Users, 
  ChevronLeft, 
  UserCheck, 
  UserX, 
  Loader2, 
  ShieldAlert,
  Search,
  Mail,
  Calendar,
  UserPlus,
  RefreshCw,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminPagination } from "@/components/admin/AdminPagination";

export default function UserManagementPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const functions = useFunctions();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  const [newUser, setNewUser] = React.useState({
    email: "",
    displayName: "",
    password: "",
    isAdmin: false
  });

  const [backupUsers, setBackupUsers] = React.useState<any[] | null>(null);
  const [isFetchingBackup, setIsFetchingBackup] = React.useState(false);

  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile, loading: profileLoading } = useDoc(userDocRef);

  const isAuthorized = 
    userProfile?.role === "admin" || 
    (user as any)?.admin === true || 
    user?.email?.toLowerCase() === "tharushyamagara@gmail.com" ||
    user?.email?.toLowerCase() === "orverxi@gmail.com" ||
    user?.email?.toLowerCase() === "sanexcompany@gmail.com";

  // Only query Firestore once user authorization is confirmed
  const usersQuery = React.useMemo(() => {
    if (!db || !user || !isAuthorized) return null;
    return collection(db, "users");
  }, [db, user, isAuthorized]);

  const { data: firestoreUsers, loading: firestoreLoading, error: firestoreError } = useCollection(usersQuery);

  const fetchUsersViaFunction = React.useCallback(async () => {
    if (!functions) return;
    setIsFetchingBackup(true);
    try {
      const getUsersFunc = httpsCallable(functions, 'adminGetUsers');
      const result: any = await getUsersFunc();
      if (Array.isArray(result.data)) {
        setBackupUsers(result.data);
      }
    } catch (err: any) {
      console.warn("Could not fetch users via callable function:", err.message);
    } finally {
      setIsFetchingBackup(false);
    }
  }, [functions]);

  // If firestore returns an error or empty while authorized, try callable function
  React.useEffect(() => {
    if (user && isAuthorized && (firestoreError || (!firestoreLoading && (!firestoreUsers || firestoreUsers.length === 0)))) {
      fetchUsersViaFunction();
    }
  }, [user, isAuthorized, firestoreError, firestoreLoading, firestoreUsers, fetchUsersViaFunction]);

  const allUsers = (firestoreUsers && firestoreUsers.length > 0)
    ? firestoreUsers
    : (backupUsers || firestoreUsers || []);

  const usersLoading = (firestoreLoading && !backupUsers) || (isFetchingBackup && allUsers.length === 0);

  const filteredUsers = React.useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(u => 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);

  const [currentPage, setCurrentPage] = React.useState(1);
  const PAGE_SIZE = 10;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUser(prev => ({ ...prev, password }));
  };

  const handleToggleRole = async (targetUser: any) => {
    setUpdatingId(targetUser.id);
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    try {
      if (functions) {
        try {
          const updateRoleFunc = httpsCallable(functions, 'adminUpdateUserRole');
          await updateRoleFunc({ targetUserId: targetUser.id, newRole });
        } catch (funcErr: any) {
          console.warn("Function update failed, attempting direct Firestore update:", funcErr);
          if (db) {
            await updateDoc(doc(db, "users", targetUser.id), { role: newRole });
          } else {
            throw funcErr;
          }
        }
      } else if (db) {
        await updateDoc(doc(db, "users", targetUser.id), { role: newRole });
      }
      
      if (backupUsers) {
        setBackupUsers(prev => prev ? prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u) : null);
      }
      toast({ title: "Updated", description: `Role for ${targetUser.displayName} changed to ${newRole}.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Failed", description: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (targetUser: any) => {
    const targetName = targetUser.displayName || targetUser.email || "this operator";
    if (!window.confirm(`Are you sure you want to permanently remove ${targetName}? This will revoke their system access and delete their account completely.`)) {
      return;
    }

    setDeletingId(targetUser.id);
    try {
      if (functions) {
        try {
          const deleteUserFunc = httpsCallable(functions, 'adminDeleteUser');
          await deleteUserFunc({ targetUserId: targetUser.id });
        } catch (funcErr: any) {
          console.warn("adminDeleteUser function failed, attempting direct Firestore delete:", funcErr);
          if (db) {
            await deleteDoc(doc(db, "users", targetUser.id));
          } else {
            throw funcErr;
          }
        }
      } else if (db) {
        await deleteDoc(doc(db, "users", targetUser.id));
      }

      if (backupUsers) {
        setBackupUsers(prev => prev ? prev.filter(u => u.id !== targetUser.id) : null);
      }

      toast({ 
        title: "User Removed", 
        description: `Account for ${targetName} has been permanently deleted.` 
      });
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Removal Failed", 
        description: err.message || "Failed to remove user." 
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!functions) return;

    if (!newUser.password || newUser.password.length < 6) {
      toast({ variant: "destructive", title: "Weak Password", description: "Password must be at least 6 characters." });
      return;
    }
    
    setIsAdding(true);
    try {
      const addFunc = httpsCallable(functions, 'adminCreateUser');
      const res: any = await addFunc({
        email: newUser.email,
        displayName: newUser.displayName,
        password: newUser.password,
        role: newUser.isAdmin ? 'admin' : 'user'
      });
      
      const createdUser = res?.data || {
        email: newUser.email,
        displayName: newUser.displayName || newUser.email.split('@')[0],
        role: newUser.isAdmin ? 'admin' : 'user',
        createdAt: Date.now()
      };

      if (backupUsers) {
        setBackupUsers(prev => prev ? [...prev, { id: createdUser.uid || Date.now().toString(), ...createdUser }] : null);
      }

      toast({ title: "User Created", description: `Account for ${newUser.displayName || newUser.email} has been provisioned.` });
      setIsDialogOpen(false);
      setNewUser({ email: "", displayName: "", password: "", isAdmin: false });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Creation Failed", description: err.message });
    } finally {
      setIsAdding(false);
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
      <div className="min-h-screen flex flex-col font-arial">
        <Navbar isAdmin />
        <main className="flex-grow flex items-center justify-center px-4">
          <Card className="w-full max-w-md text-center py-5 border-t-4 border-t-[#8DB833]">
            <ShieldAlert className="mx-auto h-12 w-12 text-[#8DB833] mb-4" />
            <CardTitle>Unauthorized Access</CardTitle>
            <p className="mt-2 text-muted-foreground text-[14px]">You do not have permission to view this directory.</p>
            <div className="pt-6 flex flex-wrap gap-x-[5px] gap-y-[20px] w-full justify-center">
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

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar isAdmin />
      <div className="flex-grow flex flex-col lg:flex-row">
        <AdminSidebar />
        <main className="flex-grow p-4 md:p-8 space-y-6 overflow-x-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
            <div>
              <Button asChild variant="ghost" className="mb-2 -ml-2 text-[10px] font-bold uppercase tracking-widest">
                <Link href="/admin"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
              </Button>
              <h1 className="text-2xl font-bold font-headline flex items-center gap-3 text-black">
                <Users className="h-7 w-7 text-primary" /> Users
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Manage operator accounts and directory access permissions.</p>
            </div>
            
            <div className="flex flex-wrap gap-x-[10px] gap-y-[10px] w-full md:w-auto items-center">
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-[10px] font-bold uppercase tracking-widest gap-2"
                onClick={() => fetchUsersViaFunction()}
                disabled={isFetchingBackup}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isFetchingBackup && "animate-spin")} />
                Refresh
              </Button>

              <div className="relative flex-grow md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-10 h-10 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-10 text-[10px] font-bold uppercase tracking-widest gap-2 bg-primary text-white hover:bg-primary/90 rounded-full px-6">
                    <UserPlus className="h-4 w-4" /> Add New User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={handleAddUser}>
                    <DialogHeader>
                      <DialogTitle className="text-[16px] font-bold">Provision New Account</DialogTitle>
                      <DialogDescription className="text-[14px] font-normal">
                        Create a unique access key and profile for an operator.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-1">
                        <Label htmlFor="email" className="text-[10px] font-bold uppercase text-muted-foreground">Work Email Address *</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          required 
                          className="h-10 text-sm"
                          value={newUser.email}
                          onChange={e => setNewUser({...newUser, email: e.target.value})}
                          placeholder="operator@sanex.rw"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dname" className="text-[10px] font-bold uppercase text-muted-foreground">Display Name</Label>
                        <Input 
                          id="dname" 
                          className="h-10 text-sm"
                          value={newUser.displayName}
                          onChange={e => setNewUser({...newUser, displayName: e.target.value})}
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="pass" className="text-[10px] font-bold uppercase text-muted-foreground">Access Key / Password *</Label>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            className="h-6 text-[8px] font-bold uppercase tracking-widest gap-1 p-0 hover:bg-transparent text-primary"
                            onClick={generatePassword}
                          >
                            <RefreshCw className="h-2 w-2" /> Generate Secure
                          </Button>
                        </div>
                        <Input 
                          id="pass" 
                          required 
                          className="h-10 text-sm font-mono"
                          value={newUser.password}
                          onChange={e => setNewUser({...newUser, password: e.target.value})}
                          placeholder="At least 6 characters"
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                          id="admin-role" 
                          checked={newUser.isAdmin}
                          onCheckedChange={(checked) => setNewUser({...newUser, isAdmin: !!checked})}
                        />
                        <Label htmlFor="admin-role" className="text-[14px] font-bold cursor-pointer">
                          Grant Full Administrative Rights
                        </Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <div className="flex flex-wrap gap-x-[5px] gap-y-[20px] w-full pt-2">
                        <Button type="submit" className="flex-grow h-12 text-[12px] font-bold uppercase tracking-widest bg-primary text-white hover:bg-primary/90 rounded-full" disabled={isAdding}>
                          {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                          Create Account
                        </Button>
                      </div>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card className="shadow-sm border-none overflow-hidden bg-white">
            <CardHeader className="border-b bg-muted/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-black uppercase tracking-widest">Operator Management</CardTitle>
                <CardDescription className="text-[12px] font-normal">Manage secure access keys and system roles via Cloud Functions.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs px-3 py-1">
                {allUsers.length} Operators
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30 text-muted-foreground font-bold border-b text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 text-left">Profile</th>
                      <th className="px-6 py-4 text-left">Level</th>
                      <th className="px-6 py-4 text-left">Last Session</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                          <p className="mt-2 text-muted-foreground text-[14px]">Syncing directory...</p>
                        </td>
                      </tr>
                    ) : filteredUsers.length > 0 ? (
                      paginatedUsers.map((u) => {
                        const isMaster = Boolean(
                          u.isMaster || 
                          (u.email && ["tharushyamagara@gmail.com", "orverxi@gmail.com", "sanexcompany@gmail.com"].includes(u.email.toLowerCase()))
                        );
                        return (
                        <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {u.displayName?.charAt(0) || <Users className="h-4 w-4" />}
                              </div>
                              <div>
                                <div className="font-bold text-black flex items-center gap-2">
                                  {u.displayName}
                                  {isMaster && <Badge className="bg-primary text-white text-[8px] font-bold uppercase tracking-widest px-1.5 h-4">Master</Badge>}
                                </div>
                                <div className="text-[12px] text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" /> {u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={u.role === "admin" ? "default" : "outline"} className={u.role === "admin" ? "bg-primary text-white font-bold text-[8px] tracking-widest uppercase" : "text-[8px] tracking-widest uppercase"}>
                              {u.role || "USER"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-[12px] text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> 
                              {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isMaster ? (
                              <span className="text-[10px] text-muted-foreground italic font-medium">Root Access</span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 text-[10px] font-bold uppercase tracking-wider gap-2"
                                  disabled={updatingId === u.id || deletingId === u.id || u.id === user.uid}
                                  onClick={() => handleToggleRole(u)}
                                >
                                  {updatingId === u.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : u.role === "admin" ? (
                                    <>
                                      <UserX className="h-3 w-3 text-destructive" /> Demote to User
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-3 w-3 text-primary" /> Promote to Admin
                                    </>
                                  )}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-[10px] font-bold uppercase tracking-wider gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                                  disabled={deletingId === u.id || updatingId === u.id || u.id === user.uid}
                                  onClick={() => handleDeleteUser(u)}
                                  title="Permanently remove user"
                                >
                                  {deletingId === u.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                  <span className="hidden sm:inline">Delete</span>
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-muted-foreground">
                          <p>No operators matching your criteria.</p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="mt-2 text-xs text-primary font-bold"
                            onClick={() => fetchUsersViaFunction()}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" /> Retry sync with Cloud Functions
                          </Button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <AdminPagination
                currentPage={currentPage}
                totalItems={filteredUsers.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                itemLabel="users"
              />
            </CardContent>
          </Card>
        </main>
      </div>
      <Footer />
    </div>
  );
}
