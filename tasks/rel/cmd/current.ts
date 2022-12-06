import { parse } from "https://deno.land/std@0.165.0/flags/mod.ts";
import * as releases from "../releases.ts";

const flags = parse(Deno.args, {
  "string": ["pre"],
});

const { version } = await releases.current(String(flags._[0]), flags.pre);

Deno.stdout.write(new TextEncoder().encode(`${version}\n`));
