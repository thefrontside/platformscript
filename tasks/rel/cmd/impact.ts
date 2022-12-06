import { parse, yaml } from "../deps.ts";
import * as releases from "../releases.ts";
import * as lineages from "../lineages.ts";
import { since } from "../impact.ts";

const flags = parse(Deno.args, {
  "string": ["pre"],
});

const [lineageName] = flags._;
const lineage = lineages.construct(String(lineageName));

const current = await releases.current(lineage, flags.pre);

let separator = () => Promise.resolve();

const encoder = new TextEncoder();

for await (let impact of since(lineages.construct(lineage), current)) {
  await separator();
  separator = async () => {
    await Deno.stdout.write(encoder.encode("---\n"));
  };
  let { lineage: _, ...rest } = impact;
  let text = `${yaml.stringify(rest, null, 2)}`;
  await Deno.stdout.write(encoder.encode(text));
}
