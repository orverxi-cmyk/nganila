'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

export function useUser() {
  const { auth } = useAuth();
  const [user, setUser] = useState<(User & { admin?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const tokenResult = await currentUser.getIdTokenResult();
          const emailLower = currentUser.email?.toLowerCase();
          const isAdmin = tokenResult.claims.admin === true || 
            emailLower === 'tharushyamagara@gmail.com' ||
            emailLower === 'orverxi@gmail.com' ||
            emailLower === 'sanexcompany@gmail.com';
          const augmentedUser = Object.assign(currentUser, { admin: isAdmin });
          setUser(augmentedUser);
        } catch {
          const emailLower = currentUser.email?.toLowerCase();
          const isAdmin = emailLower === 'tharushyamagara@gmail.com' ||
            emailLower === 'orverxi@gmail.com' ||
            emailLower === 'sanexcompany@gmail.com';
          setUser(Object.assign(currentUser, { admin: isAdmin }));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  return { user, loading };
}
