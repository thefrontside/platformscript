export * from "https://deno.land/std@0.145.0/testing/bdd.ts";
export { expect } from "https://deno.land/x/expect@v0.2.9/mod.ts";


import { evaluate, js2ys, ys2js, YSMap } from "../mod.ts";

export async function eval2js(source: string, cxt: Record<string, unknown> = {}): Promise<unknown> {
  let result = await evaluate(source, {
    context: js2ys(cxt) as YSMap,
  });
  return ys2js(result);
}
