import type { YAMLNode, YAMLScalar, YAMLMapping, YAMLSequence } from "./deps.ts";
import { YSLiteral, YSValue } from "./types.ts";

/**
 * Convert a JavaScript value into a YAMLScript value
 */
export function js2ys(value: unknown): YSValue {
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
          `'undefined' cannot be converted into a YAMLScript value`,
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
        }, {} as Record<string, YSValue>),
      };
    }
  } else if (type === "function") {
    let fn = value as (x: unknown) => unknown;
    return {
      type: "fn",
      *value({arg}) {
        return js2ys(fn(ys2js(arg)));
      },
    };
  } else {
    throw new Error(
      `cannot convert JavaScript value: '${value}' into YAMLScript`,
    );
  }
}

/**
 * Convert a YAMLScript value into a JavaScript value
 */
export function ys2js(value: YSValue): unknown {
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
      throw new Error("TODO: convert YAMLScript fn into callable JS fn");
    case "ref":
      throw new Error("TODO: de-reference YS references when converting to JS");
    default:
      return value.value;
  }
}

/**
 * Convert source YAML into a YAMLScript Literal
 */
export function yaml2ys(node: YAMLNode): YSLiteral<YSValue> {
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
      return {
        type: "ref",
        name: scalar.value,
        path: scalar.value.split(".").map((s) => s.trim()) as [string, ...string[]],
        node,
      };
    }
  } else if (node.kind === 2) {
    let mappings = node.mappings as YAMLMapping[];
    return {
      type: "map",
      node,
      value: mappings.reduce((value, mapping) => {
        let key = yaml2ys(mapping.key);
        if (key.type !== 'ref') {
          throw new Error(`invalid map key: ${key}, expected string, but was be string maybe revisit this.`);
        }

        return Object.assign(value, {
          [key.name]: yaml2ys(mapping.value),
        })
      },{} as Record<string, YSValue>)
    }
  } else if (node.kind === 3) {
    let list = node as YAMLSequence;
    return {
      type: "list",
      node,
      value: list.items.map(yaml2ys),
    }
  } else {
    console.dir({ node }, { depth: 10 });
    throw new Error(`unknown YAMLNode of kind ${node.kind}`);
  }
}
