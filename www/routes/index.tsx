import type { FunctionComponent, ComponentChildren } from "preact";
import type { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

import Header from "../components/Header.tsx";
import Footer from "../components/Footer.tsx";

export const handler: Handlers<unknown, { base: string }> = {
  async GET(_req, cxt) {
    return await cxt.render({ base: cxt.state.base });
  }
}

const description = "PlatformScript is a friendly, full featured programming language with pure YAML syntax."

export interface PageData {
  base: string;
}

export function createPage<T extends PageData = PageData>(Component: FunctionComponent<PageProps<T>>) {
  return function Page(props: PageProps<T>) {
    return (
      <>
        <Head>
          <base href={props.data.base} />
        </Head>
        <Header title="abount" active="/" />
        <Component {...props}/>
        <Footer/>
      </>
    );
  }
}

function FeatureSection({ title, children }: { title: string, children: ComponentChildren }) {
  return (
    <section class="m-6 text-xl lg:text-3xl">
      <h1 class="font-bold mb-4">{title}</h1>
      <p>{children}</p>
    </section>
  )
}

export default createPage(function IndexPage() {
  return (
    <>
      <Head>
        <title>PlatformScript: A friendly, featureful programming language that uses 100% YAML for its syntax.</title>
        <meta name="description" content={description} />
      </Head>
      <main class="p-6">
        <div class="text-center pt-32 pb-32">
          <h1 class="mb-12 p-6 font-bold  text-5xl lg:text-7xl">{description}</h1>
          <a class="p-4 clear border-1 bg-blue-100 hover:bg-blue-300" href="/docs/introduction">get started</a>
        </div>
        <FeatureSection title="Use any YAML document as data, evaluate it or run it">
            PlatformScript imports YAML from any URL. It evaluates the data, which can optionally start processes or execute tasks.
        </FeatureSection>

        <FeatureSection title="Share reusable YAML functions">
          <p>Any PlatformScript YAML can be a module if it’s accessible via a URL. You can create reusable features by simply uploading the file to a gist, any HTTP server, or anywhere on the file system.</p>
        </FeatureSection>
        <FeatureSection title="Create executable applications">
          <p>You can create a CLI tool by pointing the PlatformScript executable at a YAML document with CLI command configurations. PlatformScript will automatically download the YAML script, interpret it and run the commands.</p>
        </FeatureSection>
      </main>
    </>
  );
});
