import { main } from "./main.ts";
import { dispatch } from "./router.ts";
import { PlsCommand } from "./pls-command.ts";
import { RunCommand } from "./run-command.ts";
import { TestCommand } from "./test-command.ts";

await main(function* (args) {
  yield* dispatch(["pls", ...args], {
    "pls": [PlsCommand, {
      "run :MODULE": RunCommand,
      "test :PATH": TestCommand,
    }],
  });
});
