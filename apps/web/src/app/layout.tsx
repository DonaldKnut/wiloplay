import type { Metadata } from "next";
import Script from "next/script";
import ServiceWorkerRegistration from "./service-worker-registration";
import ThemeInitializer from "./theme-initializer";
import "./globals.css";
import "./wiloplay-theme.css";

export const metadata: Metadata = {
  title: "Wiloplay — music finds its people",
  description:
    "Discover your next favorite song, support the artists you love, and find your people at a live show.",
  icons: { icon: "/icon.svg" },
  manifest: "/manifest.webmanifest",
  applicationName: "Wiloplay",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wiloplay",
  },
};

const themeBootScript = `(() => {
  try {
    const stored = localStorage.getItem("wiloplay-theme");
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const theme = stored === "light" || stored === "dark" ? stored : (prefersLight ? "light" : "dark");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="wiloplay-theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
        <ThemeInitializer />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
