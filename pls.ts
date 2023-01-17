import { parse as parseFlags } from "https://deno.land/std@0.159.0/flags/mod.ts";

let flags = parseFlags(Deno.args, {
  boolean: "version",
  alias: {
    V: "version",
  },
});

if (flags.version) {
  console.log(`1.0.0`);
} else {
  console.log(`USAGE:
pls [OPTIONS] [COMMAND]

OPTIONS:
-h,  --help
         Print help information
-V,  --version
         Print version information`);
}
