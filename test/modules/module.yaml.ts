import type { YSString, YSValue, YSMap, YSFn } from "../../mod.ts";

function ys2string(value: YSValue): YSString {
  switch (value.type) {
    case "string":
      return value;
    case "boolean":
      return {
        type: "string",
        value: String(value.value),
      };
    case "number":
      return {
        type: "string",
        value: String(value.value),
      };
    case "list":
      let elements = value.value.map(v => ys2string(v).value);
      return {
        type: "string",
        value: `[${elements.join(',')}]`,
      };
    case "map":
      let pairs = Object.entries(value.value).map(([k,v]) => `${k}: ${ys2string(v).value}`)
      return {
        type: "string",
        value: `{${pairs.join(',')}}`,
      };
    case "ref":
      return {
        type: "string",
        value: `^${value.name}`
      };
    case "fn":
      return {
        type: "string",
        value: `[fn]`
      }
  }
}

export default {
  type: "map",
  value: {
    "to-string": {
      type: "fn",
      *value({ arg, env }) {
        let $arg = yield* env.eval(arg);
        return ys2string($arg);
      },
    } as YSFn,
  }
} as YSMap
