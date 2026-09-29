"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getRealtimeClient, destroyRealtimeClient, ConnectionState, RealtimeEvent, EventType } from '@/lib/realtime';

interface RealtimeContextValue {
  state: ConnectionState;
  subscribe: <T>(type: EventType, handler: (event: RealtimeEvent<T>) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { organization, tokens } = useAuthStore();
  const [state, setState] = useState<ConnectionState>({
    status: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0,
  });

  useEffect(() => {
    if (!organization?.id || !tokens?.accessToken) {
      destroyRealtimeClient();
      return;
    }

    const client = getRealtimeClient(organization.id, tokens.accessToken);
    
    const unsubscribe = client.onStateChange(setState);
    client.connect().catch(console.error);

    return () => {
      unsubscribe();
    };
  }, [organization?.id, tokens?.accessToken]);

  function subscribe<T>(type: EventType, handler: (event: RealtimeEvent<T>) => void): () => void {
    const client = getRealtimeClient(organization!.id, tokens!.accessToken);
    return client.subscribe(type, handler);
  }

  return (
    <RealtimeContext.Provider value={{ state, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}

export function useRealtimeState() {
  return useRealtime().state;
}

export function useRealtimeSubscription<T>(type: EventType, handler: (event: RealtimeEvent<T>) => void) {
  const { subscribe } = useRealtime();
  useEffect(() => subscribe(type, handler), [subscribe, type, handler]);
}