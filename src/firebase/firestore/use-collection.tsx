'use client';

import { useState, useEffect } from 'react';
import { 
  Query, 
  onSnapshot, 
  QuerySnapshot, 
  DocumentData
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(Boolean(query));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setData(items);
        setLoading(false);
        setError(null);
      },
      (serverError) => {
        const queryPath = (query as any)?._query?.path?.canonicalString?.() ||
                          (query as any)?._query?.path?.toString() ||
                          (query as any)?.path ||
                          'unknown';
        // Suppress warning and global popup toast for public content (publications, articles, gallery) which have API/static fallbacks
        const isPublicContent =
          queryPath.includes('publications') ||
          queryPath.includes('articles') ||
          queryPath.includes('gallery');

        if (!isPublicContent) {
          console.warn(`Firestore collection error [${queryPath}]:`, serverError);
          const permissionError = new FirestorePermissionError({
            path: queryPath,
            operation: 'list',
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
  }, [query]);

  return { data, loading, error };
}

