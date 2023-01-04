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

export default function Footer() {
  return (
    <footer class="border(t-2 gray-200) bg-gray-100 h-32 flex flex-col gap-4 justify-center">
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
