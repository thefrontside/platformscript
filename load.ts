import type { YSModule, YSMap } from "./types.ts";
import type { Operation } from "./deps.ts";

import { expect } from './deps.ts';
import { parse, global, createYSEnv } from "./evaluate.ts";

export function* load(location: string | URL, base?: string): Operation<YSModule> {
  let url = typeof location === 'string' ? new URL(location, base): location;
  let content = yield* read(url);
  let literal = parse(content);

  let env = createYSEnv();

  let symbols: YSMap = {
    type: "map",
    value: {},
  };

  if (literal.type === 'map') {
    let { import: imports, ...values } = literal.value
    if (imports) {
      if (imports.type === 'map') {
        let { names } = imports.value;
        if (!names) {
          throw new Error(`imports must have a list of 'names:'`);
        }
        if (names.type !== 'list') {
          throw new Error(`imported names must be a list, but was '${names.type}`);
        }
        let { from: source } = imports.value;
        if (!source) {
          throw new Error(`imports must have a 'from:' field'`);
        }
        if (source.type !== 'string') {
          throw new Error(`import location should be a string, but was '${source.type}`);
        }
        let dep = yield* load(source.value, url.toString());
        for (let name of names.value) {
          if (name.type !== 'ref') {
            throw new Error(`imported names must be references, but found ${name.type}`);
          }
          let value = dep.symbols.value[name.name];
          symbols.value[name.name] = value;
        }
      } else {
        throw new Error(`imports must be specified as a list or a mapping, but it was ${imports.type}`);
      }
    }
    for (let key of Object.keys(values)) {
      if (hasKey(key, global)) {
        throw new Error(`cannot override global operation '${key}'`);
      } else {
        symbols.value[key] = yield* env.eval(literal.value[key], symbols);
      }
    }
  }


  return {
    url: url.toString(),
    symbols,
    literal,
  };
}

function read(url: URL): Operation<string> {
  if (url.protocol === 'file:') {
    return expect(Deno.readTextFile(url));
  } else {
    throw new Error(`cannot load module from ${url}: unsupported protocol '${url.protocol}'`);
  }
}

function hasKey(key: string, map: YSMap): boolean {
  return key in map.value;
}
