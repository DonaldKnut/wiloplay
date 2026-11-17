import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find your sound — Wiloplay",
  description:
    "An immersive Wiloplay listening journey. Follow moods and genres across free streams and previews until the music feels like yours.",
};

export default function SoundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
