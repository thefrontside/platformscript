import { sh } from "../exec.ts";

try {
  await sh(["git", "config", "notes.rewriteRef", "refs/notes/*"]);
  await sh(["git", "config", "notes.displayRef", "refs/notes/*"]);
  await sh(["git", "fetch", "-f", "origin", "refs/notes/*:refs/notes/*"]);
} catch (error) {
  if (error.name === "ShellError") {
    console.error(error.message);
  } else {
    throw error;
  }
}
