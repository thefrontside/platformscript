import { parse } from "../deps.ts";
import { sh } from "../exec.ts";

const flags = parse(Deno.args);

let [remote] = flags._;

if (!remote) {
  throw new Error("must specify a remote to `rel push`");
}

await sh(`git push ${remote} refs/notes/*:refs/notes/*`);
