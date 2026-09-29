// ============================================
// PulseOps CRM - Redis Deduplication Service
// ============================================

import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis client for deduplication
 */
export async function initRedisDedup(): Promise<RedisClientType> {
  if (redisClient?.isOpen) return redisClient;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = createClient({ url: redisUrl });
  
  redisClient.on('error', (err) => {
    console.error('❌ Redis dedup client error:', err);
  });

  await redisClient.connect();
  console.log('✅ Redis deduplication client connected');
  
  return redisClient;
}

/**
 * Check if alert fingerprint exists and set with TTL
 * Returns true if NEW (not a duplicate), false if DUPLICATE
 */
export async function checkAndSetDedup(
  fingerprint: string,
  ttlSeconds: number = 300
): Promise<boolean> {
  if (!redisClient?.isOpen) {
    await initRedisDedup();
  }

  const key = `alert:dedup:${fingerprint}`;
  
  // SET NX EX - only set if not exists, with TTL
  const result = await redisClient!.set(key, '1', {
    NX: true,     // Only set if not exists
    EX: ttlSeconds // Expire after TTL seconds
  });

  // Result is 'OK' if set (new), null if already exists (duplicate)
  return result === 'OK';
}

/**
 * Generate fingerprint from alert data
 * Creates a deterministic hash for deduplication
 */
export function generateFingerprint(alert: {
  source: string;
  title?: string;
  service?: string;
  environment?: string;
  tags?: Record<string, string>;
  metric?: string;
}): string {
  const parts = [
    alert.source,
    alert.title || '',
    alert.service || '',
    alert.environment || '',
    alert.metric || '',
    // Sort tags for deterministic fingerprint
    ...Object.entries(alert.tags || {}).sort(([a], [b]) => a.localeCompare(b)).flat()
  ];
  
  const str = parts.join('|');
  
  // Simple hash - in production use crypto.createHash('sha256')
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Clear deduplication key (for testing or manual reset)
 */
export async function clearDedup(fingerprint: string): Promise<void> {
  if (!redisClient?.isOpen) return;
  
  const key = `alert:dedup:${fingerprint}`;
  await redisClient.del(key);
}

/**
 * Get deduplication stats
 */
export async function getDedupStats(): Promise<{ keys: number; memory: string }> {
  if (!redisClient?.isOpen) await initRedisDedup();
  
  const keys = await redisClient!.keys('alert:dedup:*');
  const info = await redisClient!.info('memory');
  const memoryMatch = info.match(/used_memory_human:(\S+)/);
  
  return {
    keys: keys.length,
    memory: memoryMatch?.[1] || 'unknown'
  };
}