import { parse, yaml } from "../deps.ts";
import { sh } from "../exec.ts";
import * as $notes from "../notes.ts";

const flags = parse(Deno.args, {
  "boolean": "dry-run",
});

const dryRun = flags["dry-run"] ?? false;

for await (let note of $notes.all("shipit")) {
  let releases = yaml.parse(note.content);
  for (let tag of Object.values(releases) as string[]) {
    if (dryRun) {
      console.log(`[DRY] git tag ${tag} ${note.targetId}`);
    } else {
      await sh(["git", "tag", tag, note.targetId]);
    }
  }
}

const cleanup = [
  "git push origin :refs/notes/shipit",
  "git push origin --tags",
];

if (!dryRun) {
  for (let cmd of cleanup) {
    await sh(cmd);
  }
} else {
  console.log(cleanup.map((cmd) => `[DRY] ${cmd}`).join("\n"));
}
