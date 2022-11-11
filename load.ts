import type { YSMap, YSModule, YSValue } from "./types.ts";
import type { Operation } from "./deps.ts";

import { expect } from "./deps.ts";
import { createYSEnv, global, letdo, parse } from "./evaluate.ts";

export function* load(
  location: string | URL,
  base?: string,
): Operation<YSModule> {
  let url = typeof location === "string" ? new URL(location, base) : location;
  let body = yield* fetchModule(url);

  let result: YSValue = body;

  let env = createYSEnv();

  let symbols: YSMap = {
    type: "map",
    value: {},
  };

  function* importSymbols(map: YSValue): Operation<void> {
    if (map.type !== 'map') {
      throw new Error(`imports be specified as a mapping of name: and from:, but was ${map.type}`);
    }
    let { names } = map.value;
    if (!names) {
      throw new Error(`imports must have a list of 'names:'`);
    }
    if (names.type !== "list") {
      throw new Error(
        `imported names must be a list, but was '${names.type}`,
      );
    }
    let { from: source } = map.value;
    if (!source) {
      throw new Error(`imports must have a 'from:' field'`);
    }
    if (source.type !== "string") {
      throw new Error(
        `import location should be a string, but was '${source.type}`,
      );
    }
    let dep = yield* load(source.value, url.toString());
    for (let name of names.value) {
      if (name.type !== "ref") {
        throw new Error(
          `imported names must be references, but found ${name.type}`,
        );
      }
      let value = dep.symbols.value[name.name];
      if (!value) {
        throw new Error(
          `${source.value} does not define a value named '${name.name}'`,
        );
      }
      symbols.value[name.name] = value;
    }
  }

  if (body.type === "map") {
    let { import: imports, do: script, ...values } = body.value;
    if (imports) {
      if (imports.type === "map") {
        yield* importSymbols(imports)
      } else if (imports.type === "list") {
        for (let mapping of imports.value) {
          yield* importSymbols(mapping);
        }
      } else {
        throw new Error(
          `imports must be specified as a list or a mapping, but it was ${imports.type}`,
        );
      }
    }
    for (let key of Object.keys(values)) {
      if (hasKey(key, global)) {
        throw new Error(`cannot override global operation '${key}'`);
      } else {
        symbols.value[key] = yield* env.eval(body.value[key], symbols);
      }
    }
    if (script) {
      result = yield* letdo.do(script, symbols, env);
    } else {
      result = { type: "boolean", value: false };
    }
  } else if (body.type === "list") {
    result = yield* letdo.do(body, symbols, env);
  }

  return {
    url: url.toString(),
    symbols,
    body,
    value: result,
  };
}

function* fetchModule(url: URL): Operation<YSValue> {
  if (url.pathname.endsWith(".ts") || url.pathname.endsWith(".js")) {
    let definition = yield* expect(import(url.toString()));
    return definition.default;
  } else {
    let content = yield* read(url);
    return parse(content);
  }
}

function read(url: URL): Operation<string> {
  if (url.protocol === "file:") {
    return expect(Deno.readTextFile(url));
  } else {
    throw new Error(
      `cannot load module from ${url}: unsupported protocol '${url.protocol}'`,
    );
  }
}

function hasKey(key: string, map: YSMap): boolean {
  return key in map.value;
}
