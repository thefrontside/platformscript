import type { PSEnv, PSMap, PSModule, PSValue } from "./types.ts";
import type { Operation } from "./deps.ts";

import { expect, useAbortSignal } from "./deps.ts";
import { exclude, lookup } from "./psmap.ts";
import { createYSEnv, letdo, parse } from "./evaluate.ts";

export interface LoadOptions {
  location: string | URL;
  base?: string;
  env?: PSEnv;
}

export function* load(options: LoadOptions): Operation<PSModule> {
  let { location, base } = options;
  let url = typeof location === "string" ? new URL(location, base) : location;

  let content = yield* read(url);
  let body = parse(content);

  let result: PSValue = body;

  let scope: PSMap = {
    type: "map",
    value: new Map(),
  };

  let symbols: PSMap = {
    type: "map",
    value: new Map(),
  };

  let env = options.env ?? createYSEnv();

  function* importSymbols(map: PSValue): Operation<void> {
    if (map.type !== "map") {
      throw new Error(
        `imports must be specified as a mapping of name: and from:, but was ${map.type}`,
      );
    }
    let names = lookup("names", map);
    if (names.type === "nothing") {
      throw new Error(`imports must have a list of 'names:'`);
    }
    if (names.value.type !== "list") {
      throw new Error(
        `imported names must be a list, but was '${names.type}`,
      );
    }
    let source = lookup("from", map);
    if (source.type === "nothing") {
      throw new Error(`imports must have a 'from:' field'`);
    }
    if (source.value.type !== "string") {
      throw new Error(
        `import location should be a string, but was '${source.type}`,
      );
    }
    let dep = yield* load({
      location: source.value.value,
      base: url.toString(),
      env,
    });

    for (let name of names.value.value) {
      if (name.type !== "string") {
        throw new Error(
          `imported names must be strings, but found ${name.type}`,
        );
      }
      let value = lookup(name.value, dep.symbols);
      if (value.type === "nothing") {
        throw new Error(
          `${source.value.value} does not define a value named '${name.value}'`,
        );
      }
      scope.value.set(name, value.value);
    }
  }

  if (body.type === "map") {
    let imports = lookup("$import", body);
    let script = lookup("$do", body);
    let exports = exclude(["$import", "$do"], body);

    if (imports.type === "just") {
      if (imports.value.type === "map") {
        yield* importSymbols(imports.value);
      } else if (imports.value.type === "list") {
        for (let mapping of imports.value.value) {
          yield* importSymbols(mapping);
        }
      } else {
        throw new Error(
          `imports must be specified as a list or a mapping, but it was ${imports.value.type}`,
        );
      }
    }
    for (let [key, value] of exports.value.entries()) {
      let $value = yield* env.eval(value, scope);
      scope.value.set(key, $value);
      symbols.value.set(key, $value);
    }

    if (script.type === "just") {
      result = yield* letdo.do(script.value, scope, env);
    } else {
      result = { type: "boolean", value: false };
    }
  } else if (body.type === "list") {
    result = yield* letdo.do(body, scope, env);
  }

  return {
    url: url.toString(),
    symbols,
    body,
    value: result,
  };
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
