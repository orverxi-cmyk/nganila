'use client';

import React, { useEffect, useState } from 'react';
import { initializeFirebase } from './init';
import { FirebaseProvider } from './provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<ReturnType<typeof initializeFirebase> | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return initializeFirebase();
      } catch (e) {
        console.error('Firebase init error:', e);
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (!services) {
      try {
        setServices(initializeFirebase());
      } catch (e) {
        console.error('Firebase init error:', e);
      }
    }
  }, [services]);

  if (!services) {
    // Render children directly during SSR so the page renders immediately
    return <>{children}</>;
  }

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      firestore={services.firestore}
      auth={services.auth}
      functions={services.functions}
      storage={services.storage}
      analytics={services.analytics}
    >
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
};
