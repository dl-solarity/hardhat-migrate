import { MigrateError } from "./MigrateError.js";

const WRAPPED_METHOD = Symbol("CatchClassErrorWrapped");

export function CatchClassError<T extends abstract new (...args: any) => any>(
  value: T,
  context: ClassDecoratorContext<T>,
) {
  const name = context.name?.toString?.() ?? value.name;
  const BaseClass = value as any;

  return class extends BaseClass {
    constructor(...args: any[]) {
      super(...args);
      _wrapAllMethods(this, name);
    }
  } as unknown as T;
}

function _wrapAllMethods(instance: any, className: string) {
  let proto = Object.getPrototypeOf(instance);

  while (proto && proto !== Object.prototype) {
    for (const key of Reflect.ownKeys(proto)) {
      if (key === "constructor") continue;

      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (!desc || typeof desc.value !== "function") continue;
      if ((desc.value as any)[WRAPPED_METHOD]) continue;

      const wrapped = _wrapMethod(desc.value, `${className}.${String(key)}`);
      (wrapped as any)[WRAPPED_METHOD] = true;

      Object.defineProperty(proto, key, {
        ...desc,
        value: wrapped,
      });
    }

    proto = Object.getPrototypeOf(proto);
  }
}

function _wrapMethod(original: (...args: any[]) => any, propertyName: string) {
  return function ___ErrorCatcher(this: unknown, ...args: any[]) {
    try {
      const result = original.apply(this, args);
      if (result && typeof result.then === "function") {
        return result.catch((e: any) => _handleError(propertyName, e));
      }
      return result;
    } catch (e: any) {
      _handleError(propertyName, e);
    }
  };
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
