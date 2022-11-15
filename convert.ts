import type {
  YAMLMapping,
  YAMLNode,
  YAMLScalar,
  YAMLSequence,
} from "./deps.ts";
import { PSFn, PSList, PSLiteral, PSMap, PSValue } from "./types.ts";

/**
 * Convert a JavaScript value into a PlatformScript value
 */
export function js2ys(value: unknown): PSValue {
  let type = typeof value;
  if (type === "number") {
    return { type, value: value as number };
  } else if (type === "boolean") {
    return { type, value: value as boolean };
  } else if (type === "string") {
    return { type, value: value as string };
  } else if (type === "object") {
    if (Array.isArray(value)) {
      return { type: "list", value: value.map(js2ys) };
    } else {
      if (typeof value === "undefined") {
        throw new Error(
          `'undefined' cannot be converted into a PlatformScript value`,
        );
      }
      let record = value as Record<string, unknown>;
      return {
        type: "map",
        value: Object.keys(record).reduce((map, key) => {
          if (typeof key === "string") {
            return Object.assign(map, {
              [key]: js2ys(record[key]),
            });
          } else {
            return map;
          }
        }, {} as Record<string, PSValue>),
      };
    }
  } else if (type === "function") {
    let fn = value as (x: unknown) => unknown;
    return {
      type: "fn",
      *value({ arg }) {
        return js2ys(fn(ys2js(arg)));
      },
    };
  } else {
    throw new Error(
      `cannot convert JavaScript value: '${value}' into PlatformScript`,
    );
  }
}

/**
 * Convert a PlatformScript value into a JavaScript value
 */
export function ys2js(value: PSValue): unknown {
  switch (value.type) {
    case "list":
      return value.value.map(ys2js);
    case "map":
      return Object.keys(value.value).reduce((obj, key) => {
        return Object.assign(obj, {
          [key]: value.value[key],
        });
      }, {});
    case "fn":
      throw new Error("TODO: convert PlatformScript fn into callable JS fn");
    case "ref":
      throw new Error("TODO: de-reference YS references when converting to JS");
    default:
      return value.value;
  }
}

/**
 * Convert source YAML into a PlatformScript Literal
 */
export function yaml2ys(node: YAMLNode): PSLiteral<PSValue> {
  if (node.kind === 0) {
    let scalar = node as YAMLScalar;
    if (scalar.doubleQuoted || scalar.singleQuoted) {
      return {
        type: "string",
        node,
        value: scalar.value,
      };
    } else if (typeof scalar.valueObject !== "undefined") {
      let value = scalar.valueObject;
      let type = typeof scalar.valueObject;
      if (!["number", "boolean"].includes(type)) {
        throw new Error(`unknown scalar type: ${type}`);
      }
      return { type: type as "number" | "boolean", value, node };
    } else {
      let [key, ...path] = scalar.value.split(".").map((s) => s.trim());
      return {
        type: "ref",
        spec: scalar.value,
        key,
        path,
        node,
      };
    }
  } else if (node.kind === 2) {
    let mappings = node.mappings as YAMLMapping[];
    return {
      type: "map",
      node,
      value: mappings.reduce((value, mapping) => {
        let sym = yaml2ys(mapping.key);
        if (sym.type !== "ref") {
          throw new Error(
            `invalid map key: ${sym}, expected string, but was be string maybe revisit this.`,
          );
        }
        if (sym.key.match(/\(/)) {
          let match = sym.key.match(/^(.+)\((.*)\)/);
          if (match) {
            let name = match[1].trim();
            let param = match[2].trim();
            let destructured = param.split(",").map((s) => s.trim());
            let body = yaml2ys(mapping.value);

            return Object.assign(value, {
              [name]: {
                type: "fn",
                *value({ arg, env }) {
                  if (destructured.length > 1) {
                    if (arg.type === "list") {
                      if (destructured.length > arg.value.length) {
                        throw new Error(
                          `argument list must have at least ${destructured.length} elements`,
                        );
                      }
                      let args = (yield* env.eval(arg)) as PSList;
                      let binding: PSMap = {
                        type: "map",
                        value: destructured.reduce((map, name, i) => {
                          let item = args.value[i];
                          return Object.assign(map, {
                            [name]: item,
                          });
                        }, {}),
                      };
                      return yield* env.eval(body, binding);
                    } else {
                      throw new Error(
                        `cannot destructure function argument into (${
                          destructured.join(", ")
                        }). Must be a list, but was '${arg.type}'`,
                      );
                    }
                  } else {
                    let binding: PSMap = {
                      type: "map",
                      value: { [param]: yield* env.eval(arg) },
                    };
                    return yield* env.eval(body, binding);
                  }
                },
              } as PSFn,
            });
          } else {
            throw new SyntaxError(`invalid function declaration: ${sym.key}`);
          }
        } else {
          return Object.assign(value, {
            [sym.key]: yaml2ys(mapping.value),
          });
        }
      }, {} as Record<string, PSValue>),
    };
  } else if (node.kind === 3) {
    let list = node as YAMLSequence;
    return {
      type: "list",
      node,
      value: list.items.map(yaml2ys),
    };
  } else {
    console.dir({ node }, { depth: 10 });
    throw new Error(`unknown YAMLNode of kind ${node.kind}`);
  }
}
