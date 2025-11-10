import { MigrateError } from "./MigrateError.js";

export function CatchClassError<T extends abstract new (...args: any) => any>(
  value: T,
  context: ClassDecoratorContext<T>,
) {
  const name = context.name?.toString?.() ?? value.name;

  return class extends (value as any) {
    constructor(...args: any[]) {
      super(...args);
      _wrapAllMethods(this, name);
    }
  } as unknown as T;
}

function _wrapAllMethods(instance: any, className: string) {
  const proto = Object.getPrototypeOf(instance);
  for (const key of Reflect.ownKeys(proto)) {
    if (key === "constructor") continue;

    const desc = Object.getOwnPropertyDescriptor(proto, key);
    if (!desc || typeof desc.value !== "function") continue;

    const original = desc.value;
    Object.defineProperty(proto, key, {
      ...desc,
      value: function ___ErrorCatcher(...args: any[]) {
        try {
          const result = original.apply(this, args);
          if (result && typeof result.then === "function") {
            return result.catch((e: any) => _handleError(`${className}.${String(key)}`, e));
          }
          return result;
        } catch (e: any) {
          _handleError(`${className}.${String(key)}`, e);
        }
      },
    });
  }
}

export function CatchMethodError(value: Function, context: ClassMethodDecoratorContext): (...args: any[]) => any {
  const name = `${String(context.name)}`;
  return function (this: unknown, ...args: any[]) {
    try {
      const result = value.apply(this, args);
      if (result && typeof result.then === "function") {
        return result.catch((e: any) => _handleError(name, e));
      }
      return result;
    } catch (e: any) {
      _handleError(name, e);
    }
  };
}

function _handleError(propertyName: string, error: any) {
  throw new MigrateError(`${propertyName}(): ${error.message ?? error}`, { cause: error });
}
