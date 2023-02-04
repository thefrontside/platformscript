import type { PSMap, PSMapKey, PSValue } from "./types.ts";
import type { Operation } from "./deps.ts";

export function createPSMap(): PSMap {
  return {
    type: "map",
    value: new Map(),
  };
}

export function concat(parent: PSMap, child: PSMap): PSMap {
  return {
    type: "map",
    value: new Map([...parent.value.entries(), ...child.value.entries()]),
  };
}

export function* map(
  fntor: PSMap,
  fn: (value: PSValue) => Operation<PSValue>,
): Operation<PSMap> {
  let entries: [PSMapKey, PSValue][] = [];
  for (let [k, v] of fntor.value.entries()) {
    entries.push([k, yield* fn(v)]);
  }

  return { type: "map", value: new Map(entries) };
}

export type Maybe<T> =
  | {
    type: "just";
    value: T;
  }
  | {
    type: "nothing";
    value: void;
  };

export function lookup(
  key: string | number | boolean,
  map: PSValue,
): Maybe<PSValue> {
  if (map.type !== "map") {
    return { type: "nothing", value: void 0 };
  }
  for (let entry of map.value.entries()) {
    let [k, value] = entry;
    if (k.value === key) {
      return { type: "just", value };
    }
  }
  return { type: "nothing", value: void 0 };
}

export function lookup$(key: string, map: PSValue): PSValue {
  if (map.type !== "map") {
    throw new Error(`cannot lookup a value from non-map type '${map.type}'`);
  }
  let maybe = lookup(key, map);
  if (maybe.type === "nothing") {
    throw new Error(`expected map to contain key '${key}', but it did not`);
  }
  return maybe.value;
}

export function exclude(keys: string[], map: PSMap): PSMap {
  return {
    type: "map",
    value: new Map({
      *[Symbol.iterator]() {
        for (let [key, value] of map.value.entries()) {
          if (!keys.includes(key.value.toString())) {
            yield [key, value];
          }
        }
      },
    }),
  };
}
