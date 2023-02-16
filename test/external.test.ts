import { describe, expect, it } from "./suite.ts";
import { createPlatformScript, external, map, number, parse } from "../mod.ts";

import * as _ from "https://raw.githubusercontent.com/lodash/lodash/4.17.21-es/lodash.js";

describe("external", () => {
  it("can represent any arbitrary javascript value", async () => {
    let obj = { unqiue: "object" };
    let binding = map({
      "extern": external(obj),
    });

    let ps = createPlatformScript();
    expect((await ps.eval(parse("$extern"), binding)).value).toBe(obj);
  });

  it("can define new PS values from the external value", async () => {
    let obj = { I: { contain: { the: { number: number(5) } } } };
    let binding = map({
      "truly": external(obj, (path, o) => _.get(o, path)),
    });
    let ps = createPlatformScript();

    let program = parse("$truly.I.contain.the.number");
    expect((await ps.eval(program, binding)).value).toEqual(5);
  });
  it("errors if a dereference is undefined", async () => {
    let binding = map({
      "oops": external({}, () => void 0),
    });
    let ps = createPlatformScript();

    await expect(ps.eval(parse("$oops.i.did.it.again"), binding)).rejects
      .toHaveProperty("name", "ReferenceError");
  });
  it("errors if a derefenence does not return a PSValue", async () => {
    let binding = map({
      "oops": external(
        { wrong: "type" },
        //@ts-expect-error situation could happen if you are using JavaScript...
        () => ({ type: "WAT!!", value: "hi" }),
      ),
    });
    let ps = createPlatformScript();
    await expect(ps.eval(parse("$oops.wrong"), binding)).rejects.toHaveProperty(
      "name",
      "TypeError",
    );
  });
  // it("can handle an exception that happens during dereference");
});
