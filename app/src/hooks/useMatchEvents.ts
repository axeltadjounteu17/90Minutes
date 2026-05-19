/**
 * 90Minutes — useMatchEvents
 * Hook qui écoute les événements MATCH_EVENT du WebSocket
 * et les pousse dans le ToastContext.
 *
 * Requirements: 4.2
 */

import { useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { mapEventToToast } from '../utils/mapEventToToast';

interface MatchEventMessage {
  type: string;
  event?: {
    type: string;
    narrative?: string;
    score?: string;
    emoji?: string;
    message?: string;
    title?: string;
    matchMinute?: number;
  };
}

/**
 * S'abonne au lastEvent du WebSocket et pousse les MATCH_EVENT dans le ToastContext.
 */
export function useMatchEvents(lastEvent: unknown) {
  const { push } = useToast();
  const prevEventRef = useRef<unknown>(null);

  useEffect(() => {
    if (!lastEvent || lastEvent === prevEventRef.current) return;
    prevEventRef.current = lastEvent;

    const msg = lastEvent as MatchEventMessage;
    if (msg.type === 'MATCH_EVENT' && msg.event) {
      const toastInput = mapEventToToast(msg.event);
      push(toastInput);
    }
  }, [lastEvent, push]);
}
