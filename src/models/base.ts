export function isIterable(obj: any) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === "function";
}

export type MaybePromise<T> = Promise<T> | T;

export type Id = string | number | symbol;

export const isId = (obj: any): obj is Id =>
  typeof obj === "string" || typeof obj === "number" || typeof obj === "symbol";
