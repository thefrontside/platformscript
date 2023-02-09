export interface Deferred<T = void> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export function defer<T>(): Deferred<T> {
  let resolve: Deferred<T>["resolve"] | undefined = void 0;
  let reject: Deferred<T>["reject"] | undefined = void 0;
  let promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  if (!resolve || !reject) {
    throw new Error("unable to create Deferred!");
  } else {
    return { resolve, reject, promise };
  }
}
