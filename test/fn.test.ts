import type { PSMap } from "../mod.ts";
import { describe, expect, it } from "./suite.ts";
import { evaluate } from "../mod.ts";

describe("Fn", () => {
  it("can destructure list arguments", async () => {
    expect(
      await evaluate(
        `
let:
  add(x,y): {+: [x,y] }
do: { add: [2,40] }
`,
        {
          context: math,
        },
      ),
    ).toEqual({ type: "number", value: 42 });
  });
  it("throws an error if destructured args are not a list", async () => {
    try {
      await evaluate(`
let:
  pair(x,y): [x,y]
do: { pair: 5 }
`);
      throw new Error(`expected to throw an error, but did not`);
    } catch (error) {
      expect(error.message).toMatch(/must be a list/i);
    }
  });
  it("throws an error if an argument list is not long enough to satisfy the destructuring", async () => {
    try {
      await evaluate(`
let:
  triplet(x,y,z): [x,y,z]
do: { triplet: [1,2] }
`);
      throw new Error(`expected an error, but did not receive one`);
    } catch (error) {
      expect(error.message).toMatch(/must have at least 3 elements/);
    }
  });
  it("can have no arguments", async () => {
    let result = await evaluate(`
let:
  thunk(): "this is it"
do: { thunk: true }
`);
    expect(result.type).toEqual("string");
    //@ts-expect-error value is not on all psvalue.
    expect(result.value).toEqual("this is it");
  });
});

const math: PSMap = {
  type: "map",
  value: {
    "+": {
      type: "fn",
      *value({ arg, env }) {
        let sum = 0;
        if (arg.type === "list") {
          for (let item of arg.value) {
            let element = yield* env.eval(item);
            if (element.type === "number") {
              sum += element.value;
            }
          }
        }
        return { type: "number", value: sum };
      },
    },
  },
};
