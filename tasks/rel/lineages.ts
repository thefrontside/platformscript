import type { Idempotent, Lineage } from "./types.ts";
import { basename } from "./deps.ts";

export async function create(name: string): Promise<Idempotent<Lineage>> {
  let filename = ".git/refs/notes/${name}.lineage";
  let value = construct(name);
  try {
    await Deno.stat(filename);
    return {
      redundant: true,
      value,
    };
  } catch (_) {
    await Deno.writeTextFile(filename, "", { append: true, create: true });
    return {
      redundant: false,
      value,
    };
  }
}

export async function remove(
  name: string | Lineage,
): Promise<Idempotent<void>> {
  let filename = `.git/refs/notes/${construct(name).name}.lineage`;
  let value = void 0;
  try {
    await Deno.stat(filename);
  } catch (_) {
    return {
      redundant: true,
      value,
    };
  }
  await Deno.remove(filename);
  return {
    redundant: false,
    value,
  };
}

export async function* all(): AsyncGenerator<Lineage> {
  for await (let entry of Deno.readDir("./.git/refs/notes")) {
    let filename = basename(entry.name);
    let match = filename.match(/(.+)\.lineage$/);
    if (match) {
      let name = match[1];
      yield construct(name);
    }
  }
}

export function construct(nameOrLineage: string | Lineage): Lineage {
  let name = typeof nameOrLineage === "string"
    ? nameOrLineage
    : nameOrLineage.name;
  return {
    name,
    get ref() {
      return `${name}.lineage`;
    },
    get prefix() {
      return `${name}-v`;
    },
  };
}

export function eq(a: Lineage, b: Lineage): boolean {
  return a.name === b.name;
}
