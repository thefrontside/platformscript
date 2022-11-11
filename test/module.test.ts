import { describe, it, expect } from './suite.ts';
import { load, ys2js } from "../mod.ts";
import { run } from "../deps.ts";

const base = `${import.meta.url}`;

const urls = {
  one: new URL("modules/1.yaml", base),
  empty: new URL("modules/empty.yaml", base),
  nodeps: new URL("modules/nodeps.yaml", base),
  importsRelative: new URL("modules/imports-relative.yaml", base),
  importsAbsolute: new URL("modules/imports-absolute.yaml", base),
  noSuchSymbol: new URL("modules/no-such-symbol.yaml", base),
};

describe("a YAMLSCript module", () => {
  it("can be loaded from an absolute url", async () => {
    let mod = await run(() => load(urls.one));
    expect(mod.symbols).toBeDefined();
    expect(mod.symbols.type).toEqual("map");
  });
  it("has a list of exported symbols", async () => {
    let mod = await run(() => load(urls.nodeps));
    let symbols = mod.symbols;

    expect(ys2js(symbols.value.five)).toEqual(5);
    expect(symbols.value.id.type).toEqual("fn");
  });
  it("can load other modules from a relative url", async () => {
    let mod = await run(() => load(urls.importsRelative));
    expect(mod.symbols.value.five.type).toEqual("number");

    expect(ys2js(mod.symbols.value.five)).toEqual(5);
    expect(mod.symbols.value.hello.type).toEqual("string");

    expect(ys2js(mod.symbols.value.hello)).toEqual("hello world");
  });

  it("does not import symbols that are not expliticly mapped", async () => {
    let mod = await run(() => load(urls.importsRelative));
    expect(mod.symbols.value.str).not.toBeDefined();
  });

  it("throws an error if the symbol does not exist in the source module", async ()=> {
    try {
      await run(() => load(urls.noSuchSymbol));
      throw new Error('importing a symbol that does not exist should fail');
    } catch (error) {
      expect(error.message).toMatch(/does not define/);
    }
  });
  // it("can remap names of imported symbols");
  // it("can import from multiple different modules");
  // it("can load other modules from an absolute url");
  // it("can use imported symbols from another module");
  // it("can execute arbitrary code that uses globals or whatever");
  // it("can be a single value, but it will not export any symbols");
  // it("will be treated as the body of a 'do' expression if it is a bare list");
  // it("supports loading both from the network and from local file system")
  // it("can handle circular module references");
  // it("can be specified using JavaScript");
  // it("can be specified using WASM");
})
