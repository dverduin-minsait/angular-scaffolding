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
export interface SuppressConsoleConfig {
  log?: (RegExp | string)[];
  error?: (RegExp | string)[];
  warn?: (RegExp | string)[];
}

function matcherFactory(patterns: (RegExp | string)[] | undefined) {
  if (!patterns || !patterns.length) return () => false;
  return (firstArg: any) => {
    if (typeof firstArg !== 'string') return false;
    return patterns.some(p => p instanceof RegExp ? p.test(firstArg) : firstArg.includes(p));
  };
}

export function suppressConsole(cfg: SuppressConsoleConfig) {
  const shouldSuppressLog = matcherFactory(cfg.log);
  const shouldSuppressError = matcherFactory(cfg.error);
  const shouldSuppressWarn = matcherFactory(cfg.warn);

  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  const logSpy = jest.spyOn(console, 'log').mockImplementation(((...args: any[]) => {
    if (shouldSuppressLog(args[0])) return;
    return (originalLog as any)(...args);
  }) as any);
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(((...args: any[]) => {
    if (shouldSuppressError(args[0])) return;
    return (originalError as any)(...args);
  }) as any);
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(((...args: any[]) => {
    if (shouldSuppressWarn(args[0])) return;
    return (originalWarn as any)(...args);
  }) as any);

  return function restore() {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  };
}

// Convenience preset for Clothes CRUD component noisy logs
export function suppressClothesCrudConsole() {
  return suppressConsole({
    log: [
      /✅ Data loaded successfully/,
      /✅ Item (created|updated|deleted) successfully/
    ],
    error: [
      /❌ Error loading data:/,
      /❌ Error updating item:/,
      /❌ Error creating item:/,
      /❌ Error deleting item:/
    ]
  });
}
