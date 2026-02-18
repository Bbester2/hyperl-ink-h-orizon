import { NextResponse } from 'next/server';
import { RedisQueue } from '@/lib/redis-queue';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('jobId');

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
        }

        if (!RedisQueue.isReady()) {
            // Fallback: If redis is down/missing, allow everyone so dev mode works
            return NextResponse.json({ status: 'ready', position: 0, warning: 'Redis not configured' });
        }

        const position = await RedisQueue.getPosition(jobId);

        if (position === -1) {
            // Not in queue? Maybe completed or expired.
            return NextResponse.json({ status: 'unknown', message: 'Job not found in queue' });
        }

        // Check if we can start (Head of Line + Lock Free)
        const canStart = await RedisQueue.canProcess(jobId);

        if (canStart) {
            return NextResponse.json({
                status: 'ready',
                position: 0
            });
        } else {
            return NextResponse.json({
                status: 'queued',
                position: position // 0 means "Next in line but Lock is taken"
            });
        }

    } catch (error) {
        console.error('Queue Status Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
