/**
 * Hyperlink Horizon - Redis Queue Manager
 * Uses Upstash Redis for serverless-compatible queueing.
 */

import { Redis } from '@upstash/redis';

// Initialize Redis client
// We use a singleton pattern for serverless connection reuse where possible
let redis;

try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
    } else {
        console.warn('Redis credentials missing. Queue will fallback to error.');
    }
} catch (e) {
    console.error('Failed to initialize Redis:', e);
}

const QUEUE_KEY = 'job_queue';
// const LOCK_KEY = 'processing_lock'; // Using dynamic lock keys based on job ID? No, global lock for this user?
// Requirement: "One person at a time" -> Global Lock.
const GLOBAL_LOCK_KEY = 'global_processing_lock';

export const RedisQueue = {
    /**
     * Check if Redis is configured
     */
    isReady: () => !!redis,

    /**
     * Add a user/job to the waiting list.
     * Returns a Ticket ID (jobId) and current Length.
     */
    addToQueue: async (jobId) => {
        if (!redis) throw new Error('Redis not configured');

        // Push to end of list
        const length = await redis.rpush(QUEUE_KEY, jobId);
        return length;
    },

    /**
     * Check position in queue
     * Returns 0 if you are at the front (Head), >0 if behind others.
     * Returns -1 if not found.
     */
    getPosition: async (jobId) => {
        if (!redis) return -1;

        // Get all items (not efficient for huge queues, but fine for <100)
        // LPOS command is available in recent Redis versions, Upstash supports it.
        try {
            const pos = await redis.lpos(QUEUE_KEY, jobId);
            return pos; // 0-based index
        } catch (e) {
            // Fallback for older Redis versions
            const all = await redis.lrange(QUEUE_KEY, 0, -1);
            return all.indexOf(jobId);
        }
    },

    /**
     * Try to acquire the Global Lock.
     * Only works if:
     * 1. You are at position 0 (Head of Queue)
     * 2. Lock is free
     */
    canProcess: async (jobId) => {
        if (!redis) return false;

        // 1. Check if we are head of line
        const items = await redis.lrange(QUEUE_KEY, 0, 0);
        if (!items || items.length === 0 || items[0] !== jobId) {
            return false; // Not your turn
        }

        // 2. Check if lock is free OR if we already hold it
        // We use setnx to try acquiring lock
        // Lock TTL: 60 seconds (max processing time)
        const acquired = await redis.set(GLOBAL_LOCK_KEY, jobId, { nx: true, ex: 60 });

        if (acquired === 'OK') return true;

        // If lock exists, check if WE own it (idempotency for retries)
        const owner = await redis.get(GLOBAL_LOCK_KEY);
        return owner === jobId;
    },

    /**
     * Remove from queue and release lock
     * Called after successful processing OR failure
     */
    complete: async (jobId) => {
        if (!redis) return;

        // 1. Release Lock (only if we own it)
        const owner = await redis.get(GLOBAL_LOCK_KEY);
        if (owner === jobId) {
            await redis.del(GLOBAL_LOCK_KEY);
        }

        // 2. Remove from Queue
        await redis.lrem(QUEUE_KEY, 1, jobId);
    },

    /**
     * Keep lock alive (heartbeat)
     */
    extendLock: async (jobId) => {
        if (!redis) return;
        const owner = await redis.get(GLOBAL_LOCK_KEY);
        if (owner === jobId) {
            await redis.expire(GLOBAL_LOCK_KEY, 60);
        }
    }
};
