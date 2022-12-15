import type {
  PSEnv,
  PSFn,
  PSLiteral,
  PSMap,
  PSMapKey,
  PSTemplate,
  PSValue,
} from "./types.ts";
import type { Operation } from "./deps.ts";

import { parseYAML } from "./deps.ts";
import { yaml2ps } from "./convert.ts";
import { concat, lookup, map, Maybe } from "./psmap.ts";
import * as data from "./data.ts";

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
  let env: PSEnv = {
    *eval($value, context = { type: "map", value: new Map() }) {
      let scope = concat(parent, context);
      let env = createYSEnv(scope);

      let value = yield* bind($value, scope, []);

      if (value.type === "ref") {
        return value;
      } else if (value.type === "template") {
        let str = "";
        for (let segment of segments(value)) {
          if (segment.type === "const") {
            str += segment.value;
          } else {
            let result = yield* env.eval(segment.ref);
            str += String(result.value);
          }
        }
        return data.string(str);
      } else if (value.type === "fncall") {
        let { arg, rest, value: ref } = value;
        let fn = ref.type === "ref" ? yield* env.eval(ref) : ref;
        if (fn.type !== "fn") {
          throw new Error(
            `${fn.value} is not a function. It is of type '${fn.type}'`,
          );
        }
        return yield* env.call(fn, arg, rest);
      } else if (value.type === "map") {
        let entries: [PSMapKey, PSValue][] = [];
        for (let [k, v] of value.value.entries()) {
          entries.push([k, yield* env.eval(v)]);
        }
        return { type: "map", value: new Map(entries) };
      } else if (value.type === "list") {
        let result: PSValue[] = [];
        for (let item of value.value) {
          result.push(yield* env.eval(item));
        }
        return data.list(result);
      } else {
        return value;
      }
    },
    *call(fn, arg, rest) {
      if (fn.value.type === "native") {
        return yield* fn.value.call({
          fn,
          arg,
          env,
          rest: rest ?? data.map({}),
        });
      } else {
        let binding = data.map({
          [fn.param.name]: arg,
        });
        return yield* env.eval(fn.value.body, binding);
      }
    },
  };

  return env;
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
    [
      {
        type: "string",
        value: "let",
      },
      data.fn(function* $let({ arg, env, rest }) {
        let bindings = letdo.getBindings({ type: "just", value: arg });
        let block = lookup("$do", rest);
        if (block.type == "just") {
          return yield* letdo.do(block.value, bindings, env);
        } else {
          return { type: "boolean", value: false };
        }
      }, { name: "bindings" }),
    ],

    [
      data.string("do"),
      data.fn(function* $do({ arg, env, rest }) {
        let bindings = letdo.getBindings(lookup("$let", rest));
        return yield* letdo.do(arg, bindings, env);
      }, { name: "block" }),
    ],
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
  } else if (value.type === "fn" && value.value.type === "platformscript") {
    let { body } = value.value;
    return {
      ...value,
      value: {
        type: "platformscript",
        body: strip(body),
      },
    };
  } else if (value.type === "fncall") {
    return {
      ...value,
      value: strip(value.value) as PSFn,
      arg: strip(value.arg),
    };
  } else {
    return value;
  }
}

// this is kinda cheesy. We should beef up this check.
function isPSValue(value: unknown): value is PSValue {
  if (value) {
    let check = value as PSValue;
    return [
      "number",
      "boolean",
      "string",
      "ref",
      "list",
      "map",
      "fn",
      "external",
    ].includes(check.type);
  } else {
    return false;
  }
}

function* bind(
  value: PSValue,
  scope: PSMap,
  mask: string[],
): Operation<PSValue> {
  if (value.type === "ref") {
    let { key, path } = value;

    if (mask.includes(key)) {
      return value;
    }

    let result = lookup(key, scope);
    if (result.type === "nothing") {
      throw new ReferenceError(`'${value.key}' not defined`);
    } else {
      if (path.length > 0) {
        if (result.value.type === "external" && result.value.view) {
          let deref = result.value.view(path, result.value.value);
          if (!deref) {
            throw new ReferenceError(
              `'${path.join(".")}' not found at ${key}`,
            );
          }
          if (!isPSValue(deref)) {
            throw new TypeError(
              `external reference '${value.value}' did not resolve to a platformscript value`,
            );
          }
          return deref;
        } else if (result.value.type === "map") {
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
                `cannot de-reference key ${segment} from '${current.type}'`,
              );
            }
          }, result.value as PSValue);
        } else {
          throw new TypeError(
            `${result.value.type} '$${key}' does not support path-like references`,
          );
        }
      } else {
        return result.value;
      }
    }
  } else if (value.type === "template") {
    let expressions: PSTemplate["expressions"] = [];

    for (let segment of value.expressions) {
      let expression = yield* bind(segment.expression, scope, mask);
      expressions.push({
        ...segment,
        expression: expression as PSLiteral,
      });
    }

    return { ...value, expressions };
  } else if (value.type === "list") {
    let result = [] as PSValue[];
    for (let item of value.value) {
      result.push(yield* bind(item, scope, mask));
    }
    return data.list(result);
  } else if (value.type === "map") {
    let entries = [...value.value.entries()];
    let [first, ...rest] = entries;

    if (!first) {
      //TODO: what is this for?
      return { type: "boolean", value: false };
    } else {
      let [key, value] = first;
      if (key.type === "ref") {
        let fn = mask.includes(key.key) ? key : yield* bind(key, scope, mask);
        if (fn.type !== "fn" && fn.type !== "ref") {
          throw new Error(
            `'${key.value}' is not a function, it is a ${fn.type}`,
          );
        }
        return {
          type: "fncall",
          value: fn,
          arg: yield* bind(value, scope, mask),
          rest: { type: "map", value: new Map(rest) },
        };
      } else {
        let $entries = [] as [PSMapKey, PSValue][];
        for (let [k, v] of entries) {
          $entries.push([k, yield* bind(v, scope, mask)]);
        }
        return {
          type: "map",
          value: new Map($entries),
        };
      }
    }
  } else if (value.type === "fn" && value.value.type === "platformscript") {
    let { param, value: { body } } = value;
    return {
      ...value,
      value: {
        type: "platformscript",
        body: yield* bind(body, scope, mask.concat(param.name)),
      },
    };
  } else {
    return value;
  }
}
