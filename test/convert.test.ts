import { describe, it, expect } from './suite.ts';
import { parse, YSMap, YSLiteral } from "../mod.ts";

describe("function literal", () => {
  it("can be defined in a map", () => {
    let map = parse("id(x): x") as YSLiteral<YSMap>;
    let fn = map.value.id;
    expect(fn).toBeDefined();
    expect(fn.type).toEqual("fn");
  });
})
