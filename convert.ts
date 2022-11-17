import type {
  YAMLMapping,
  YAMLNode,
  YAMLScalar,
  YAMLSequence,
} from "./deps.ts";
import {
  PSLiteral,
  PSMap,
  PSMapEntry,
  PSMapKey,
  PSRef,
  PSString,
  PSValue,
} from "./types.ts";

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
    return { type, value: value as string, holes: [] };
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
              let pskey: PSMapKey = { type: "string", value: key, holes: [] };
              let entry: PSMapEntry = [pskey, js2ps(record[key])];
              return [entry];
            } else {
              return [];
            }
          }),
        ),
      };
    }
  } else if (type === "function") {
    let fn = value as (x: unknown) => unknown;
    return {
      type: "fn",
      *value({ arg }) {
        return js2ps(fn(ps2js(arg)));
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
export function ps2js(value: PSValue): unknown {
  switch (value.type) {
    case "list":
      return value.value.map(ps2js);
    case "map":
      return [...value.value.entries()].reduce((obj, [k, v]) => {
        return Object.assign(obj, { [k.value.toString()]: v });
      }, {});
    case "fn":
      throw new Error("TODO: convert PlatformScript fn into callable JS fn");
    case "ref":
      throw new Error("TODO: de-reference YS references when converting to JS");
    default:
      return value.value;
  }
}

export interface RefHole {
  ref: PSRef;
  range: [number, number];
}

export interface RefMatch {
  // is the string nothing but a reference
  total: boolean;

  // the places that must be filled in to the matched string
  holes: RefHole[];
}

export function matchRefs(value: string): RefMatch {
  let valueIdx = 0;
  let pathIdx = 1;
  let keyIdx = 2;
  let regex = /\$(([\w\d-]+)(\.[\w\d-]+)*)/gmd;
  let i = value.matchAll(regex);
  let holes: RefHole[] = [];
  for (let next = i.next(); !next.done; next = i.next()) {
    let match = next.value;
    let ref = {
      type: "ref",
      value: match[valueIdx],
      key: match[keyIdx],
      path: match[pathIdx].split("."),
    };

    //@ts-expect-error RegExpMatchArray#indices not yet in the default TS lib
    holes.push({ ref, range: match.indices[valueIdx] });
  }
  return {
    total: holes.length === 1 && holes[0].ref.value === value,
    holes,
  };
}

/**
 * Convert source YAML into a PlatformScript Literal
 */
export function yaml2ps(node: YAMLNode): PSLiteral<PSValue> {
  if (node.kind === 0) {
    let scalar = node as YAMLScalar;
    if (scalar.singleQuoted) {
      return {
        type: "string",
        node,
        value: scalar.value,
        holes: [],
      };
    } else if (scalar.doubleQuoted) {
      return {
        type: "string",
        node,
        value: scalar.value,
        holes: matchRefs(scalar.value).holes,
      };
    } else if (typeof scalar.valueObject !== "undefined") {
      let value = scalar.valueObject;
      let type = typeof scalar.valueObject;
      if (!["number", "boolean"].includes(type)) {
        throw new Error(`unknown scalar type: ${type}`);
      }
      return { type: type as "number" | "boolean", value, node };
    } else {
      let match = matchRefs(scalar.value);
      if (match.total) {
        return {
          ...match.holes[0].ref,
          node,
        };
      } else {
        return {
          type: "string",
          node,
          value: scalar.value,
          holes: match.holes,
        };
      }
    }
  } else if (node.kind === 2) {
    let mappings: YAMLMapping[] = node.mappings ?? [];
    let [first] = mappings;
    if (!first) {
      return { type: "map", value: new Map(), node };
    } else {
      let fnmatch = first.key.value.match(/^\$\s*\((.*)\)\s*$/);
      if (fnmatch) {
        let params = fnmatch[1];
        let body = yaml2ps(first.value);
        return {
          type: "fn",
          node,
          *value({ arg, env }) {
            let key: PSLiteral<PSString> = {
              type: "string",
              node: first.key,
              value: params,
              holes: [],
            };
            let binding: PSMap = {
              type: "map",
              value: new Map([[key, yield* env.eval(arg)]]),
            };
            return yield* env.eval(body, binding);
          },
        };
      } else {
        return {
          type: "map",
          node,
          value: new Map(mappings.map((m) => {
            let key = yaml2ps(m.key) as PSMapKey;
            let value = yaml2ps(m.value);
            return [key, value];
          })),
        };
      }
    }
  } else if (node.kind === 3) {
    let list = node as YAMLSequence;
    return {
      type: "list",
      node,
      value: list.items.map(yaml2ps),
    };
  } else {
    console.dir({ node }, { depth: 10 });
    throw new Error(`unknown YAMLNode of kind ${node.kind}`);
  }
}
