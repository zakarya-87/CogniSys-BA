import type { Response } from 'express';

/**
 * Log the full error server-side and send a generic safe response to the client.
 * NEVER expose error.message, stack traces, or API error payloads to clients.
 */
export function safeError(
  res: Response,
  error: unknown,
  context: string,
  statusCode = 500,
): void {
  console.error(`[${context}]`, error);
  res.status(statusCode).json({ error: 'Internal server error' });
}

/**
 * Same as safeError but for HTML responses (OAuth popup flow).
 */
export function safeErrorHtml(res: Response, error: unknown, context: string): void {
  console.error(`[${context}]`, error);
  res.status(500).send(`
    <html>
      <body>
        <p>Authentication failed. Please close this window and try again.</p>
        <script>setTimeout(() => window.close(), 3000);</script>
      </body>
    </html>
  `);
}
