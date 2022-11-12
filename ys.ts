import type { Operation } from "./deps.ts";
import { signal } from "https://deno.land/std@0.159.0/signal/mod.ts";
import { first, run, resolve, stream } from './deps.ts';
import { load } from "./load.ts";

let [mod] = Deno.args;
if (!mod) {
  console.error('ys SCRIPT');
} else {
  let url = isURL(mod) ? mod : `file://${resolve(mod)}`;
  await run(() => load(url));
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
