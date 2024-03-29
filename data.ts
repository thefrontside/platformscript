import type {
  PSBoolean,
  PSExternal,
  PSFn,
  PSFnCallContext,
  PSList,
  PSMap,
  PSNumber,
  PSRef,
  PSString,
  PSValue,
} from "./types.ts";
import type { Operation } from "./deps.ts";

export function number(value: number): PSNumber {
  return { type: "number", value };
}

export function boolean(value: boolean): PSBoolean {
  return { type: "boolean", value };
}

export function string(value: string): PSString {
  return { type: "string", value };
}

export function ref(key: string, path: string[]): PSRef {
  return {
    type: "ref",
    value: string(`$${[key].concat(path).join(".")}`),
    key,
    path,
  };
}

export function list(value: PSValue[]): PSList {
  return { type: "list", value };
}

export function map(value: Record<string, PSValue>): PSMap {
  return {
    type: "map",
    value: new Map(
      Object.entries(value).map(([k, v]) => {
        return [string(k), v];
      }),
    ),
  };
}

export function external(
  value: unknown,
  view?: PSExternal["view"],
): PSExternal {
  return { type: "external", value, view };
}

export function fn(
  call: (cxt: PSFnCallContext) => Operation<PSValue>,
  param: PSFn["param"],
): PSFn {
  return {
    type: "fn",
    param,
    value: {
      type: "native",
      call,
    },
  };
}
