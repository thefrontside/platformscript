import { PSMapEntry, PSMapKey, PSValue } from "./types.ts";

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
