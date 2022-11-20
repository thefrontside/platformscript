import type {
  PSEnv,
  PSLiteral,
  PSMap,
  PSMapKey,
  PSTemplate,
  PSValue,
} from "./types.ts";

import { parseYAML } from "./deps.ts";
import { yaml2ps } from "./convert.ts";
import { concat, lookup, map, Maybe } from "./psmap.ts";

type Segment = {
  type: "const";
  value: string;
} | {
  type: "expr";
  ref: PSLiteral;
};

function* segments(t: PSTemplate): Generator<Segment> {
  let { expressions } = t;
  if (expressions.length) {
    let idx = 0;
    for (let expr of expressions) {
      let [start, end] = expr.range;
      let substr = t.value.slice(idx, start);
      yield {
        type: "const",
        value: substr,
      };
      yield {
        type: "expr",
        ref: expr.expression,
      };
      idx = end;
    }
    if (idx < t.value.length) {
      yield {
        type: "const",
        value: t.value.slice(idx),
      };
    }
  } else {
    yield {
      type: "const",
      value: t.value,
    };
  }
}

export function createYSEnv(parent = global): PSEnv {
  return {
    *eval(value, context = { type: "map", value: new Map() }) {
      let scope = concat(parent, context);
      let env = createYSEnv(scope);

      if (value.type === "ref") {
        let { key, path } = value;

        let result = lookup(key, scope);
        if (result.type === "nothing") {
          throw new ReferenceError(`'${value.key}' not defined`);
        } else {
          return path.reduce((current, segment) => {
            if (current.type === "map") {
              let next = lookup(segment, current);
              if (next.type === "nothing") {
                throw new ReferenceError(
                  `no such key '${segment}' in ${value.value}`,
                );
              } else {
                return next.value;
              }
            } else {
              throw new TypeError(
                `cannot de-reference key ${segment} from ${current.type}`,
              );
            }
          }, result.value);
        }
      } else if (value.type === "template") {
        let str = "";
        for (let segment of segments(value)) {
          if (segment.type === "const") {
            str += segment.value;
          } else {
            let result = yield* env.eval(segment.ref);
            str += result.value.toString();
          }
        }
        return { type: "string", value: str };
      } else if (value.type === "map") {
        let entries = [...value.value.entries()];
        let [first, ...rest] = entries;

        if (!first) {
          return { type: "boolean", value: false };
        } else {
          let [key, value] = first;
          if (key.type === "ref") {
            let fn = yield* env.eval(key);
            if (fn.type !== "fn") {
              throw new Error(
                `'${key.value}' is not a function, it is a ${fn.type}`,
              );
            }
            return yield* fn.value({
              arg: value,
              env,
              rest: { type: "map", value: new Map(rest) },
            });
          } else {
            return {
              type: "map",
              value: new Map(entries),
            };
          }
        }
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
  getBindings(value: Maybe<PSValue>): PSMap {
    if (value.type === "nothing") {
      return { type: "map", value: new Map() };
    } else {
      let bindings = value.value;
      if (bindings.type !== "map") {
        throw new TypeError(
          `'let' bindings must be a yaml mapping of keys to values, but it was passed a value of type '${bindings.type}'`,
        );
      }
      return bindings;
    }
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
  value: new Map([
    [{
      type: "string",
      value: "let",
      holes: [],
    }, {
      type: "fn",
      *value({ arg, env, rest }) {
        let bindings = letdo.getBindings({ type: "just", value: arg });
        let block = lookup("$do", rest);
        if (block.type == "just") {
          return yield* letdo.do(block.value, bindings, env);
        } else {
          return { type: "boolean", value: false };
        }
      },
    }],
    [{
      type: "string",
      value: "do",
      holes: [],
    }, {
      type: "fn",
      *value({ arg, env, rest }) {
        let bindings = letdo.getBindings(lookup("$let", rest));
        return yield* letdo.do(arg, bindings, env);
      },
    }],
  ]),
};

export function parse(source: string, filename = "script"): PSLiteral<PSValue> {
  let yaml = parseYAML(source, { filename });
  let [error] = yaml.errors;
  if (!yaml) {
    throw new SyntaxError(`empty string is not a YAML Document`);
  } else if (error) {
    throw error;
  }
  return yaml2ps(yaml);
}

export function strip(literal: PSValue): PSValue {
  //@ts-expect-error stripping is safe because we're just dropping the node
  let { node: _, ...value } = literal;
  if (value.type === "map") {
    let map = value.value;
    return {
      type: "map",
      value: new Map(
        [...map.entries()].map(([k, v]) => [strip(k) as PSMapKey, strip(v)]),
      ),
    };
  } else if (value.type === "list") {
    let list = value.value;
    return {
      type: "list",
      value: list.map((val) => strip(val as PSLiteral<PSValue>)),
    };
  } else {
    return value;
  }
}
