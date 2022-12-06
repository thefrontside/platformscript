import { parse, yaml } from "../deps.ts";
import * as $releases from "../releases.ts";
import * as $notes from "../notes.ts";

const flags = parse(Deno.args, {
  "string": ["message", "pre"],
});

let [lineage] = flags._;

if (!lineage) {
  throw new Error(`prepare requires lineage`);
}

if (!flags.message) {
  throw new Error(`prepare requires message`);
}

let prerelease = flags.pre;

let current = await $releases.current(String(lineage), prerelease);

let next = await $releases.next(String(lineage), prerelease);

if (!$releases.eq(current, next)) {
  console.log(`Signoff: ${next.lineage}@${next.version}`);
  await $notes.upsert("shipit", (content) => {
    let current = content ? yaml.parse(content) : {};
    return yaml.stringify({
      ...current,
      [lineage]: next.tag,
    });
  });
} else {
  console.warn("Nothing to sign off.");
}
