import type { FunctionComponent } from "preact";
import type { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

import Header from "../components/Header.tsx";
import Footer from "../components/Footer.tsx";

export const handler: Handlers<unknown, { base: string }> = {
  async GET(_req, cxt) {
    return await cxt.render({ base: cxt.state.base });
  }
}


const description = "PlatformScript is a friendly, fully-featured programming language that uses 100% YAML for its syntax."

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


export default createPage(function IndexPage(props: PageProps<PageData>) {
  return (
    <>
      <Head>
        <title>PlatformScript: A friendly, featureful programming language that uses 100% YAML for its syntax.</title>
        <meta name="description" content={description} />
      </Head>
      <p>{description}</p>
      <a href="/docs/introduction">get started</a>
    </>
  );
});
