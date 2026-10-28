import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getFunctions, Functions } from 'firebase/functions';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { firebaseConfig } from './config';

export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  functions: Functions;
  storage: FirebaseStorage;
  analytics: Analytics | null;
} {
  // Ensure Firebase is initialized only once
  const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  // Explicitly set the region to match the deployed cloud functions
  const functions = getFunctions(firebaseApp, 'us-central1');
  const storage = getStorage(firebaseApp);

  let analytics: Analytics | null = null;
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(firebaseApp);
      }
    }).catch(() => {
      // Analytics might not be supported in certain environments
    });
  }

  return { firebaseApp, firestore, auth, functions, storage, analytics };
}
