import type { Impact, Lineage, Release } from "./types.ts";

import { SemVer, semver } from "./deps.ts";
import { find, reduce, sizeOf } from "./ops.ts";
import * as git from "./git.ts";
import * as impact from "./impact.ts";
import * as lineages from "./lineages.ts";

export async function* since(release: Release): AsyncGenerator<Release> {
  for await (let rel of all(release.lineage)) {
    if (eq(rel, release)) {
      break;
    } else {
      yield rel;
    }
  }
}

export async function* all(lineage: Lineage): AsyncGenerator<Release> {
  let exists = await find(
    lineages.all(),
    (lin) => Promise.resolve(lineages.eq(lineage, lin)),
  );
  if (!exists) {
    console.dir({ lineage });
    let error = new Error(lineage.name);
    error.name = "NoSuchLineageErro";
    throw error;
  }

  let { prefix } = lineage;
  for await (let commit of git.history()) {
    for (let tag of commit.tags) {
      if (tag.startsWith(lineage.prefix)) {
        let version = semver.parse(tag.replace(prefix, ""));
        if (version) {
          yield construct(lineage, version);
        }
      }
    }
  }
}

export async function basis(lineage: Lineage): Promise<Release> {
  let existing = await find(
    all(lineage),
    ({ version }) => Promise.resolve(version.prerelease.length === 0),
  );

  return existing ?? construct(lineage, semver.parse("0.0.0") as SemVer);
}

export async function current(
  lineageSpec: string | Lineage,
  prerelease?: string,
): Promise<Release> {
  let lineage = lineages.construct(lineageSpec);
  let min = await basis(lineage);

  if (prerelease) {
    let greatest = await reduce(
      impact.since(lineage, min),
      null as Impact | null,
      (greatest, stmt) => {
        return Promise.resolve(
          !greatest || impact.gt(greatest, stmt) ? stmt : greatest,
        );
      },
    );

    if (greatest) {
      let premin = min.version.increment(`pre${greatest.level}`, prerelease);
      let premax = await find(since(min), (release) => {
        let [id] = release.version.prerelease as [string, number];
        return Promise.resolve(
          id === prerelease && semver.gt(release.version, premin),
        );
      });
      return premax ?? construct(lineage, premin);
    } else {
      return min;
    }
  } else {
    return min;
  }
}

export async function next(
  lineageSpec: string | Lineage,
  prerelease?: string,
): Promise<Release> {
  let lineage = lineages.construct(lineageSpec);

  let current = await basis(lineage);

  let greatest = await reduce(
    impact.since(lineage, current),
    null as Impact | null,
    (greatest, stmt) => {
      return Promise.resolve(
        !greatest || impact.gt(greatest, stmt) ? stmt : greatest,
      );
    },
  );

  if (greatest) {
    if (prerelease) {
      let min = current.version.increment(`pre${greatest.level}`, prerelease);
      let max = await find(since(current), (release) => {
        let [id] = release.version.prerelease as [string, number];
        return Promise.resolve(
          id === prerelease && semver.gt(release.version, min),
        );
      });
      if (max) {
        if (await sizeOf(impact.since(lineage, max)) > 0) {
          return construct(lineage, max.version.increment("prerelease"));
        } else {
          return max;
        }
      } else {
        return construct(lineage, min);
      }
    } else {
      let version = current.version.increment(greatest.level);
      return construct(lineage, version);
    }
  } else {
    return current;
  }
}

export function eq(a: Release, b: Release): boolean {
  return a.tag === b.tag;
}

export function construct(lineage: Lineage, version: SemVer): Release {
  return { lineage, version, tag: `${lineage.prefix}${version}` };
}
