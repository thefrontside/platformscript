import type { FunctionComponent } from "preact";
import type { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

import Footer from "./Footer.tsx";
import Header from "./Header.tsx";

export interface MainPageData {
  base: string;
  active: string;
}

export type MainPageProps<T extends MainPageData = MainPageData> = PageProps<T>;

export function createMainPage<TProps extends MainPageProps = MainPageProps>(
  Component: FunctionComponent<TProps>,
) {
  return function Page(props: TProps) {
    return (
      <>
        <Head>
          <base href={props.data.base} />
        </Head>
        <Header active={props.data.active} />
        <Component {...props} />
        <Footer />
      </>
    );
  };
}
