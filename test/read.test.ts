import { describe, expect, it } from "./suite.ts";
import * as data from "../data.ts";
import { read } from "../read.ts";
import { lookup } from "../psmap.ts";
import { PSMap, PSValue } from "../types.ts";

describe("read()", () => {
  it("reads simple scalar values", () => {
    expect(read("1")).toEqual(data.number(1));
    expect(read("true")).toEqual(data.boolean(true));
    expect(read("hi")).toEqual(data.string("hi"));
    expect(read("'hi'")).toEqual(data.string("hi"));
    expect(read(`"hi"`)).toEqual(data.string("hi"));
  });
  it("reads an empty document as the empty string", () => {
    expect(read("")).toEqual(data.string(""));
  });
  describe("maps", () => {
    it("reads scalar keys", () => {
      expect(lookup$("foo", read("foo: bar") as PSMap)).toEqual(
        data.string("bar"),
      );
      expect(lookup$(1, read("1: bar") as PSMap)).toEqual(data.string("bar"));
      expect(lookup$(false, read("false: bar") as PSMap)).toEqual(
        data.string("bar"),
      );
    });

    it("reads non scalar values", () => {
      expect(lookup$("foo", read("foo: [bar, baz]") as PSMap)).toEqual(
        data.list([data.string("bar"), data.string("baz")]),
      );
    });
  });

  describe("lists", () => {
    it("reads lists of scalars", () => {
      expect(read("[bar, baz]")).toEqual(
        data.list([data.string("bar"), data.string("baz")]),
      );
    });
    it("reads lists of lists", () => {
      expect(read("[bar, [bar]]")).toEqual(
        data.list([data.string("bar"), data.list([data.string("bar")])]),
      );
    });
  });
});

function lookup$(key: string | number | boolean, map: PSMap): PSValue {
  let result = lookup(key, map);
  if (result.type == "just") {
    return result.value;
  } else {
    throw new Error(`map does not contain key '${key}'`);
  }
}
