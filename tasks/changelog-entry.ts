import * as yaml from "npm:yaml";
import { parse } from "https://deno.land/std@0.165.0/flags/mod.ts";
import { readAll } from "https://deno.land/std@0.167.0/streams/read_all.ts";

const flags = parse(Deno.args);

const [version] = flags._;

if (!version) {
  throw new TypeError(`call update changelog with a version`);
}

let stdin = new TextDecoder().decode(await readAll(Deno.stdin));

let docs = yaml.parseAllDocuments(stdin);

let title = `## ${version}`;

const entries = docs.map((doc: YAMLDoc) => {
  let { summary } = doc.toJSON();
  return `- ${summary}`;
});

await Deno.stdout.write(new TextEncoder().encode(`${title}

${entries.join("\n")}

`));

interface YAMLDoc {
  //deno-lint-ignore no-explicit-any
  toJSON(): any;
}
