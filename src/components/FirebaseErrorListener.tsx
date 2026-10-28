'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();
  const pathname = usePathname();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      // Only surface toast warnings when working inside admin sections
      if (pathname?.startsWith('/admin')) {
        toast({
          title: "Permission Notice",
          description: error.message || "You don't have permission to perform this action.",
        });
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => errorEmitter.off('permission-error', handlePermissionError);
  }, [toast, pathname]);

  return null;
}
