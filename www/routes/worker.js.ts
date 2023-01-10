import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET: async (req) => {

    let url = getWorkerURL(req);

    const response = await fetch(url, {
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

function getWorkerURL(request: Request) {
  let url = new URL(request.url);
  let label = url.searchParams.get("label");
  switch (label) {
    case 'editorWorkerService':
      return 'https://esm.sh/monaco-editor@0.34.1/esm/vs/editor/editor.worker?worker'
    case 'yaml':
      return 'https://esm.sh/monaco-yaml@4.0.2/yaml.worker?worker';
    default:
      return `https://esm.sh/monaco-editor@0.34.1/esm/vs/language/${label}/${label}.worker?worker`
  }
}
