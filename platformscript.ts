import type { PSEnv, PSFn, PSMap, PSModule, PSValue } from "./types.ts";
import type { Operation, Task } from "./deps.ts";
import { createYSEnv, global } from "./evaluate.ts";
import { concat } from "./psmap.ts";
import { load, moduleEval } from "./load.ts";
import { map } from "./data.ts";
import { run as $run } from "./deps.ts";

export interface PlatformScript {
  run<T>(block: (env: PSEnv) => Operation<T>): Task<T>;
  call(fn: PSFn, arg: PSValue, options?: PSMap): Task<PSValue>;
  eval(value: PSValue, bindings?: PSMap): Task<PSValue>;
  moduleEval(value: PSValue, url: string | URL): Task<PSModule>;
  load(url: string | URL, base?: string): Task<PSModule>;
}

export function createPlatformScript(
  globals?: (ps: PlatformScript) => PSMap,
): PlatformScript {
  let env = lazy(() => {
    let ext = globals ? globals(platformscript) : map({});
    return createYSEnv(concat(global, ext));
  });

  function run<T>(block: (env: PSEnv) => Operation<T>): Task<T> {
    return $run(() => block(env()));
  }

  let platformscript: PlatformScript = {
    run,
    call(fn, arg, options) {
      return run((env) => env.call(fn, arg, options));
    },
    eval(value, bindings) {
      return run((env) => env.eval(value, bindings));
    },
    moduleEval(value, url) {
      return run((env) => moduleEval({ body: value, location: url, env }));
    },
    load(location, base) {
      return run((env) => load({ location, base, env }));
    },
  };
  return platformscript;
}

function lazy<T>(create: () => T): () => T {
  let thunk = () => {
    let value = create();
    thunk = () => value;
    return value;
  };
  return () => thunk();
}
