import {
  Operation,
  run,
  spawn,
  suspend,
  Task,
} from "https://raw.githubusercontent.com/cowboyd/instructional-effection/v0.0.0/mod.ts";
import { useEffect, useState } from "preact/hooks";

export * from "https://raw.githubusercontent.com/cowboyd/instructional-effection/v0.0.0/mod.ts";

export type InvokeTask<T> = (event: T) => void;

export function useTask<T>(
  op: (event: T) => Operation<void>,
  deps: unknown[] = [],
): InvokeTask<T> {
  let [current, setCurrent] = useState<Task<void>>(run(() => suspend()), deps);

  useEffect(() => current.halt, deps.concat(current));

  return (event) => {
    run(function* () {
      yield* current.halt();
      let task = yield* spawn(() => op(event));
      setCurrent(task);
      yield* task;
    });
  };
}
