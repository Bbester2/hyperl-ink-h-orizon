import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { RedisQueue } from '@/lib/redis-queue';

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
