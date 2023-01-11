import type { Handlers } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { createMainPage } from "../components/main-page.tsx";

import PSPlayGround from "../islands/ps-playground.tsx";

export const handler: Handlers<unknown, { base: string }> = {
  async GET(_req, cxt) {
    let response = await cxt.render({ base: cxt.state.base });
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
      <PSPlayGround />
    </>
  )
});
