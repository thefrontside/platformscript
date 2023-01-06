import type { ComponentChildren } from "preact";
import type { Handlers } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

import { createMainPage } from "../components/main-page.tsx";

export const handler: Handlers<unknown, { base: string }> = {
  async GET(_req, cxt) {
    return await cxt.render({ base: cxt.state.base });
  },
};

const description =
  "PlatformScript is a friendly, full featured programming language with pure YAML syntax.";

export default createMainPage(function IndexPage() {
  return (
    <>
      <Head>
        <title>PlatformScript: make your YAML come to life</title>
        <meta name="description" content={description} />
      </Head>
      <main class="p-6">
        <div class="text-center pt-32 pb-32">
          <h1 class="mb-12 p-6 font-bold  text-5xl lg:text-7xl">
            {description}
          </h1>
          <a
            class="p-4 clear border-1 bg-blue-100 hover:bg-blue-300"
            href="/docs/introduction"
          >
            get started
          </a>
        </div>
        <FeatureSection title="Use any YAML document as data, evaluate it or run it">
          PlatformScript imports YAML from any URL. It evaluates the data, which
          can optionally start processes or execute tasks.
        </FeatureSection>

        <FeatureSection title="Share reusable YAML functions">
          Any PlatformScript YAML can be a module if it’s accessible via a URL.
          You can create reusable features by simply uploading the file to a
          gist, any HTTP server, or anywhere on the file system.
        </FeatureSection>
        <FeatureSection title="Create executable applications">
          You can create a CLI tool by pointing the PlatformScript executable at
          a YAML document with CLI command configurations. PlatformScript will
          automatically download the YAML script, interpret it and run the
          commands.
        </FeatureSection>
      </main>
    </>
  );
});

function FeatureSection(
  { title, children }: { title: string; children: ComponentChildren },
) {
  return (
    <section class="m-6 text-xl lg:text-3xl">
      <h1 class="font-bold mb-4">{title}</h1>
      <p>{children}</p>
    </section>
  );
}
