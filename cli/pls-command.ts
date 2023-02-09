import type { Route } from "./router.ts";

import VERSION from "../version.json" assert { type: "json" };

export const PlsCommand: Route = {
  options: [
    {
      type: "boolean",
      name: "version",
      alias: "V",
      description: "Print version information",
    },
  ],
  help: {
    HEAD: `pls ${VERSION}`,
    USAGE: "pls [OPTIONS] COMMAND",
  },
  *handle({ flags, children }) {
    if (flags.version) {
      console.log(VERSION);
    } else {
      yield* children;
    }
  },
};
