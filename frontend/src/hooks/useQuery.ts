import { 
  useQuery, 
  useMutation, 
  useInfiniteQuery,
  useQueryClient,
  QueryKey,
  MutateOptions 
} from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { queryKeys, queryClient } from '@/lib/queryClient';

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
  };
}

export function usePaginatedQuery<T>(
  key: QueryKey,
  fetchFn: (params: { page: number; limit: number; cursor?: string }) => Promise<PaginatedResponse<T>>,
  params: { page: number; limit: number; cursor?: string } = { page: 1, limit: 20 }
) {
  return useQuery({
    queryKey: [...key, params],
    queryFn: () => fetchFn(params),
    placeholderData: (prev) => prev,
  });
}

export function useInfinitePaginatedQuery<T>(
  key: QueryKey,
  fetchFn: (params: { limit: number; cursor?: string }) => Promise<PaginatedResponse<T>>,
  limit = 20
) {
  return useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => fetchFn({ limit, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
    initialPageParam: undefined as string | undefined,
  });
}

export function useOptimisticMutation<TData, TVariables, TContext>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onMutate?: (variables: TVariables) => Promise<TContext | undefined>;
    onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
    onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables, context: TContext | undefined) => void;
    invalidateKeys?: QueryKey[];
  } = {}
) {
  const client = useQueryClient();
  
  return useMutation({
    mutationFn,
    async onMutate(variables) {
      if (options.onMutate) {
        return options.onMutate(variables);
      }
    },
    onError: (error, variables, context) => {
      if (options.onError) {
        options.onError(error, variables, context);
      }
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => client.invalidateQueries({ queryKey: key }));
      }
    },
    onSuccess: (data, variables, context) => {
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => client.invalidateQueries({ queryKey: key }));
      }
    },
    onSettled: (data, error, variables, context) => {
      if (options.onSettled) {
        options.onSettled(data, error, variables, context);
      }
    },
  });
}

export function useApiQuery<T>(
  key: QueryKey,
  url: string,
  params?: Record<string, unknown>,
  options?: { enabled?: boolean; staleTime?: number }
) {
  return useQuery({
    queryKey: [...key, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams(params as Record<string, string>);
      const response = await api.get<T>(`${url}?${searchParams}`);
      return response.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 30_000,
  });
}

export function useApiMutation<TData, TVariables>(
  url: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options?: {
    invalidateKeys?: QueryKey[];
    onSuccess?: (data: TData, variables: TVariables) => void;
  }
) {
  const client = useQueryClient();
  
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await api[method]<TData>(url, variables);
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (options?.onSuccess) {
        options.onSuccess(data, variables);
      }
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach(key => client.invalidateQueries({ queryKey: key }));
      }
    },
  });
}

export function usePrefetchQuery<T>(
  key: QueryKey,
  queryFn: () => Promise<T>
) {
  const client = useQueryClient();
  
  return () => client.prefetchQuery({
    queryKey: key,
    queryFn,
    staleTime: 30_000,
  });
}

export function useInvalidateQueries(keys: QueryKey[]) {
  const client = useQueryClient();
  return () => keys.forEach(key => client.invalidateQueries({ queryKey: key }));
}

export function useSetQueryData<T>(key: QueryKey, updater: (old: T | undefined) => T) {
  const client = useQueryClient();
  return () => client.setQueryData<T>(key, updater);
}

export function useGetQueryData<T>(key: QueryKey) {
  const client = useQueryClient();
  return client.getQueryData<T>(key);
}