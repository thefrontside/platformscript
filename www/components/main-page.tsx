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
        <div class="h-screen flex flex-col">
          <Header className="flex justify-between" active={props.data.active} />
          <main style={{ flexGrow: 1 }}>
            <Component {...props} />
          </main>
          <Footer className="border(t-2 gray-200) bg-gray-100 h-32 flex flex-col gap-4 justify-center" />
        </div>
      </>
    );
  };
}
