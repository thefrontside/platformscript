import type { MiddlewareHandlerContext as Cxt } from "$fresh/server.ts";

export async function handler(req: Request, cxt: Cxt) {
  cxt.state.base = req.headers.get("x-base") ?? "/";
  return await cxt.next();
}
