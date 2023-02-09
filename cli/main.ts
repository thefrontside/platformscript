import type { Operation, Task } from "../deps.ts";
import { action, run, spawn, suspend } from "../deps.ts";
import { defer } from "./deferred.ts";

export function main(op: (args: string[]) => Operation<void>): Task<void> {
  return run(function* Main() {
    let done = defer<number>();

    yield* spawn(function* () {
      try {
        yield* op(Deno.args);
        done.resolve(0);
      } catch (error) {
        console.error(String(error));
        done.resolve(1);
      }
    });

    let code = yield* action<number>(function* (resolve) {
      done.promise.then(resolve);
      let interrupt = () => resolve(1);
      try {
        Deno.addSignalListener("SIGINT", interrupt);
        yield* suspend();
      } finally {
        Deno.removeSignalListener("SIGINT", interrupt);
      }
    });

    Deno.exit(code);
  });
}
