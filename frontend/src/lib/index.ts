export { queryClient, queryKeys, invalidateQueries, prefetchQuery } from './queryClient';
export { getRealtimeClient, destroyRealtimeClient } from './realtime';
export { 
  CircuitBreaker, 
  getCircuitBreaker, 
  withCircuitBreaker, 
  createRetryPolicy,
  defaultRetryPolicy,
  RateLimiter,
  apiRateLimiter,
  mutationRateLimiter,
  createDebouncedFunction,
  createThrottledFunction,
} from './circuitBreaker';
export { 
  lttb, 
  lttbWithTimestamp, 
  downsample, 
  minMaxDownsample, 
  averageDownsample, 
  adaptiveDownsample, 
  timeBucketDownsample, 
  smartDownsample 
} from './downsample';
export type { DataPoint } from './downsample';