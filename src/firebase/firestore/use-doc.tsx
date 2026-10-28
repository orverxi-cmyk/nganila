'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentReference, 
  onSnapshot, 
  DocumentSnapshot, 
  DocumentData
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T = DocumentData>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(docRef));
  const [error, setError] = useState<Error | null>(null);

  const docPath = docRef?.path;

  useEffect(() => {
    if (!docRef) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() ? { ...snapshot.data()!, id: snapshot.id } : null);
        setLoading(false);
        setError(null);
      },
      (serverError) => {
        const isPublicDoc =
          docPath?.startsWith('settings') ||
          docPath?.startsWith('articles') ||
          docPath?.startsWith('publications') ||
          docPath?.startsWith('gallery');

        if (!isPublicDoc) {
          console.warn(`Firestore doc error [${docPath}]:`, serverError);
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        setError(serverError);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [docPath]);

  return { data, loading, error };
}

