/**
 * Helper to suppress known, expected console logs/errors in tests while allowing
 * unexpected messages to surface. Returns a restore function.
 *
 * Usage:
 *   const restore = suppressConsole({
 *     log: [/✅ Item (created|updated|deleted) successfully/, /✅ Data loaded successfully/],
 *     error: [/❌ Error (loading|updating|creating|deleting) item/]
 *   });
 *   // ... tests ...
 *   restore();
 */
import { vi } from 'vitest';

export interface SuppressConsoleConfig {
  log?: (RegExp | string)[];
  error?: (RegExp | string)[];
  warn?: (RegExp | string)[];
}

function matcherFactory(patterns: (RegExp | string)[] | undefined) {
  if (!patterns || !patterns.length) return () => false;
  return (firstArg: unknown) => {
    if (typeof firstArg !== 'string') return false;
    return patterns.some(p => p instanceof RegExp ? p.test(firstArg) : firstArg.includes(p));
  };
}

export function suppressConsole(cfg: SuppressConsoleConfig): () => void {
  const shouldSuppressLog = matcherFactory(cfg.log);
  const shouldSuppressError = matcherFactory(cfg.error);
  const shouldSuppressWarn = matcherFactory(cfg.warn);

  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  const logSpy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    if (shouldSuppressLog(args[0])) return;
    originalLog(...args);
  });
  const errorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (shouldSuppressError(args[0])) return;
    originalError(...args);
  });
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    if (shouldSuppressWarn(args[0])) return;
    originalWarn(...args);
  });

  return function restore(): void {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  };
}
