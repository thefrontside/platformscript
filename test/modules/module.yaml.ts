import type { PSFn, PSMap, PSString, PSValue } from "../../mod.ts";

function ys2string(value: PSValue): PSString {
  switch (value.type) {
    case "string":
      return value;
    case "boolean":
      return {
        type: "string",
        value: String(value.value),
        holes: [],
      };
    case "number":
      return {
        type: "string",
        value: String(value.value),
        holes: [],
      };
    case "list": {
      let elements = value.value.map((v) => ys2string(v).value);
      return {
        type: "string",
        value: `[${elements.join(",")}]`,
        holes: [],
      };
    }
    case "map": {
      let pairs = Object.entries(value.value).map(([k, v]) =>
        `${k}: ${ys2string(v).value}`
      );
      return {
        type: "string",
        value: `{${pairs.join(",")}}`,
        holes: [],
      };
    }
    case "ref":
      return {
        type: "string",
        value: `^${value.key}`,
        holes: [],
      };
    case "fn":
      return {
        type: "string",
        value: `[fn]`,
        holes: [],
      };
  }
}

export default {
  type: "map",
  value: new Map([[
    { type: "string", value: "to-string", holes: [] },
    {
      type: "fn",
      *value({ arg, env }) {
        let $arg = yield* env.eval(arg);
        return ys2string($arg);
      },
    } as PSFn,
  ]]),
} as PSMap;
