export function underline(str: string): string {
  return `\u001b[4m${str}\u001b[0m`;
}

/* eslint-disable no-console */
export function suppressLogs(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const log = console.log;

    console.log();
    console.log = () => {};

    const result = originalMethod.apply(this, args);

    console.log = log;

    return result;
  };

  return descriptor;
}
/* eslint-enable no-console */
