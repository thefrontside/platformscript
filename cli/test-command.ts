import type { Route } from "./router.ts";
import { walk } from "https://deno.land/std@0.177.0/fs/walk.ts";
import { Operation, resolve, subscribe, Subscription } from "../deps.ts";
import { load, map, print } from "../mod.ts";
import type { TestResult } from "../builtin/testing.ts";
import type { PSValue } from "../types.ts";

export const TestCommand: Route = {
  options: [],
  help: {
    HEAD: "Run a suite of PlatformScript tests",
    USAGE: "pls test PATH",
  },
  *handle({ segments }) {
    let path = segments.PATH ?? "test";

    let pass = true;

    let options = {
      match: [new RegExp(`^${path}`)],
      exts: [".test.yaml"],
    };

    let foundSomeTests = false;

    yield* forEach(subscribe(walk(".", options)), function* (entry) {
      foundSomeTests = true;
      if (entry.isFile) {
        console.log(`${entry.path}:`);

        let location = new URL(`file://${resolve(entry.path)}`).toString();
        let mod = yield* load({ location });

        if (mod.value.type !== "external") {
          throw new Error(
            `test file should return a test object see https://pls.pub/docs/testing.html for details`,
          );
        } else {
          let results: TestResult[] = mod.value.value;
          for (let result of results) {
            let message: PSValue;
            if (result.type === "fail") {
              pass = false;
              message = map({
                "❌": result.message,
              });
            } else {
              message = map({
                "✅": result.message,
              });
            }
            console.log(print(message).value);
          }
        }
      }
    });

    if (!foundSomeTests) {
      throw new Error(`no tests found corresponding to ${path}`);
    }

    if (!pass) {
      throw new Error("test failure");
    }
  },
};

function* forEach<T, R>(
  subscription: Subscription<T, R>,
  block: (value: T) => Operation<void>,
): Operation<R> {
  let next = yield* subscription;
  for (; !next.done; next = yield* subscription) {
    yield* block(next.value);
  }
  return next.value;
}
