import { describe, expect, it } from "./suite.ts";
import { parse, PSLiteral, PSMap } from "../mod.ts";

describe("function literal", () => {
  it("can be defined in a map", () => {
    let map = parse("id(x): x") as PSLiteral<PSMap>;
    let fn = map.value.id;
    expect(fn).toBeDefined();
    expect(fn.type).toEqual("fn");
  });
});
