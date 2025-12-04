export function underline(str: string): string {
  return `\u001b[4m${str}\u001b[0m`;
}

/* eslint-disable no-console */
export function SuppressLogs<This, F extends (this: This, ...args: any[]) => any>(
  value: F,
  _context: ClassMethodDecoratorContext<This, F>,
) {
  return function (this: This, ...args: Parameters<F>): ReturnType<F> {
    const originalLog = console.log;
    console.log = () => {};

    try {
      const result = value.apply(this, args) as ReturnType<F>;

      // If the method returns a promise, restore logs after it settles
      if (result && typeof (result as any).then === "function") {
        return (result as Promise<unknown>).finally(() => {
          console.log = originalLog;
        }) as ReturnType<F>;
      }

      // Sync path: restore immediately
      console.log = originalLog;
      return result;
    } catch (e) {
      // Ensure restoration on error
      console.log = originalLog;
      throw e;
    }
  } as F;
}
/* eslint-enable no-console */
