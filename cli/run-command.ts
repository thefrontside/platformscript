import type { Route } from "./router.ts";
import { load, print } from "../mod.ts";
import { LogContext, resolve, spawn } from "../deps.ts";

export const RunCommand: Route = {
  options: [],
  help: {
    HEAD: "Evaluate a PlatformScript program",
    USAGE: "pls run [OPTIONS] MODULE",
  },
  *handle({ segments, route }) {
    if (!segments.MODULE) {
      console.error(`USAGE: ${route.help.USAGE}
missing required argument MODULE`);
      return;
    }

    let address = segments.MODULE;

    let location = isURL(address) ? address : `file://${resolve(address)}`;
    // setup logging context to output to stdout.
    yield* spawn(function* () {
      let logs = yield* LogContext;
      let i = yield* logs.output;
      for (let next = yield* i; !next.done; next = yield* i) {
        console.log(next.value.message);
      }
    });
    // load the module
    let mod = yield* load({ location });

    // print its value
    let str = print(mod.value);
    console.log(str.value);
  },
};

function isURL(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch (_) {
    return false;
  }
}
