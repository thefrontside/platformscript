import type { Release, Signoff } from "./types.ts";
import * as $git from "./git.ts";
import * as $notes from "./notes.ts";
import { filter, map, until } from "./ops.ts";
import { yaml } from "./deps.ts";

export function untagged(): AsyncGenerator<Signoff> {
  let signoffs = filter(
    map($git.history(), async (commit) => {
      let note = await $notes.read("signoffs", commit.id);
      return note
        ? {
          ...yaml.parse(note.content),
          commitId: commit.id,
        } as Signoff
        : null;
    }),
    (signoff) => Promise.resolve(!!signoff),
  ) as AsyncGenerator<Signoff>;
  return until(signoffs, (signoff) => Promise.resolve(!!signoff.taggedAt));
}

export async function signoff(release: Release): Promise<void> {
  await $notes.upsert("signoffs", (content) => {
    let current = content ? yaml.parse(content) : {
      releases: [],
    };
    return yaml.stringify({
      ...current,
      releases: current.releases.concat(release.tag),
    });
  });
}

export async function complete(signoff: Signoff): Promise<void> {
  await $notes.upsert("signoffs", (content) => {
    let current = content ? yaml.parse(content) : {
      releases: [],
    };
    return yaml.stringify({
      ...current,
      taggedAt: new Date().toISOString(),
    });
  }, signoff.commitId);
}
