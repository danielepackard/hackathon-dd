// Play page has its own layout without navigation and footer for immersive experience
export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

