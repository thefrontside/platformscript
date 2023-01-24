export interface Predicate<T> {
  (value: T): Promise<boolean>;
}

export async function* filter<T>(
  items: AsyncGenerator<T>,
  predicate: Predicate<T>,
): AsyncGenerator<T> {
  for await (let item of items) {
    if (await predicate(item)) {
      yield item;
    }
  }
}

export async function* map<T, R>(
  items: AsyncGenerator<T>,
  fn: (value: T) => Promise<R>,
): AsyncGenerator<R> {
  for await (let item of items) {
    yield await fn(item);
  }
}

export async function* until<T>(
  items: AsyncGenerator<T>,
  limit: Predicate<T>,
): AsyncGenerator<T> {
  for await (let item of items) {
    if (await limit(item)) {
      break;
    } else {
      yield item;
    }
  }
}

export async function first<T>(items: AsyncGenerator<T>): Promise<T | void> {
  for await (let item of items) {
    return item;
  }
}

export function find<T>(
  items: AsyncGenerator<T>,
  predicate: (t: T) => Promise<boolean>,
): Promise<T | void> {
  return first(filter(items, predicate));
}

export async function reduce<T, TResult>(
  items: AsyncGenerator<T>,
  initial: TResult,
  reducer: (result: TResult, item: T) => Promise<TResult>,
): Promise<TResult> {
  let result = initial;
  for await (let item of items) {
    result = await reducer(result, item);
  }
  return result;
}

export function sizeOf(items: AsyncGenerator<unknown>): Promise<number> {
  return reduce(items, 0, (sum) => Promise.resolve(sum + 1));
}
