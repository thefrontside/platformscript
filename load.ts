import type { PSEnv, PSMap, PSModule, PSValue } from "./types.ts";
import type { Operation } from "./deps.ts";

import { expect, useAbortSignal } from "./deps.ts";
import { exclude, lookup } from "./psmap.ts";
import { createYSEnv, parse } from "./evaluate.ts";
import { recognize } from "./recognize.ts";
import * as data from "./data.ts";

export interface LoadOptions {
  location: string | URL;
  base?: string;
  env?: PSEnv;
  canon?: PSMap;
}

export function* load(options: LoadOptions): Operation<PSModule> {
  let { location, base, env, canon } = options;
  let url = typeof location === "string" ? new URL(location, base) : location;

  let content = yield* read(url);
  let source = parse(content);

  return yield* moduleEval({ source, location: url, env, canon });
}

export interface ModuleEvalOptions {
  location: string | URL;
  source: PSValue;
  env?: PSEnv;
  canon?: PSMap;
}

export function* moduleEval(options: ModuleEvalOptions): Operation<PSModule> {
  let { location, source, env = createYSEnv() } = options;
  let url = typeof location === "string" ? new URL(location) : location;

  let mod: PSModule = {
    location: location.toString(),
    source,
    value: source,
    imports: [],
  };

  if (source.type !== "map") {
    return mod;
  }

  let scope = data.map({});
  let canon = options.canon ?? data.map({});

  let imports = lookup("$import", source);
  let rest = exclude(["$import"], source);

  if (imports.type === "just") {
    if (imports.value.type !== "map") {
      throw new Error(
        `imports must be specified as a mapping of names: URL but was ${imports.value.type}`,
      );
    }
    for (let [names, loc] of imports.value.value.entries()) {
      if (names.type !== "string") {
        throw new Error(
          `imported symbols should be a string, but was ${names.type}`,
        );
      }
      if (loc.type !== "string") {
        throw new Error(
          `import location should be a url string, but was ${loc.type}`,
        );
      }
      let bindings = matchBindings(names.value);

      let dep = loc.value === "--canon--"
        ? ({
          location: loc.value,
          source: canon,
          value: canon,
          imports: [],
        })
        : yield* load({
          location: loc.value,
          base: url.toString(),
          env,
        });

      mod.imports.push({
        module: dep,
        bindings,
      });

      for (let binding of bindings) {
        let name = binding.alias ?? binding.name;
        let value;
        if (binding.all) {
          value = dep.value;
        } else if (dep.value.type !== "map") {
          throw new Error(
            `tried to import a name from ${dep.location}, but it is not a 'map'. It is a ${dep.value.type}`,
          );
        } else {
          let result = lookup(binding.name, dep.value);
          if (result.type === "nothing") {
            throw new Error(
              `module ${dep.location} does not have a member named '${binding.name}'`,
            );
          } else {
            value = result.value;
          }
        }
        scope.value.set(data.string(name), value);
      }
    }
  }

  mod.value = data.map({});

  let expanded = recognize(rest);

  if (expanded.type !== "map") {
    mod.value = yield* env.eval(expanded, scope);
  } else {
    for (let [key, value] of expanded.value.entries()) {
      let evaluated = yield* env.eval(value, scope);
      scope.value.set(key, evaluated);
      mod.value.value.set(key, yield* env.eval(value, scope));
    }
  }

  return mod;
}

function* read(url: URL): Operation<string> {
  if (url.protocol === "file:") {
    return yield* expect(Deno.readTextFile(url));
  } else if (url.protocol.startsWith("http")) {
    let signal = yield* useAbortSignal();
    let response = yield* expect(fetch(url, { signal }));
    if (!response.ok) {
      throw new Error(`${url}: ${response.status} ${response.statusText}`);
    }
    return yield* expect(response.text());
  } else {
    throw new Error(
      `cannot load module from ${url}: unsupported protocol '${url.protocol}'`,
    );
  }
}

function matchBindings(spec: string): PSModule["imports"][number]["bindings"] {
  return spec.trim().split(/\s*,\s*/).map((spec) => {
    let splatMatch = spec.match(/(.+)<<$/);
    if (splatMatch) {
      return {
        name: splatMatch[1],
        all: true,
      };
    } else {
      return {
        name: spec,
        all: false,
      };
    }
  });
}
