import { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/constants';
import { verifySessionToken } from '@/lib/session';
import { generateAllCodes } from '@/lib/totp';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Defense in depth: verify session from cookie directly
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }
  const session = await verifySessionToken(token);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      function send() {
        try {
          const codes = generateAllCodes();
          const data = `data: ${JSON.stringify(codes)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (err) {
          console.error('SSE error:', err);
          controller.error(err);
        }
      }

      // Send immediately
      send();

      const interval = setInterval(send, 1000);

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
