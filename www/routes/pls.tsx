import type { Handlers } from "$fresh/server.ts";

import VERSION from "../../version.json" assert { type: "json" };

export const handler: Handlers = {
  GET() {
    const path = `https://deno.land/x/platformscript@${VERSION}/cli/pls.ts`;
    return new Response(`Redirecting to ${path}`, {
      headers: { "Location": path },
      status: 307,
    });
  },
};
