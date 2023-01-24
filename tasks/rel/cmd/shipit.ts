import { parse } from "../deps.ts";
import { sh } from "../exec.ts";

import * as $signoffs from "../signoffs.ts";

const flags = parse(Deno.args, {
  "boolean": "dry-run",
});

const dryRun = flags["dry-run"] ?? false;

for await (let signoff of $signoffs.untagged()) {
  for (let tag of signoff.releases) {
    if (dryRun) {
      console.log(`[DRY] git tag ${tag} ${signoff.commitId}`);
    } else {
      await sh(["git", "tag", tag, signoff.commitId]);
    }
  }
  if (!dryRun) {
    await $signoffs.complete(signoff);
  }
}
