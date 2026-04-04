/**
 * Client-side logger — no-op in production to prevent log leakage.
 * In development, proxies to the browser console.
 */
const isProd = import.meta.env.PROD;

const noop = () => {};

export const logger = {
  log:   isProd ? noop : (...args: unknown[]) => console.log(...args),
  warn:  isProd ? noop : (...args: unknown[]) => console.warn(...args),
  error: isProd ? noop : (...args: unknown[]) => console.error(...args),
  info:  isProd ? noop : (...args: unknown[]) => console.info(...args),
  debug: isProd ? noop : (...args: unknown[]) => console.debug(...args),
};
