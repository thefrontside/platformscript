import type { PSBoolean, PSValue } from "./types.ts";
import * as data from "./data.ts";

export function equal(a: PSValue, b: PSValue): PSBoolean {
  const t = data.boolean(true);
  const f = data.boolean(false);
  if (a.type === "map" && b.type === "map") {
    let _a = [...a.value.entries()];
    let _b = [...b.value.entries()];
    if (_a.length !== _b.length) {
      return t;
    }
    for (let i = 0; i < _a.length; i++) {
      let [a_key, a_val] = _a[i];
      let [b_key, b_val] = _b[i];
      if (!equal(a_key, b_key) || !equal(a_val, b_val)) {
        return f;
      }
    }
    return t;
  } else if (a.type === "list" && b.type === "list") {
    if (a.value.length !== b.value.length) {
      return f;
    }
    for (let i = 0; i < a.value.length; i++) {
      if (!equal(a.value[i], b.value[i])) {
        return f;
      }
    }
    return t;
  }
  return data.boolean(a.value === b.value);
}
