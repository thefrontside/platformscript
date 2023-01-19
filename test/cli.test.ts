import { describe, expect, it } from "./suite.ts";
import VERSION from "../version.json" assert { type: "json" };

describe("pls", () => {
  it("can be invoked for help", async () => {
    expect(await exec("-h")).toContain(VERSION);
    expect(await exec("--help")).toContain(VERSION);
  });

  it("can be invoked for version", async () => {
    expect(await exec("-V")).toEqual(`${VERSION}\n`);
    expect(await exec("--version")).toEqual(`${VERSION}\n`);
  });

  describe("run", () => {
    it("evaluates a module and prints it", async () => {
      expect(await exec("run test/modules/1.yaml")).toEqual("1\n");
    });
  });
});

async function exec(str: string) {
  let p = Deno.run({
    stdout: "piped",
    stderr: "piped",
    cmd: ["deno", "run", "-A", "cli/pls.ts", ...str.split(/\s+/)],
  });
  try {
    let status = await p.status();
    let output = new TextDecoder().decode(await p.output());
    if (!status.success) {
      throw new Error(`${status}: ${output}`);
    } else {
      return output;
    }
  } finally {
    p.close();
    p.stderr.close();
  }
}
