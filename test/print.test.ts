import { describe, expect, it } from "./suite.ts";
import type { PSValue } from "../types.ts";

import * as data from "../data.ts";
import { print as $print, read } from "../mod.ts";
import { recognize } from "../recognize.ts";

const parse = (source: string) => recognize(read(source));
const print = (val: PSValue) => $print(val).value;

describe("print()", () => {
  it("prints scalar values", () => {
    expect(print(data.number(1))).toEqual("1");
    expect(print(data.boolean(true))).toEqual("true");
    expect(print(data.string("hello"))).toEqual("hello");
  });
  it("properly escapes strings", () => {
    expect(print(data.string("'hello'"))).toEqual(`"'hello'"`);
    expect(print(data.string('"hello"'))).toEqual(`'"hello'`);
    expect(print(data.string(`"'weird`))).toEqual(`"\\"'weird"\n`);
  });
  it("prints lists", () => {
    expect(print(data.list([data.string("hello"), data.string("world")])))
      .toEqual(`
- hello
- world
`);
  });
  it("prints maps", () => {
    expect(print(data.map({
      hello: data.string("world"),
    }))).toEqual(`hello: world`);
  });
  it("prints references", () => {
    expect(print(data.ref("x", ["y", "z"]))).toEqual("$x.y.z");
  });
  it("prints templates", () => {
    expect(print(parse("hello %($world)"))).toEqual("hello %($world)");
  });
  it("prints platformscript functions", () => {
    expect(print(parse("(x)=>: { message: hello world }"))).toEqual(
      "(x)=>: { message: hello world }",
    );
    expect(print(parse("greet(person): { message: hello %(person) }"))).toEqual(
      "greet(person): { message: hello %(person) }",
    );
  });
  it("prints native functions", () => {
    expect(print(data.fn(function* id(cxt) {
      return cxt.arg;
    }, { name: "x" }))).toEqual("(x)=>: [[native fn]]");
  });
  it("prints function calls", () => {
    expect(print(parse("$id: 5"))).toEqual("$id: 5")
  });
  it("prints external values", () => {
    expect(print(data.external({}))).toEqual("[[external]]");
  });
  it("is the inverse of read by default", () => {
    expect(print(parse(`
$import:
  read, print: https://pls.pub/std.yaml
quoted: "hi"
plain: hi
flow: {$read: hello world}
block:
  $read: hello world
`)))
  });
});
