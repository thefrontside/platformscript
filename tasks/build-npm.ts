import { build, emptyDir } from "https://deno.land/x/dnt@0.28.0/mod.ts";

const outDir = "./build/npm";

await emptyDir(outDir);

let [version] = Deno.args;
if (!version) {
  throw new Error("a version argument is required to build the npm package");
}

await build({
  entryPoints: ["./mod.ts"],
  outDir,
  shims: {
    deno: false,
  },
  test: false,
  typeCheck: false,
  compilerOptions: {
    lib: ["esnext", "dom"],
    target: "ES2020",
    sourceMap: true,
  },
  package: {
    // package.json properties
    name: "platformscript",
    version,
    description: "Bring your YAML to life",
    license: "ISC",
    repository: {
      author: "engineering@frontside.com",
      type: "git",
      url: "git+https://github.com/frontside/platformscript.git",
    },
    bugs: {
      url: "https://github.com/frontside/platformscript/issues",
    },
    engines: {
      node: ">= 16",
    },
  },
});

await Deno.copyFile("README.md", `${outDir}/README.md`);
