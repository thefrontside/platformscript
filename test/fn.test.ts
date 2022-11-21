import { assert, describe, expect, it } from "./suite.ts";
import * as ps from "../mod.ts";

describe("fn", () => {
  it("can be called directly", async () => {
    let interp = ps.createPlatformScript();
    let program = interp.parse("$(thing): Hello %($thing)!");
    let fn = await interp.eval(program);
    assert(fn.type === "fn");
    expect(
      (await interp.call(fn, {
        arg: ps.string("World"),
        rest: ps.map({}),
        env: ps.createYSEnv(),
      })).value,
    ).toEqual("Hello World!");
  });
});
