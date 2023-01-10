import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET: async () => {
    const response = await fetch('https://esm.sh/v102/monaco-yaml@4.0.2/es2022/yaml.worker.js?worker', {
      headers: {
        'content-type': 'application/javascript; charset=utf-8'
      }
    })

    const js = await response.text();

    return new Response(js, {
      headers: {
        "content-type": "application/javascript",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  },
};
