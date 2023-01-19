import type { Operation } from "../deps.ts";

import {
  parse as parseFlags,
  ParseOptions,
} from "https://deno.land/std@0.159.0/flags/mod.ts";

export function* dispatch(
  args: string[],
  routes: Routes,
  matched: string[] = [],
): Operation<void> {
  let shellwords = parseFlags(args)._;
  match:
  for (let [key, value] of Object.entries(routes)) {
    let pattern: PatternElement[] = key.split(/\s/).map((name) => {
      if (name.startsWith(":")) {
        return { type: "dynamic", required: true, name: name.slice(1) };
      } else {
        return { type: "static", value: name };
      }
    });
    let segments: Record<string, string> = {};
    let rest = args.slice();
    let copy = shellwords.slice();
    for (let element of pattern) {
      let top = copy.shift();

      if (element.type === "dynamic") {
        if (top) {
          segments[element.name] = String(top);
          rest.splice(rest.indexOf(String(top), 1));
          matched = matched.concat(element.name);
        }
      } else if (element.value !== top) {
        continue match;
      } else {
        rest.splice(rest.indexOf(element.value), 1);
        matched = matched.concat(element.value);
      }
    }
    let [handler, subroutes] = Array.isArray(value) ? value : [value];

    let helpful = helpify(handler);

    let parseOptions = routeOptions(helpful);

    let flags = parseFlags(rest, parseOptions);

    let children = subroutes
      ? dispatch(flags._.map(String), subroutes, matched)
      : { *[Symbol.iterator]() {} };

    let props: RouteProps = {
      flags,
      route: helpful,
      children,
      segments,
    };

    return yield* helpful.handle(props);
  }
}

function routeOptions(route: Route): ParseOptions {
  return route.options.reduce((options, spec) => {
    options[spec.type].push(spec.name);
    if (spec.alias) {
      options.alias[spec.name] = spec.alias;
    }
    return options;
  }, {
    boolean: [] as string[],
    number: [] as string[],
    string: [] as string[],
    alias: {} as Record<string, string>,
    stopEarly: true,
  });
}

function helpify(route: Route): Route {
  let options = route.options.slice();
  options.splice(0, 0, {
    type: "boolean",
    name: "help",
    alias: "h",
    description: "Print help information",
  });
  return {
    ...route,
    options,
    *handle(props) {
      if (props.flags.help) {
        printHelp(props.route);
      } else {
        yield* route.handle(props);
      }
    },
  };
}

export type PatternElement = {
  type: "dynamic";
  name: string;
  required: boolean;
} | {
  type: "static";
  value: string;
};

export interface RouteProps<TFlags = unknown> {
  flags: TFlags;
  route: Route;
  segments: Record<string, string>;
  children: Operation<void>;
}

export interface Route {
  options: {
    type: "boolean" | "string" | "number";
    name: string;
    alias?: string;
    description: string;
  }[];
  help: {
    HEAD: string;
    USAGE: string;
  };
  handle(props: RouteProps): Operation<void>;
}

export type Routes = Record<string, Route | [Route, Routes]>;

function printHelp(route: Route): void {
  let optionsTable = route.options.map((opt) => {
    let line = new Array(80).fill(" ", 0, 79);
    if (opt.alias) {
      line.splice(4, 3, ...`-${opt.alias},`);
    }
    line.splice(8, opt.name.length + 2, ...`--${opt.name}`);
    line.splice(20, opt.description.length, ...opt.description);
    return line.join("");
  }).join("\n");
  console.log(`${route.help.HEAD}\n`);
  console.log(`USAGE:\n    ${route.help.USAGE}\n`);
  console.log(`OPTIONS:\n${optionsTable}`);
}
