import type {
  YAMLMapping,
  YAMLNode,
  YAMLScalar,
  YAMLSequence,
} from "./deps.ts";
import {
  PSLiteral,
  PSMapEntry,
  PSMapKey,
  PSTemplate,
  PSValue,
} from "./types.ts";

import { parseYAML } from "./deps.ts";

/**
 * Convert a JavaScript value into a PlatformScript value
 */
export function js2ps(value: unknown): PSValue {
  let type = typeof value;
  if (type === "number") {
    return { type, value: value as number };
  } else if (type === "boolean") {
    return { type, value: value as boolean };
  } else if (type === "string") {
    return { type, value: value as string };
  } else if (type === "object") {
    if (Array.isArray(value)) {
      return { type: "list", value: value.map(js2ps) };
    } else {
      if (typeof value === "undefined") {
        throw new Error(
          `'undefined' cannot be converted into a PlatformScript value`,
        );
      }
      let record = value as Record<string, unknown>;
      return {
        type: "map",
        value: new Map(
          Object.keys(record).flatMap((key) => {
            if (typeof key === "string") {
              let pskey: PSMapKey = { type: "string", value: key };
              let entry: PSMapEntry = [pskey, js2ps(record[key])];
              return [entry];
            } else {
              return [];
            }
          }),
        ),
      };
    }
  } else {
    throw new Error(
      `cannot convert JavaScript value: '${value}' into PlatformScript`,
    );
  }
}

/**
 * Convert a PlatformScript value into a JavaScript value
 */
export function ps2js(value: PSValue): unknown {
  switch (value.type) {
    case "list":
      return value.value.map(ps2js);
    case "map":
      return [...value.value.entries()].reduce((obj, [k, v]) => {
        return Object.assign(obj, { [k.value.toString()]: ps2js(v) });
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
export function yaml2ps(node: YAMLNode): PSLiteral<PSValue> {
  if (node.kind === 0) { // String, Number, Boolean
    let scalar = node as YAMLScalar;
    if (
      scalar.singleQuoted || scalar.doubleQuoted ||
      typeof scalar.valueObject === "undefined"
    ) {
      let expressions = matchTemplate(scalar.value);
      if (expressions.length > 0) {
        return createLiteral({
          type: "template",
          value: scalar.value,
          expressions,
        }, node);
      }
      let match = matchReference(scalar.value);
      if (match) {
        return createLiteral({
          type: "ref",
          value: scalar.value,
          key: match.key,
          path: match.path,
        }, node);
      }
      return createLiteral({
        type: "string",
        value: scalar.value,
      }, node);
    } else {
      let value = scalar.valueObject;
      let type = typeof scalar.valueObject;
      if (!["number", "boolean"].includes(type)) {
        throw new Error(`unknown scalar type: ${type}`);
      }
      return createLiteral({ type: type as "number" | "boolean", value }, node);
    }
  } else if (node.kind === 2) { // Map
    let mappings: YAMLMapping[] = node.mappings ?? [];
    let [first] = mappings;
    if (!first) {
      return { type: "map", value: new Map(), node };
    } else {
      let fnmatch = first.key.value.match(/^\$\s*\((.*)\)\s*$/);
      if (fnmatch) {
        let param = fnmatch[1];
        let body = yaml2ps(first.value);
        return createLiteral({
          type: "fn",
          param: { name: param },
          value: {
            type: "platformscript",
            body,
          },
        }, node);
      } else {
        return createLiteral({
          type: "map",
          value: new Map(mappings.map((m) => {
            let key = yaml2ps(m.key) as PSMapKey;
            let value = yaml2ps(m.value);
            return [key, value];
          })),
        }, node);
      }
    }
  } else if (node.kind === 3) { // List
    let list = node as YAMLSequence;
    return createLiteral({
      type: "list",
      value: list.items.map(yaml2ps),
    }, node);
  } else {
    console.dir({ node }, { depth: 10 });
    throw new Error(`unknown YAMLNode of kind ${node.kind}`);
  }
}

function matchTemplate(value: string) {
  let valueIdx = 0;
  let exprIdx = 1;
  let regex = /%\(([\s\S]+?)\)/gmd;
  let i = value.matchAll(regex);

  let expressions: PSTemplate["expressions"] = [];

  for (let next = i.next(); !next.done; next = i.next()) {
    let match = next.value;
    let expression = yaml2ps(parseYAML(match[exprIdx]));

    expressions.push({
      expression,

      //@ts-expect-error RegExpMatchArray#indices not yet in the default TS lib
      range: match.indices[valueIdx],
    });
  }
  return expressions;
}

function matchReference(value: string) {
  let pathIdx = 1;
  let match = value.match(/^\$(\S+)$/);

  if (match) {
    let [key, ...path] = match[pathIdx].split(".");
    return {
      key,
      path,
    };
  }
}

function createLiteral(value: PSValue, node: YAMLNode): PSLiteral {
  return Object.defineProperty(value, "node", {
    enumerable: false,
    value: node,
  }) as PSLiteral;
}
