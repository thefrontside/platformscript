const LINKS = [
  {
    title: "Source",
    href: "https://github.com/thefrontside/platformscript",
  },
  {
    title: "License",
    href: "https://github.com/thefrontside/platformscript/blob/main/LICENSE",
  },
  {
    title: "Code of Conduct",
    href:
      "https://github.com/thefrontside/platformscript/blob/main/CODE_OF_CONDUCT.md",
  },
];

export default function Footer(props: {
  className?: string;
}) {
  let className = props.className ?? "";
  return (
    <footer className={className}>
      <div class="mx-auto max-w-screen-lg flex items-center justify-center gap-8">
        {LINKS.map((link) => (
          <a href={link.href} class="text-gray-600 hover:underline">
            {link.title}
          </a>
        ))}
      </div>
      <div class="text(gray-600 center)">
        <span>© {new Date().getFullYear()} The Frontside Software, Inc.</span>
      </div>
    </footer>
  );
}
