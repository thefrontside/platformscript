import DocsTitle from "./DocsTitle.tsx";
import NavigationBar from "./NavigationBar.tsx";

export default function Header(props: { active: string, className?: string }) {
  return (
    <header
      class={props.className ?? '' + ' flex justify-between'}
    >
      <div class="p-4 flex items-center">
        <Logo />
        <DocsTitle />
      </div>
      <NavigationBar class="hidden md:flex" active={props.active} />
    </header>
  );
}

function Logo() {
  return (
    <a href="." class="flex mr-3 items-center">
      <img
        src="logo.svg"
        alt="PlatformScript logo"
        width={40}
        height={46}
      />
    </a>
  );
}
