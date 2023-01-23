import { describe, expect, it } from "./suite.ts";
import { read } from "../mod.ts";
import { recognize } from "../recognize.ts";
import type { PSFn } from "../types.ts";

describe("function literal", () => {
  it("is defined as a mapping", () => {
    let fn = recognize(read("(x)=>: $x")) as PSFn;
    expect(fn.type).toEqual("fn");
    expect(fn.param.name).toEqual("x");
  });
});
