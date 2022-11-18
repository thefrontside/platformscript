import type { PSModule } from "../types.ts";
import type { Task } from "../deps.ts";

import { describe, expect, it, useStaticFileServer } from "./suite.ts";
import { load, ps2js } from "../mod.ts";
import { run } from "../deps.ts";
import { lookup, lookup$ } from "../psmap.ts";

describe("a PlatformScript module", () => {
  it("can be loaded from an absolute url", async () => {
    let mod = await loadmod("1.yaml");
    expect(mod.symbols).toBeDefined();
    expect(mod.symbols.type).toEqual("map");
    expect(ps2js(mod.value)).toEqual(1);
  });
  it("has a list of exported symbols", async () => {
    let mod = await loadmod("nodeps.yaml");
    let symbols = mod.symbols;

    expect(lookup$("five", symbols).value).toEqual(5);
    expect(lookup$("str", symbols).value).toEqual("world");
    expect(lookup$("id", symbols).type).toEqual("fn");
  });
  it("can load other modules from a relative url", async () => {
    let mod = await loadmod("imports-relative.yaml");
    expect(lookup$("myfive", mod.symbols).value).toEqual(5);
    expect(lookup$("hello", mod.symbols).value).toEqual("hello world");
  });

  it("does not import symbols that are not expliticly mapped", async () => {
    let mod = await loadmod("imports-relative.yaml");
    expect(lookup("str", mod.symbols).type).toEqual("nothing");
  });

  it("throws an error if the symbol does not exist in the source module", async () => {
    try {
      await loadmod("no-such-symbol.yaml");
      throw new Error("importing a symbol that does not exist should fail");
    } catch (error) {
      expect(error.message).toMatch(/does not define/);
    }
  });

  it("can support a `do` expression at the module level", async () => {
    let mod = await loadmod("do.yaml");
    expect(ps2js(mod.value)).toEqual("hello from do");
  });

  it("will be treated as the body of a 'do' expression if it is a bare list", async () => {
    let mod = await loadmod("list.yaml");
    expect(ps2js(mod.value)).toEqual("end-of-list");
  });

  it("can import from multiple different modules", async () => {
    let mod = await loadmod("multi-dep.yaml");
    expect(ps2js(mod.value)).toEqual([5, "hello world"]);
  });
  it("supports loading both from the network and from local file system", async () => {
    await run(function* () {
      let { hostname, port } = yield* useStaticFileServer("test/modules");
      let mod = yield* load({
        location: `http://${hostname}:${port}/multi-dep.yaml`,
      });
      expect(ps2js(mod.value)).toEqual([5, "hello world"]);
    });
  });
  // it("does not re-export symbols from other modules")
  // it("can remap names of imported symbols");
  // it("can load other modules from an absolute url");
  // it("can use imported symbols from another module");
  // it("can handle circular module references");
  // it("can be specified using WASM");
});

function loadmod(url: string): Task<PSModule> {
  return run(() =>
    load({
      location: new URL(`modules/${url}`, import.meta.url),
    })
  );
}
