import type { Metadata } from "next";
import "./globals.css";
import "./wiloplay-theme.css";

export const metadata: Metadata = {
  title: "Wiloplay — music finds its people",
  description:
    "Discover your next favorite song, support the artists you love, and find your people at a live show.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
