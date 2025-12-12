import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/configure", label: "Configure Game" },
  { href: "/play", label: "Play" },
];

export default function Navigation() {
  return (
    <nav className="border-b border-gray-200 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🎲 D&D Voice Agent
          </Link>
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
