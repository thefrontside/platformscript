import { assert, describe, expect, it } from "./suite.ts";
import * as ps from "../mod.ts";
import { lookup } from "../psmap.ts";

describe("fn", () => {
  it("can be called directly", async () => {
    let interp = ps.createPlatformScript();
    let program = ps.parse("(thing)=>: Hello %($thing)!");
    let fn = await interp.eval(program);
    assert(fn.type === "fn");
    expect(
      (await interp.call(fn, ps.string("World"))).value,
    ).toEqual("Hello World!");
  });

  it("can access the local symbols of a function in which it was defined", async () => {
    let program = ps.parse("(x)=>: { (y)=>: '%($x) %($y)' }");
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
say: { ()=>: $saying }
`);

    let interp = ps.createPlatformScript();
    let mod = await interp.moduleEval(program, import.meta.url);
    let say = lookup("say", mod.value);
    assert(say.type === "just");
    assert(say.value.type === "fn");
    expect((await interp.call(say.value, ps.boolean(false))).value).toEqual(
      "Hello World",
    );
  });

  it("can acesss imported symbols of the module in which it was defined", async () => {
    let program = ps.parse(`
$import:
  say: modules/fn-scope.yaml
$say: Hello
`);

    let interp = ps.createPlatformScript();
    let mod = await interp.moduleEval(program, import.meta.url);
    expect(mod.value).toEqual(ps.string("Hello world: world"));
  });

  it("can parse method syntax", async () => {
    let interp = ps.createPlatformScript();
    let map = await interp.eval(ps.parse(`{x: 5, y(x): $x}`));

    assert(map.type === "map");
    let x = lookup("x", map);
    assert(x.type === "just");
    expect(x.value.value).toEqual(5);

    let y = lookup("y", map);
    assert(y.type === "just");
    assert(y.value.type === "fn");

    expect(await interp.call(y.value, ps.string("Hello"))).toEqual({
      type: "string",
      value: "Hello",
    });
  });

  it("can reference values from arguments to native functions", async () => {
    let interp = ps.createPlatformScript(() =>
      ps.map({
        id: ps.fn(function* $id({ arg, env }) {
          return yield* env.eval(arg);
        }, { name: "x" }),
      })
    );

    let program = ps.parse(`
$let:
  myid(x):
    $id: $x
$do:
  $myid: hello world
`);

    let result = await interp.eval(program);
    expect(result.value).toEqual("hello world");
  });

  it("can invoke a function that is accessible off a function parameter scope", async () => {
    let program = ps.parse(`
$let:
  holder:
    id(x): $x
  hi(thing): { $thing.id: "hello" }
$do: { $hi: $holder }
`);
    let interp = ps.createPlatformScript();
    expect(await interp.eval(program)).toEqual({
      type: "string",
      value: "hello",
    });
  });
});
