// Vercel captures stdout/stderr. A small compatible logger avoids filesystem
// transports and keeps all existing logger.info/warn/error call sites intact.
const logger = {
  debug: (...args: unknown[]) => console.debug(...args),
  info: (...args: unknown[]) => console.log(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};

export { logger };
export default logger;
