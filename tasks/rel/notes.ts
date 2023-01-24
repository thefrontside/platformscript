import type { Note } from "./types.ts";
import { assert } from "./deps.ts";
import { exec, execSafe } from "./exec.ts";
import * as $git from "./git.ts";

export type Upsert = (content?: string) => string;

export async function upsert(
  ref: string,
  fn: Upsert,
  commitId?: string,
): Promise<void> {
  let current = await read(ref, commitId);
  let next = fn(current ? current.content : void 0);
  await write(ref, next, commitId);
}

export async function read(
  ref: string,
  commitId?: string,
): Promise<Note | void> {
  let targetId = commitId ? commitId : await $git.currentId();
  let cmd = ["git", "notes", `--ref=${ref}`, "show", targetId];
  let result = await execSafe(cmd);

  if (!result.status.success) {
    let { stderr } = result;
    if (stderr.match(/no note found/)) {
      return void 0;
    } else {
      let error = new Error(stderr);
      error.name = "GitError";
      throw error;
    }
  } else {
    return { ref, targetId, content: result.stdout };
  }
}

export async function write(
  ref: string,
  content: string,
  commitId?: string,
): Promise<Note> {
  let tmpfile = await Deno.makeTempFile();
  let targetId = commitId ? commitId : await $git.currentId();
  try {
    await Deno.writeTextFile(tmpfile, content, { append: false, create: true });
    await exec([
      "git",
      "notes",
      `--ref=${ref}`,
      "add",
      "-f",
      `--file=${tmpfile}`,
      targetId,
    ]);
    return { ref, targetId, content };
  } finally {
    await Deno.remove(tmpfile);
  }
}

export async function* all(ref: string): AsyncGenerator<Note> {
  let list = await exec(["git", "notes", `--ref=${ref}`]);
  if (list) {
    for (let line of list.split("\n")) {
      if (line) {
        let [id, targetId] = line.split(/\s+/);
        let note = await read(ref, targetId);
        assert(!!note, `ref for note ${id} -> ${targetId} but cannot read it!`);
        yield note;
      }
    }
  }
}
