import type { PSEnv, PSFnCallContext, PSList, PSValue } from "../types.ts";
import type { Operation } from "../deps.ts";
import { equal } from "../equal.ts";
import * as data from "../data.ts";

export interface TestResult {
  type: "pass" | "fail";
  message: PSValue;
}

export function isTestResult(value: unknown): value is TestResult {
  return !!value && typeof value === "object" &&
    ["pass", "fail"].includes((value as TestResult).type);
}

export const testing = data.map({
  "test": data.fn(function* (cxt) {
    return data.external(yield* test(cxt));
  }, { name: "definition" }),
  "toEqual": data.fn(function* (expected) {
    return data.fn(function* (actual) {
      if (equal(expected.arg, actual.arg).value) {
        return data.external({
          type: "pass",
          message: data.map({
            "equal to": expected.arg,
          }),
        });
      } else {
        return data.external({
          type: "fail",
          message: data.map({
            "equal to": expected.arg,
          }),
        });
      }
    }, { name: "actual" });
  }, { name: "expected" }),
  "not": data.fn(function* (matcher) {
    return data.fn(function* (actual) {
      if (matcher.arg.type === "fn") {
        let result = yield* actual.env.call(matcher.arg, actual.arg);
        if (result.type === "external" && result.value.type == "fail") {
          return data.external({
            type: "pass",
            message: data.map({
              "not": result.value.message,
            }),
          });
        } else {
          return data.external({
            type: "fail",
            message: data.map({
              "not": result.value.message,
            }),
          });
        }
      } else {
        return data.external({
          type: "fail",
          message: data.map({
            "not": actual.arg,
          }),
        });
      }
    }, { name: "actual" });
  }, { name: "matcher" }),
});

function* test({ arg, env }: PSFnCallContext): Operation<TestResult[]> {
  if (arg.type !== "list") {
    return [yield* step(arg, env)];
  } else {
    let results: TestResult[] = [];
    for (let item of arg.value) {
      results.push(yield* step(item, env));
    }
    return results;
  }
}

function* step(arg: PSValue, env: PSEnv): Operation<TestResult> {
  if (arg.type === "map") {
    for (let [key, value] of arg.value.entries()) {
      if (key.value === "expect") {
        if (value.type === "list") {
          let [first, ...rest] = value.value ?? data.string("null");
          let subject = yield* env.eval(first ?? data.string(""));
          let results: PSValue[] = [];
          let pass = true;
          let matchers = (yield* env.eval(data.list(rest))) as PSList;
          for (let matcher of matchers.value) {
            if (matcher.type === "fn") {
              let result = yield* env.call(matcher, subject);
              if (
                result.type === "external" && result.value &&
                result.value.type && result.value.message
              ) {
                if (result.value.type === "fail") {
                  pass = false;
                }
                results.push(result.value.message);
              } else {
                results.push(result);
              }
            } else {
              results.push(matcher);
            }
          }
          return {
            type: pass ? "pass" : "fail",
            message: data.list([
              first,
              ...results,
            ]),
          };
        } else {
          return {
            type: "pass",
            message: value,
          };
        }
      }
    }
  }
  return {
    type: "pass",
    message: arg,
  };
}
