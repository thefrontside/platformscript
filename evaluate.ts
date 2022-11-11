import type { YSEnv, YSLiteral, YSMap, YSString, YSValue } from "./types.ts";

import { Operation, parseYAML, run, Task } from "./deps.ts";
import { yaml2ys } from "./convert.ts";

export interface EvalOptions {
  filename?: string;
  context?: YSMap;
}

export function evaluate(
  source: string,
  options?: EvalOptions,
): Task<YSValue> {
  let { filename = "script", context = { type: "map", value: {} } } = options ??
    {};
  let literal = parse(source, filename);

  let env = createYSEnv();

  return run(() => env.eval(literal, context));
}

export function createYSEnv(parent = global): YSEnv {
  return {
    *eval(value, context = { type: "map", value: {} }) {
      let scope = concat(parent, context);
      if (value.type === "ref") {
        let [key] = value.path;
        let result = scope.value[key];
        if (!result) {
          throw new ReferenceError(`'${value.name}' not defined`);
        } else {
          return result;
        }
      } else if (value.type === "map") {
        let map = value.value;
        let [name] = Object.keys(map);
        if (!name) {
          return { type: "boolean", value: false };
        }
        let fn = scope.value[name];
        if (!fn) {
          throw new Error(`no function defined for '${name}'`);
        }
        if (fn.type !== "fn") {
          throw new Error(`${name} is not a function, it is a ${fn.type}`);
        }

        let env = createYSEnv(scope);

        return yield* fn.value({
          arg: map[name],
          env,
          rest: exclude({ type: "string", value: name }, value),
        });
      } else {
        return value;
      }
    },
  };
}

export const letdo = {
  getBindings(value?: YSValue): YSMap {
    let bindings = value ?? { type: "map", value: {} };
    if (bindings.type !== "map") {
      throw new TypeError(
        `'let' bindings must be a yaml mapping of keys to values, but it was passed a value of type '${bindings.type}'`,
      );
    }
    return bindings;
  },
  *do(block: YSValue, bindings: YSMap, env: YSEnv) {
    let scope = yield* map(bindings, env.eval);
    if (block.type === "list") {
      let result: YSValue = {
        type: "boolean",
        value: false,
      };
      for (let item of block.value) {
        result = yield* env.eval(item, scope);
      }
      return result;
    } else {
      return yield* env.eval(block, scope);
    }
  },
};

export const global: YSMap = {
  type: "map",
  value: {
    let: {
      type: "fn",
      *value({ arg, env, rest }) {
        let bindings = letdo.getBindings(arg);
        let block = rest.value["do"];
        if (block) {
          return yield* letdo.do(block, bindings, env);
        } else {
          return { type: "boolean", value: false };
        }
      },
    },
    do: {
      type: "fn",
      *value({ arg, env, rest }) {
        let bindings = letdo.getBindings(rest.value["let"]);
        return yield* letdo.do(arg, bindings, env);
      },
    },
  },
};

export function parse(source: string, filename = "script"): YSLiteral<YSValue> {
  let yaml = parseYAML(source, { filename });
  if (!yaml) {
    throw new SyntaxError(`empty string is not a YAML Document`);
  }
  return yaml2ys(yaml);
}

export function concat(parent: YSMap, child: YSMap): YSMap {
  let properties = Object.keys(child.value).reduce((props, key) => {
    return Object.assign(props, {
      [key]: {
        enumerable: true,
        configurable: true,
        get: () => child.value[key],
      } as PropertyDescriptor,
    });
  }, {});
  return {
    type: "map",
    value: Object.create(parent.value, properties),
  };
}

export function* map(
  fntor: YSMap,
  fn: (value: YSValue) => Operation<YSValue>,
): Operation<YSMap> {
  let value: Record<string, YSValue> = {};
  for (let key of Object.keys(fntor.value)) {
    value[key] = yield* fn(fntor.value[key]);
  }

  return { type: "map", value };
}

export function exclude(key: YSString, map: YSMap) {
  let result: YSMap = {
    type: "map",
    value: {},
  };
  for (let k of Object.keys(map.value)) {
    if (k !== key.value) {
      result.value[k] = map.value[k];
    }
  }

  return result;
}
