import type { Commit } from "./types.ts";
import { join } from "./deps.ts";
import { exec } from "./exec.ts";

export async function currentId(): Promise<string> {
  return (await exec(["git", "rev-parse", "HEAD"])).trim();
}

export async function toplevel(path?: string): Promise<string> {
  let top = await exec(["git", "rev-parse", "--show-toplevel"]);
  return path ? join(top, path) : top;
}

export async function* history(): AsyncGenerator<Commit> {
  const pageSize = 50;
  let last: Commit | void = void 0;
  let records = 0;
  do {
    records = 0;
    let head: string[] = last ? [last.id, "--skip", "1"] : [];
    let cmd = ["git", "log"].concat(head).concat([
      "-n",
      `${pageSize}`,
      "--format=%h%d %s",
    ]);
    let text = await exec(cmd);

    for (let line of text.split("\n")) {
      let match = line.match(/^([0-9a-f]+)\s(\((.+?)\))?\s?(.*)$/);
      if (match) {
        records++;
        let id = match[1];
        let refline = match[3];
        let summary = match[4];
        let refs = refline ? refline.split(", ") : [];
        let tags = refs.flatMap((ref) => {
          let tagmatch = ref.match(/^tag: (.+)$/);
          return tagmatch ? [tagmatch[1]] : [];
        });

        yield last = { id, summary, refs, tags, line };
      }
    }
  } while (records >= pageSize);
}
