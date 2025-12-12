"use client";

import { usePathname } from "next/navigation";
import Navigation from "./Navigation";
import Footer from "./Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPlayPage = pathname === "/play";

  if (isPlayPage) {
    // Play page: no navigation or footer for immersive experience
    return <>{children}</>;
  }

  // Other pages: include navigation and footer
  return (
    <>
      <Navigation />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}

