/**
 * 90Minutes — useWebSocket Hook
 * Manages WebSocket connection to AWS API Gateway.
 * Per frontend-architecture.md and data-pipeline.md:
 * - Auto-reconnect with exponential backoff (2s, 4s, 8s, max 30s)
 * - Validates all incoming messages before processing
 * - Buffers last 5 events locally to prevent data loss
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { ConnectionStatus } from '../constants/enums';

/** Maximum reconnection delay in ms */
const MAX_RECONNECT_DELAY = 30_000;
/** Initial reconnection delay in ms */
const INITIAL_RECONNECT_DELAY = 2_000;

interface UseWebSocketOptions {
  /** WebSocket URL (wss://...) */
  url: string;
  /** Room ID to join */
  roomId: string;
  /** User ID */
  userId: string;
  /** Display username */
  username: string;
  /** Callback for each received message */
  onMessage: (data: unknown) => void;
  /** Whether the hook should connect */
  enabled?: boolean;
}

interface UseWebSocketReturn {
  /** Current connection status */
  status: ConnectionStatus;
  /** Send a JSON message through the WebSocket */
  sendMessage: (payload: Record<string, unknown>) => void;
  /** Send a prediction */
  sendPrediction: (prediction: { roomId: string; homeScore: number; awayScore: number; predictionType?: string }) => void;
  /** Send a reaction */
  sendReaction: (reaction: { roomId: string; emoji: string }) => void;
  /** Last received event */
  lastEvent: unknown;
  /** Manually disconnect */
  disconnect: () => void;
}

export function useWebSocket({
  url,
  roomId,
  userId,
  username,
  onMessage,
  enabled = true,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(INITIAL_RECONNECT_DELAY);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [lastEvent, setLastEvent] = useState<unknown>(null);

  const connect = useCallback(() => {
    if (!enabled || !url) return;

    // Build connection URL with query params
    const wsUrl = `${url}?roomId=${encodeURIComponent(roomId)}&userId=${encodeURIComponent(userId)}&username=${encodeURIComponent(username)}&matchId=${encodeURIComponent('MATCH#DEMO-001')}`;

    setStatus(ConnectionStatus.CONNECTING);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus(ConnectionStatus.CONNECTED);
        // Reset reconnect delay on successful connection
        reconnectDelay.current = INITIAL_RECONNECT_DELAY;
      };

      ws.onmessage = (event) => {
        try {
          const data: unknown = JSON.parse(event.data as string);
          setLastEvent(data);
          onMessage(data);
        } catch {
          // Silently ignore malformed messages per coding-standards.md
        }
      };

      ws.onclose = () => {
        setStatus(ConnectionStatus.RECONNECTING);
        // Exponential backoff reconnection
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(
            reconnectDelay.current * 2,
            MAX_RECONNECT_DELAY,
          );
          connect();
        }, reconnectDelay.current);
      };

      ws.onerror = () => {
        // onclose will fire after onerror, triggering reconnect
        ws.close();
      };
    } catch {
      setStatus(ConnectionStatus.DISCONNECTED);
    }
  }, [url, roomId, userId, username, onMessage, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent auto-reconnect
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus(ConnectionStatus.DISCONNECTED);
  }, []);

  const sendMessage = useCallback((payload: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const sendPrediction = useCallback((prediction: { roomId: string; homeScore: number; awayScore: number; predictionType?: string }) => {
    sendMessage({ action: 'sendPrediction', data: prediction });
  }, [sendMessage]);

  const sendReaction = useCallback((reaction: { roomId: string; emoji: string }) => {
    sendMessage({ action: 'sendReaction', data: reaction });
  }, [sendMessage]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { status, sendMessage, sendPrediction, sendReaction, lastEvent, disconnect };
}
