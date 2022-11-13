import type { YSModule } from "../types.ts";
import type { Task } from "../deps.ts";

import { describe, expect, it, useStaticFileServer } from "./suite.ts";
import { evaluate, load, ys2js } from "../mod.ts";
import { run } from "../deps.ts";

describe("a PlatformScript module", () => {
  it("can be loaded from an absolute url", async () => {
    let mod = await loadmod("1.yaml");
    expect(mod.symbols).toBeDefined();
    expect(mod.symbols.type).toEqual("map");
    expect(ys2js(mod.value)).toEqual(1);
  });
  it("has a list of exported symbols", async () => {
    let mod = await loadmod("nodeps.yaml");
    let symbols = mod.symbols;

    expect(ys2js(symbols.value.five)).toEqual(5);
    expect(symbols.value.id.type).toEqual("fn");
  });
  it("can load other modules from a relative url", async () => {
    let mod = await loadmod("imports-relative.yaml");
    expect(mod.symbols.value.five.type).toEqual("number");

    expect(ys2js(mod.symbols.value.five)).toEqual(5);
    expect(mod.symbols.value.hello.type).toEqual("string");

    expect(ys2js(mod.symbols.value.hello)).toEqual("hello world");
  });

  it("does not import symbols that are not expliticly mapped", async () => {
    let mod = await loadmod("imports-relative.yaml");
    expect(mod.symbols.value.str).not.toBeDefined();
  });

  it("throws an error if the symbol does not exist in the source module", async () => {
    try {
      await loadmod("no-such-symbol.yaml");
      throw new Error("importing a symbol that does not exist should fail");
    } catch (error) {
      expect(error.message).toMatch(/does not define/);
    }
  });

  it("can be specified using a TypeScript module", async () => {
    let mod = await loadmod("module.yaml.ts");
    let result = await evaluate(`{to-string: 100 }`, { context: mod.symbols });
    expect(result).toEqual({ type: "string", value: "100" });
  });

  it("can support a `do` expression at the module level", async () => {
    let mod = await loadmod("do.yaml");
    expect(ys2js(mod.value)).toEqual("hello from do");
  });

  it("will be treated as the body of a 'do' expression if it is a bare list", async () => {
    let mod = await loadmod("list.yaml");
    expect(ys2js(mod.value)).toEqual("end-of-list");
  });

  it("can import from multiple different modules", async () => {
    let mod = await loadmod("multi-dep.yaml");
    expect(ys2js(mod.value)).toEqual([5, "hello world"]);
  });
  it("supports loading both from the network and from local file system", async () => {
    await run(function* () {
      let { hostname, port } = yield* useStaticFileServer("test/modules");
      let mod = yield* load(`http://${hostname}:${port}/multi-dep.yaml`);
      expect(ys2js(mod.value)).toEqual([5, "hello world"]);
    });
  });
  // it("can remap names of imported symbols");
  // it("can load other modules from an absolute url");
  // it("can use imported symbols from another module");
  // it("can handle circular module references");
  // it("can be specified using WASM");
});

function loadmod(url: string): Task<YSModule> {
  return run(() => load(new URL(`modules/${url}`, import.meta.url)));
}
