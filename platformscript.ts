import type { PSMap, PSModule, PSValue } from "./types.ts";
import type { Task } from "./deps.ts";
import { createYSEnv, global, parse } from "./evaluate.ts";
import { concat, createPSMap } from "./psmap.ts";
import { load } from "./load.ts";
import { run } from "./deps.ts";

export interface PlatformScript {
  eval(value: PSValue, bindings?: PSMap): Task<PSValue>;
  load(url: string | URL, base?: string): Task<PSModule>;
  parse(source: string, filename?: string): PSValue;
}

export function createPlatformScript(extensions?: PSMap): PlatformScript {
  let ext = extensions ?? createPSMap();
  let env = createYSEnv(concat(global, ext));

  return {
    eval(value, bindings) {
      return run(() => env.eval(value, bindings));
    },
    load(location, base) {
      return run(() => load({ location, base, env }));
    },
    parse(source, filename) {
      return parse(source, filename);
    },
  };
}
