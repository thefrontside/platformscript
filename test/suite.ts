export * from "https://deno.land/std@0.145.0/testing/bdd.ts";
export { expect } from "https://deno.land/x/expect@v0.2.9/mod.ts";
export * from "https://deno.land/std@0.165.0/testing/asserts.ts";

import { createPlatformScript, js2ps, parse, ps2js, PSMap } from "../mod.ts";

export function evaluate(source: string, scope?: PSMap) {
  let ps = createPlatformScript();
  let value = parse(source, "script");
  return ps.eval(value, scope);
}

export async function eval2js(
  source: string,
  cxt: Record<string, unknown> = {},
): Promise<unknown> {
  let result = await evaluate(source, js2ps(cxt) as PSMap);
  return ps2js(result);
}

import type { Operation } from "../deps.ts";
import { callback, resource, useAbortSignal } from "../deps.ts";
import { serve } from "https://deno.land/std@0.163.0/http/server.ts";
import staticFiles from "https://deno.land/x/static_files@1.1.6/mod.ts";

export interface Server {
  hostname: string;
  port: number;
}

export function useStaticFileServer(dir: string): Operation<Server> {
  return resource(function* (provide) {
    let signal = yield* useAbortSignal();

    let onListen = callback<Server>();

    let serveFiles = (req: Request) =>
      staticFiles(dir)({
        request: req,
        respondWith: (r: Response) => r,
      });

    serve(serveFiles, { signal, onListen });

    let server = yield* onListen;

    yield* provide(server);
  });
}
