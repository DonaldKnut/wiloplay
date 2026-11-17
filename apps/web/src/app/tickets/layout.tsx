import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tickets — Wiloplay",
  description:
    "Understand Wiloplay tickets in one calm place: choose a show, pay securely, get your QR, and walk in ready.",
};

export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
