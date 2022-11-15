import type { PSEnv, PSLiteral, PSMap, PSString, PSValue } from "./types.ts";

import { Operation, parseYAML, run, Task } from "./deps.ts";
import { yaml2ys } from "./convert.ts";

export interface EvalOptions {
  filename?: string;
  context?: PSMap;
}

export function evaluate(
  source: string,
  options?: EvalOptions,
): Task<PSValue> {
  let { filename = "script", context = { type: "map", value: {} } } = options ??
    {};
  let literal = parse(source, filename);

  let env = createYSEnv();

  return run(() => env.eval(literal, context));
}

export function createYSEnv(parent = global): PSEnv {
  return {
    *eval(value, context = { type: "map", value: {} }) {
      let scope = concat(parent, context);
      let env = createYSEnv(scope);

      if (value.type === "ref") {
        let { key, path, spec } = value;

        let result = scope.value[key];
        if (!result) {
          throw new ReferenceError(`'${value.key}' not defined`);
        } else {
          return path.reduce((current, segment) => {
            if (current.type === "map") {
              let next = current.value[segment];
              if (!next) {
                throw new ReferenceError(`no such key '${segment}' in ${spec}`);
              } else {
                return next;
              }
            } else {
              throw new TypeError(
                `cannot de-reference key ${segment} from ${current.type}`,
              );
            }
          }, result);
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

        return yield* fn.value({
          arg: map[name],
          env,
          rest: exclude({ type: "string", value: name }, value),
        });
      } else if (value.type === "list") {
        let result = [] as PSValue[];
        for (let item of value.value) {
          result.push(yield* env.eval(item, scope));
        }
        return { type: "list", value: result };
      } else {
        return value;
      }
    },
  };
}

export const letdo = {
  getBindings(value?: PSValue): PSMap {
    let bindings = value ?? { type: "map", value: {} };
    if (bindings.type !== "map") {
      throw new TypeError(
        `'let' bindings must be a yaml mapping of keys to values, but it was passed a value of type '${bindings.type}'`,
      );
    }
    return bindings;
  },
  *do(block: PSValue, bindings: PSMap, env: PSEnv) {
    let scope = yield* map(bindings, env.eval);
    if (block.type === "list") {
      let result: PSValue = {
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

export const global: PSMap = {
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

export function parse(source: string, filename = "script"): PSLiteral<PSValue> {
  let yaml = parseYAML(source, { filename });
  if (!yaml) {
    throw new SyntaxError(`empty string is not a YAML Document`);
  }
  return yaml2ys(yaml);
}

export function concat(parent: PSMap, child: PSMap): PSMap {
  let properties = {};
  Object.assign(
    properties,
    Object.keys(parent.value).reduce((props, key) => {
      return Object.assign(props, {
        [key]: {
          enumerable: true,
          configurable: true,
          get: () => parent.value[key],
        } as PropertyDescriptor,
      });
    }, {}),
  );

  Object.assign(
    properties,
    Object.keys(child.value).reduce((props, key) => {
      return Object.assign(props, {
        [key]: {
          enumerable: true,
          configurable: true,
          get: () => child.value[key],
        } as PropertyDescriptor,
      });
    }, {}),
  );

  return {
    type: "map",
    value: Object.create(parent.value, properties),
  };
}

export function* map(
  fntor: PSMap,
  fn: (value: PSValue) => Operation<PSValue>,
): Operation<PSMap> {
  let value: Record<string, PSValue> = {};
  for (let key of Object.keys(fntor.value)) {
    value[key] = yield* fn(fntor.value[key]);
  }

  return { type: "map", value };
}

export function exclude(key: PSString, map: PSMap) {
  let result: PSMap = {
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
