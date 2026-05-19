/**
 * 90Minutes — RoomContext
 * Partage l'état de la room active (roomId, joinCode) entre les onglets
 * Home, Match, Leaderboard. Persiste en mémoire uniquement (pas AsyncStorage)
 * pour qu'une nouvelle session repart de zéro.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ActiveRoom {
  roomId: string;
  joinCode?: string;
}

interface RoomContextType {
  activeRoom: ActiveRoom | null;
  setActiveRoom: (room: ActiveRoom | null) => void;
  clearRoom: () => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [activeRoom, setActiveRoomState] = useState<ActiveRoom | null>(null);

  const setActiveRoom = useCallback((room: ActiveRoom | null) => {
    setActiveRoomState(room);
  }, []);

  const clearRoom = useCallback(() => {
    setActiveRoomState(null);
  }, []);

  return (
    <RoomContext.Provider value={{ activeRoom, setActiveRoom, clearRoom }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom(): RoomContextType {
  const ctx = useContext(RoomContext);
  if (!ctx) {
    throw new Error('useRoom doit être utilisé dans un RoomProvider');
  }
  return ctx;
}

export default RoomContext;
