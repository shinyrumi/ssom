'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastState = {
  id: number;
  message: string;
  variant: ToastVariant;
} | null;

export function useToast(timeoutMs = 2800) {
  const [toast, setToast] = useState<ToastState>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    const id = Date.now();
    setToast({ id, message, variant });
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setToast((prev) => (prev && prev.id === id ? null : prev));
    }, timeoutMs);
  }, [timeoutMs]);

  return { toast, showToast };
}
