import { Handlers, RouteConfig } from "$fresh/server.ts";
import { serveFile } from "https://deno.land/std@0.176.0/http/file_server.ts";

export const handler: Handlers<unknown> = {
  async GET(req, cxt) {
    let { params: { path } } = cxt;
    let location = new URL(`../../stdlib/${path}`, import.meta.url);
    return await serveFile(req, location.pathname);
  },
};

export const config: RouteConfig = { routeOverride: "/std{@:version}?/:path*" };
