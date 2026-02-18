# Hyperlink Horizon

Professional URL and Document Link Analyzer with AI Suggestions.

## Deployment

To deploy on Vercel, ensure the following Environment Variables are set:

- `GEMINI_API_KEY`: Google Gemini API Key for AI suggestions.
- `UPSTASH_REDIS_REST_URL`: Upstash Redis URL for the Job Queue.
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis Token for the Job Queue.

## Queue System

This project uses `@upstash/redis` to manage a "Ticket Queue" system, ensuring sequential processing of heavy document analysis tasks.
