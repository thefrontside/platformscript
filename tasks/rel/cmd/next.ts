import { parse } from "https://deno.land/std@0.165.0/flags/mod.ts";
import * as releases from "../releases.ts";

const flags = parse(Deno.args, {
  "string": ["pre"],
});
const [lineage] = flags._;

const { version } = await releases.next(String(lineage), flags.pre);

Deno.stdout.write(new TextEncoder().encode(`${version}\n`));
