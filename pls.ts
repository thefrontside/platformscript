import type { Operation } from "./deps.ts";
import { signal } from "https://deno.land/std@0.159.0/signal/mod.ts";
import { first, LogContext, resolve, run, spawn, stream } from "./deps.ts";
import { load } from "./load.ts";
import { ps2js } from "./convert.ts";

let [script] = Deno.args;
if (!script) {
  console.error(`pls SCRIPT`);
} else {
  let url = isURL(script) ? script : `file://${resolve(script)}`;
  await run(function* () {
    // setup logging context to output to stdout.
    yield* spawn(function* () {
      let logs = yield* LogContext;
      let i = yield* logs.output;
      for (let next = yield* i; !next.done; next = yield* i) {
        console.log(next.value.message);
      }
    });
    // load the module
    let mod = yield* load(url);

    // if the module has a result, print it.
    if (mod.value) {
      console.log(ps2js(mod.value));
    }
  });
}

function isURL(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch (_) {
    return false;
  }
}

export function* awaitSignal(name: Deno.Signal): Operation<void> {
  let signals = signal(name);
  try {
    yield* first(stream(signals));
  } finally {
    signals.dispose();
  }
}
