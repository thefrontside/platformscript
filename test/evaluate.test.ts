import { describe, eval2js, expect, it } from "./suite.ts";

describe("evaluate()", () => {
  it("evaluates number literals", async () => {
    expect(await eval2js("1")).toEqual(1);
  });
  it("evaluates string literals", async () => {
    expect(await eval2js('"hello world"')).toEqual("hello world");
    expect(await eval2js("'hello world'")).toEqual("hello world");
  });
  it("evaluates boolean literals", async () => {
    expect(await eval2js("true")).toBe(true);
    expect(await eval2js("false")).toBe(false);
  });
  it("is an reference error when referencing a bare word", async () => {
    try {
      await eval2js("ref");
      throw new Error("expected to throw, but did not");
    } catch (error) {
      expect(error.name).toEqual("ReferenceError");
    }
  });
  it("de-references references", async () => {
    expect(await eval2js("ref", { ref: "hi" })).toEqual("hi");
  });
  it.ignore("can evaluate a function with array arguments", () => {
    expect(eval2js("join: ['hello', thing]", {
      join: (args: string[]) => args.join(" "),
      thing: "world",
    })).toEqual("hello world");
  });
  it.ignore("can evaluate a function with map arguments", () => {
    expect(eval2js("join: { hello: 'world'}", {
      join: (args: Record<string, unknown>) => {
        let [[what, to]] = Object.entries(args);
        return `${what} ${to}`;
      },
    })).toEqual("hello world");
  });

  describe("do/let", () => {
    it("evaluates a simple reference", async () => {
      expect(await eval2js("do: 5")).toEqual(5);
    });

    it("evaluates a list of statements", async () => {
      expect(
        await eval2js("do: [5, 10, x]", {
          x: "fin",
        }),
      ).toEqual("fin");
    });

    it("allows binding expressions to appear in front", async () => {
      expect(await eval2js(`{let: {x: 5 }, do: x}`)).toEqual(5);
    });

    it("allows binding expressions to appear afterwards", async () => {
      expect(await eval2js(`{do: x, let: { x: 5 }}`)).toEqual(5);
    });
    it("evaluates an empty let binding as false", async () => {
      expect(await eval2js(`let: {x: 5}`)).toEqual(false);
    });
  });

  describe("functions", () => {
    it("can define a function with function syntax and invoke it", async () => {
      expect(await eval2js("{let: {id(x): x }, do: {id: 'hi'} }")).toEqual(
        "hi",
      );
    });
  });
});
