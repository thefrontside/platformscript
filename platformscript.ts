import type { PSEnv, PSFn, PSMap, PSModule, PSValue } from "./types.ts";
import type { Operation, Task } from "./deps.ts";
import { createYSEnv, global } from "./evaluate.ts";
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

export function createPlatformScript(canon = map({})): PlatformScript {
  let env = createYSEnv(global);

  function run<T>(block: (env: PSEnv) => Operation<T>): Task<T> {
    return $run(() => block(env));
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
      return run((env) =>
        moduleEval({ source: value, location: url, env, canon })
      );
    },
    load(location, base) {
      return run((env) => load({ location, base, env, canon }));
    },
  };
  return platformscript;
}
