import { describe, expect, it } from "./suite.ts";
import { createPlatformScript, external, map, number } from "../mod.ts";

import * as _ from "https://raw.githubusercontent.com/lodash/lodash/4.17.21-es/lodash.js";

describe("external", () => {
  it("can represent any arbitrary javascript value", async () => {
    let obj = { unqiue: "object" };
    let ps = createPlatformScript(map({
      "extern": external(obj),
    }));
    expect((await ps.eval(ps.parse("$extern"))).value).toBe(obj);
  });

  it("can define new PS values from the external value", async () => {
    let obj = { I: { contain: { the: { number: number(5) } } } };
    let ps = createPlatformScript(map({
      "truly": external(obj, (path, o) => _.get(o, path)),
    }));

    let program = ps.parse("$truly.I.contain.the.number");
    expect((await ps.eval(program)).value).toEqual(5);
  });
  it("errors if a dereference is undefined", async () => {
    let ps = createPlatformScript(map({
      "oops": external({}, () => void 0),
    }));
    try {
      await ps.eval(ps.parse("$oops.i.did.it.again"));
      throw new Error("expected block to throw, but it did not");
    } catch (error) {
      expect(error.name).toEqual("ReferenceError");
    }
  });
  it("errors if a derefenence does not return a PSValue", async () => {
    let ps = createPlatformScript(map({
      "oops": external(
        { wrong: "type" },
        //@ts-expect-error situation could happen if you are using JavaScript...
        () => ({ type: "WAT!!", value: "hi" }),
      ),
    }));

    try {
      await ps.eval(ps.parse("$oops.wrong"));
      throw new Error("expected block to throw, but it did not");
    } catch (error) {
      expect(error.message).toMatch(
        /did not resolve to a platformscript value/,
      );
      expect(error.name).toEqual("TypeError");
    }
  });
  // it("can handle an exception that happens during dereference");
});
