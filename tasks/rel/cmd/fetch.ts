import { parse } from "../deps.ts";
import { sh } from "../exec.ts";

const flags = parse(Deno.args);

let [remote] = flags._;

if (!remote) {
  throw new Error("must specify a remote to `rel fetch`");
}

await sh(`git fetch ${remote} refs/notes/*:refs/notes/*`);
