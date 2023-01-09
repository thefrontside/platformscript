import type { Handlers } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

import { createMainPage } from "../components/main-page.tsx";
import { Editor } from "../islands/editor.tsx";

export const handler: Handlers<unknown, { base: string }> = {
  async GET(_req, cxt) {
    let response = await cxt.render({ base: cxt.state.base });
    response.headers.set('Access-Control-Allow-Origin', '*');
    console.dir({ headers: response.headers })
    return response;
  },
};

export default createMainPage(function Playground() {
  return (
    <>
      <Head>
        <title>PlatformScript: playground</title>
        <meta name="description" content="Try out PlatformScript in your browser" />
      </Head>
      <Editor/>
    </>
  )
});
