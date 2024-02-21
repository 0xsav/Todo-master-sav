// source: https://stackoverflow.com/questions/60135993/typescript-how-to-write-an-asyncpipe-function-for-asynchronous-function-composi

/*
// get to the promise resolved type
type Sync<T> = T extends Promise<infer I> ? I : T

// Transform a D to a promise, if any of the others A,B, or C is a promise
type RelayPromise<A, B, C, D> =
    A extends Promise<any> ? Promise<Sync<D>> :
    B extends Promise<any> ? Promise<Sync<D>> :
    C extends Promise<any> ? Promise<Sync<D>> : D

/*
export function asyncPipe<A, B, C>(
  ab: (a: A) => B,
  bc: (b: Sync<B>) => C
): < D extends A | Promise<A>>(a: D) => RelayPromise<B, C, D, C>
*/
export function asyncPipe(...fns: Function[]) {
  return (x: any) =>
    fns.reduce((y, fn) => {
      return y instanceof Promise ? y.then((yr) => fn(yr)) : fn(y);
    }, x);
}
