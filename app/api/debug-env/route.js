
import { NextResponse } from 'next/server';

export async function GET() {
    const key = process.env.GEMINI_API_KEY;

    return NextResponse.json({
        status: 'Environment Diagnostic',
        hasKey: !!key,
        keyLength: key ? key.length : 0,
        keyPrefix: key ? key.substring(0, 5) : 'N/A',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
}
