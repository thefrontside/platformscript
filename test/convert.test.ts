import { describe, expect, it } from "./suite.ts";
import { parse } from "../mod.ts";
import type { PSFn } from "../types.ts";

describe("function literal", () => {
  it("is defined as a mapping", () => {
    let fn = parse("(x)=>: $x") as PSFn;
    expect(fn.type).toEqual("fn");
    expect(fn.param.name).toEqual("x");
  });
});
