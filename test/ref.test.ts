import { describe, eval2js, expect, it } from "./suite.ts";

describe("a reference", () => {
  it("evaluates a simple value", async () => {
    expect(await eval2js(`five`, { five: 5 })).toEqual(5);
  });
  it("evaluates a value nested in a map", async () => {
    expect(
      await eval2js("numbers.ints.five", { numbers: { ints: { five: 5 } } }),
    ).toEqual(5);
  });
  it("fails to evaluate if the value does not exist", async () => {
    try {
      await eval2js("empty.nothing", { empty: {} });
      throw new Error("expected dereference to fail, but it did not");
    } catch (error) {
      expect(error.message).toMatch(/no such key/);
    }
  });
});
