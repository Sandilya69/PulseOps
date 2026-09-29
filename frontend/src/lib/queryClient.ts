import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      refetchOnMount: 'always',
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

export const queryKeys = {
  apis: (orgId: string, params?: Record<string, unknown>) => 
    ['apis', orgId, params] as const,
  apisDetail: (orgId: string, id: string) => 
    ['apis', orgId, 'detail', id] as const,
  apisChecks: (orgId: string, apiId: string, params?: Record<string, unknown>) => 
    ['apis', orgId, apiId, 'checks', params] as const,
  incidents: (orgId: string, params?: Record<string, unknown>) => 
    ['incidents', orgId, params] as const,
  incidentDetail: (orgId: string, id: string) => 
    ['incidents', orgId, 'detail', id] as const,
  alerts: {
    rules: (orgId: string, params?: Record<string, unknown>) => 
      ['alerts', 'rules', orgId, params] as const,
    history: (orgId: string, params?: Record<string, unknown>) => 
      ['alerts', 'history', orgId, params] as const,
    oncall: (orgId: string, params?: Record<string, unknown>) => 
      ['alerts', 'oncall', orgId, params] as const,
  },
  team: (orgId: string, params?: Record<string, unknown>) => 
    ['team', orgId, params] as const,
  invitations: (orgId: string) => 
    ['invitations', orgId] as const,
  tickets: (orgId: string, params?: Record<string, unknown>) => 
    ['tickets', orgId, params] as const,
  ticketDetail: (orgId: string, id: string) => 
    ['tickets', orgId, 'detail', id] as const,
  knowledgeBase: (orgId: string, params?: Record<string, unknown>) => 
    ['kb', orgId, params] as const,
  statusPages: (orgId: string) => 
    ['statuspages', orgId] as const,
  slo: (orgId: string, params?: Record<string, unknown>) => 
    ['slo', orgId, params] as const,
  activity: (orgId: string, params?: Record<string, unknown>) => 
    ['activity', orgId, params] as const,
  notifications: (params?: Record<string, unknown>) => 
    ['notifications', params] as const,
  profile: () => 
    ['profile'] as const,
  organization: (orgId: string) => 
    ['organization', orgId] as const,
} as const;

export function invalidateQueries(client: QueryClient, keys: string[]) {
  keys.forEach(key => {
    client.invalidateQueries({ queryKey: [key] });
  });
}

export function prefetchQuery(client: QueryClient, key: readonly unknown[], queryFn: () => Promise<unknown>) {
  client.prefetchQuery({
    queryKey: key,
    queryFn,
    staleTime: 30_000,
  });
}