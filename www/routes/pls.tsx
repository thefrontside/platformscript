import type { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET() {
    const path = `https://deno.land/x/platformscript/pls.ts`;
    return new Response(`Redirecting to ${path}`, {
      headers: { "Location": path },
      status: 307,
    });
  },
};
