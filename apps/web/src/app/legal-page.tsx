"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, AudioLines, Moon, Sun } from "lucide-react";
import { applyTheme, resolveTheme, type WiloplayTheme } from "./theme-initializer";

type LegalPageProps = {
  label: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export default function LegalPage({
  label,
  title,
  description,
  children,
}: LegalPageProps) {
  const [theme, setTheme] = useState<WiloplayTheme>("dark");

  useEffect(() => {
    const initialTheme = resolveTheme(
      localStorage.getItem("wiloplay-theme"),
      window.matchMedia("(prefers-color-scheme: light)").matches,
    );
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  function toggleTheme() {
    const nextTheme: WiloplayTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem("wiloplay-theme", nextTheme);
  }

  return (
    <main className="legal-shell">
      <header className="legal-header">
        <Link href="/" className="brand" aria-label="Wiloplay home">
          <span className="brand-mark"><AudioLines size={20} /></span>
          <span>wiloplay<span className="brand-dot">.</span></span>
        </Link>
        <nav aria-label="Legal navigation">
          <button className="theme-toggle" type="button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/" className="legal-back"><ArrowLeft size={14} /> Back to Wiloplay</Link>
        </nav>
      </header>

      <div className="legal-content">
        <article className="legal-document">
          <span className="section-kicker">{label}</span>
          <h1>{title}</h1>
          <p className="legal-intro">{description}</p>
          <p className="legal-updated">Effective date: November 17, 2026</p>
          <div className="legal-body">{children}</div>
          <aside className="legal-contact">
            <span className="section-kicker">NEED A HAND?</span>
            <h2>Questions about this document?</h2>
            <p>Contact {`Wiloplay Technologies Limited`} at the address below.</p>
            <a href="mailto:tjblaze52@gmail.com">tjblaze52@gmail.com <ArrowUpRight size={14} /></a>
          </aside>
        </article>
        <footer className="legal-footer">
          <span>Wiloplay Technologies Limited · Lagos, Nigeria</span>
          <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
        </footer>
      </div>
    </main>
  );
}
