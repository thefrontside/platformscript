import { assert, describe, expect, it } from "./suite.ts";
import * as ps from "../mod.ts";

describe("fn", () => {
  it("can be called directly", async () => {
    let interp = ps.createPlatformScript();
    let program = ps.parse("$(thing): Hello %($thing)!");
    let fn = await interp.eval(program);
    assert(fn.type === "fn");
    expect(
      (await interp.call(fn, ps.string("World"))).value,
    ).toEqual("Hello World!");
  });
});
