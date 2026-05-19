/**
 * 90Minutes — ToastContext
 * File FIFO de toasts pour les événements match.
 * Expose push(evt) pour ajouter un toast avec un id unique.
 *
 * Requirements: 4.1, 4.2
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type ToastStyle =
  | 'gradient-orange'
  | 'solid-yellow'
  | 'solid-red'
  | 'solid-dark-blue'
  | 'solid-green'
  | 'lateral'
  | 'minimal-bar';

export interface ToastEvent {
  id: string;
  type: string;
  style: ToastStyle;
  durationMs: number;
  title: string;
  narrative?: string;
  emoji?: string;
  score?: string;
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastEvent[];
  push: (evt: Omit<ToastEvent, 'id' | 'createdAt'>) => void;
  dismiss: (id: string) => void;
}

// ─────────────────────────────────────────
// Context
// ─────────────────────────────────────────

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  const push = useCallback((evt: Omit<ToastEvent, 'id' | 'createdAt'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const toast: ToastEvent = {
      ...evt,
      id,
      createdAt: Date.now(),
    };

    setToasts(prev => [...prev, toast]);

    // Auto-dismiss après durationMs
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, evt.durationMs);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast doit être utilisé dans un ToastProvider');
  }
  return context;
}

export default ToastContext;
