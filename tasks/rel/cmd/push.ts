import { parse } from "../deps.ts";
import { sh } from "../exec.ts";

const flags = parse(Deno.args);

let [remote] = flags._;

await sh([
  "git",
  "push",
  "--force",
  `${remote ?? "origin"}`,
  "refs/notes/*:refs/notes/*",
]);
