'use client';

import React, { createContext, useContext } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { Functions } from 'firebase/functions';
import { FirebaseStorage } from 'firebase/storage';
import { Analytics } from 'firebase/analytics';

interface FirebaseContextProps {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  functions: Functions | null;
  storage: FirebaseStorage | null;
  analytics?: Analytics | null;
}

const FirebaseContext = createContext<FirebaseContextProps>({
  firebaseApp: null,
  firestore: null,
  auth: null,
  functions: null,
  storage: null,
  analytics: null,
});

export const FirebaseProvider: React.FC<{
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  functions: Functions;
  storage: FirebaseStorage;
  analytics?: Analytics | null;
  children: React.ReactNode;
}> = ({ firebaseApp, firestore, auth, functions, storage, analytics, children }) => {
  return (
    <FirebaseContext.Provider value={{ firebaseApp, firestore, auth, functions, storage, analytics }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = () => {
  const context = useContext(FirebaseContext);
  if (!context.firebaseApp) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }
  return context.firebaseApp;
};

export const useFirestore = () => {
  const context = useContext(FirebaseContext);
  return context.firestore;
};

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  return { auth: context.auth };
};

export const useFunctions = () => {
  const context = useContext(FirebaseContext);
  return context.functions;
};

export const useStorage = () => {
  const context = useContext(FirebaseContext);
  return context.storage;
};

export const useAnalytics = () => {
  const context = useContext(FirebaseContext);
  return context.analytics;
};
