import type { Commit, Impact, Lineage, Release } from "./types.ts";

import { yaml } from "./deps.ts";
import * as git from "./git.ts";
import * as $notes from "./notes.ts";

//returns if the level of impact of `b` is more than the impact of `a`
export function gt(a: Impact, b: Impact) {
  if (a.level === "major") {
    return false;
  } else if (a.level === "minor") {
    return b.level === "major";
  } else {
    return b.level !== "patch";
  }
}

export async function on(
  lineage: Lineage,
  commit: Commit,
): Promise<Impact | void> {
  let note = await $notes.read(lineage.ref, commit.id);
  if (note) {
    let { impact } = yaml.parse(note.content);
    let level: Impact["level"] = impact;
    let result = {
      lineage,
      level,
      summary: commit.summary,
    };

    return result;
  }
}

export async function* since(
  lineage: Lineage,
  release: Release,
): AsyncGenerator<Impact> {
  for await (let commit of git.history()) {
    if (commit.tags.includes(release.tag)) {
      break;
    }
    let impact = await on(lineage, commit);
    if (impact) {
      yield impact;
    }
  }
}
