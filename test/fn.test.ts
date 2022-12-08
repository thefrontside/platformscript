import { assert, describe, expect, it } from "./suite.ts";
import * as ps from "../mod.ts";
import { lookup } from "../psmap.ts";

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

  it("can access the local symbols of a function in which it was defined", async () => {
    let program = ps.parse("$(x): { $(y): '%($x) %($y)' }");
    let interp = ps.createPlatformScript();
    let fn = await interp.eval(program);

    assert(fn.type === "fn");
    let inner = await interp.call(fn, ps.string("Hello"));
    assert(inner.type === "fn");
    let result = await interp.call(inner, ps.string("World"));
    expect(result.value).toEqual("Hello World");
  });

  it("can access the module scope in which it was defined", async () => {
    let program = ps.parse(`
saying: "Hello World"
say: { $(): $saying }
`);

    let interp = ps.createPlatformScript();
    let mod = await interp.moduleEval(program, import.meta.url);
    let say = lookup("say", mod.symbols);
    assert(say.type === "just");
    assert(say.value.type === "fn");
    expect((await interp.call(say.value, ps.boolean(false))).value).toEqual(
      "Hello World",
    );
  });

  it("can acesss imported symbols of the module in which it was defined", async () => {
    let program = ps.parse(`
$import:
  names: [say]
  from: modules/fn-scope.yaml
$do: { $say: Hello }
`);

    let interp = ps.createPlatformScript();
    await interp.moduleEval(program, import.meta.url);
  });

  it("can parse method syntax", async () => {
    let map = ps.parse(`{x: 5, y(x): $x}`);
    assert(map.type === "map");
    let x = lookup("x", map);
    assert(x.type === "just");
    expect(x.value.value).toEqual(5);

    let y = lookup("y", map);
    assert(y.type === "just");
    assert(y.value.type === "fn");

    let interp = ps.createPlatformScript();

    expect(await interp.call(y.value, ps.string("Hello"))).toEqual({
      type: "string",
      value: "Hello",
    });
  });
});
