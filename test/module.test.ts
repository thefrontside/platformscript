import type { PSMap, PSModule } from "../types.ts";
import type { Task } from "../deps.ts";

import { describe, expect, it, useStaticFileServer } from "./suite.ts";
import { load, moduleEval, number, parse, ps2js, string } from "../mod.ts";
import { run } from "../deps.ts";
import { lookup, lookup$ } from "../psmap.ts";

describe("a PlatformScript module", () => {
  it("can be loaded from an absolute url", async () => {
    let mod = await loadmod("1.yaml");
    expect(mod.value).toEqual(number(1));
  });
  it("has a list of exported symbols", async () => {
    let mod = await loadmod("nodeps.yaml");
    let symbols = mod.value as PSMap;

    expect(lookup$("five", symbols).value).toEqual(5);
    expect(lookup$("str", symbols).value).toEqual("world");
    expect(lookup$("id", symbols).type).toEqual("fn");
  });
  it("can load other modules from a relative url", async () => {
    let mod = await loadmod("imports-relative.yaml");
    expect(lookup$("myfive", mod.value).value).toEqual(5);
    expect(lookup$("hello", mod.value).value).toEqual("hello world");
  });

  it("does not import symbols that are not expliticly mapped", async () => {
    let mod = await loadmod("imports-relative.yaml");
    expect(lookup("str", mod.value).type).toEqual("nothing");
  });

  it("throws an error if the symbol does not exist in the source module", async () => {
    try {
      await loadmod("no-such-symbol.yaml");
      throw new Error("importing a symbol that does not exist should fail");
    } catch (error) {
      expect(error.message).toMatch(/does not have a member/);
    }
  });

  it("can evalute single value expression at the module level", async () => {
    let mod = await loadmod("do.yaml");
    expect(ps2js(mod.value)).toEqual("hello from module");
  });

  it("will be treated as the body of a 'do' expression if it is a bare list", async () => {
    let mod = await loadmod("list.yaml");
    expect(ps2js(mod.value)).toEqual([3, 2, 1, "end-of-list"]);
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

  it("supports splat to alias an entire module", async () => {
    await run(function* () {
      let source = parse(`
$import:
  nodeps<<, id: nodeps.yaml
$id: $nodeps
`);
      let mod = yield* moduleEval({
        source,
        location: new URL(`modules/virtual-module.yaml`, import.meta.url),
      });
      expect(lookup$("five", mod.value)).toEqual(number(5));
      expect(lookup$("str", mod.value)).toEqual(string("world"));
      expect(lookup$("id", mod.value).type).toEqual("fn");
    });
  });
  it.ignore("can re-alias names to local names", () => {});
  it.ignore("is an error to alias a property in a non-map module", () => {});

  // it("can handle circular module references");
  // it("can be specified using WASM");

  it("supports evaluating a module directly without loading it from a url", async () => {
    await run(function* () {
      let source = parse(`
$import:
  five: nodeps.yaml
myfive: $five
main: $myfive
`);
      let mod = yield* moduleEval({
        source,
        location: new URL(`modules/virtual-module.yaml`, import.meta.url),
      });
      expect(lookup$("main", mod.value)).toEqual(number(5));
    });
  });
});

function loadmod(url: string): Task<PSModule> {
  return run(() =>
    load({
      location: new URL(`modules/${url}`, import.meta.url),
    })
  );
}
