import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { RedisQueue } from '@/lib/redis-queue';
// import { Redis } from '@upstash/redis'; // Access raw redis if needed

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        if (!RedisQueue.isReady()) {
            return NextResponse.json(
                { error: 'Queue system not configured (Redis missing)' },
                { status: 503 }
            );
        }

        const jobId = uuidv4();
        const position = await RedisQueue.addToQueue(jobId);

        return NextResponse.json({
            jobId,
            position: position - 1, // 0-indexed for UI (0 = next)
            message: 'Joined queue'
        });

    } catch (error) {
        console.error('Queue Join Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Admin Flush Endpoint
export async function DELETE(request) {
    try {
        // In a real app, check auth. Here we rely on obscurity or just being a utility.
        // Let's just flush it.
        if (!RedisQueue.isReady()) return NextResponse.json({ error: 'No Redis' }, { status: 503 });

        const Redis = require('@upstash/redis').Redis;
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        await redis.del('job_queue');
        await redis.del('global_processing_lock');

        return NextResponse.json({ message: 'Queue Flushed' });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
