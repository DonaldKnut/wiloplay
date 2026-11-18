"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BadgeCheck,
  QrCode,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { useEffect, useState } from "react";
import "./tickets.css";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type EventItem = {
  id: string;
  title: string;
  artistName: string;
  venue: string;
  city: string;
  startsAt: string;
  priceCents: number;
  capacity: number;
  ticketsSold: number;
  coverUrl: string | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatPrice(cents: number) {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function mediaUrl(path: string | null) {
  if (!path) return "";
  return /^https?:\/\//i.test(path) ? path : `${API}${path}`;
}

export default function TicketsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("is-in");
        }
      },
      { threshold: 0.14 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`${API}/events`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Shows are taking a short pause.");
        return response.json() as Promise<EventItem[]>;
      })
      .then((payload) => {
        if (!active) return;
        const upcoming = payload
          .filter((event) => new Date(event.startsAt).getTime() > Date.now())
          .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
          .slice(0, 6);
        setEvents(upcoming);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Shows are taking a short pause.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="tickets-page">
      <div className="tickets-glow" aria-hidden="true" />
      <div className="tickets-grain" aria-hidden="true" />

      <div className="tickets-shell">
        <header className="tickets-nav">
          <Link href="/" className="tickets-brand" aria-label="Wiloplay home">
            <span className="tickets-brand-mark"><AudioLines size={18} /></span>
            <span>wiloplay<span className="tickets-brand-dot">.</span></span>
          </Link>
          <div className="tickets-nav-actions">
            <Link href="/" className="tickets-link"><ArrowLeft size={15} /><span>Back home</span></Link>
            <Link href="/#shows" className="tickets-cta">Browse shows <ArrowRight size={15} /></Link>
          </div>
        </header>

        <section className="tickets-hero">
          <div>
            <p className="tickets-kicker">Tickets, made clear</p>
            <h1>
              Walk in
              <br />
              <em>ready.</em>
            </h1>
            <p className="tickets-lead">
              A calm path from show to door: pick a night, pay cleanly, keep your QR close, and let the room do the rest.
            </p>
            <div className="tickets-hero-actions">
              <a className="tickets-cta" href="#how">See how tickets work <ShieldCheck size={15} /></a>
              <Link className="tickets-ghost" href="/#my-tickets">My tickets</Link>
            </div>
          </div>

          <div className="tickets-stage" aria-hidden="true">
            <div className="tickets-orb" />
            <div className="tickets-card">
              <div className="tickets-card-top">
                <span className="tickets-card-badge">Entry ready</span>
                <div className="tickets-qr" />
              </div>
              <h3>Night Session</h3>
              <p>Lagos · Rooftop room · Doors 8:00</p>
              <div className="tickets-card-meta">
                <span><small>Guest</small><strong>You +1</strong></span>
                <span><small>Status</small><strong>Confirmed</strong></span>
              </div>
            </div>
            <div className="tickets-stub" />
          </div>
        </section>

        <section className="tickets-section" id="how" data-reveal>
          <div className="tickets-section-head">
            <span className="tickets-chip">01 · The path</span>
            <h2>Four quiet steps to the door.</h2>
            <p>No mystery fees mid-flow. No screenshot scavenger hunt. Just a ticket that behaves.</p>
          </div>
          <div className="tickets-steps">
            <article className="tickets-step">
              <div className="tickets-step-num">01</div>
              <div className="tickets-step-art"><div className="tickets-art-dot" /></div>
              <h3>Choose the night</h3>
              <p>Browse live shows by city, artist, and vibe. See date, venue, and starting price up front.</p>
            </article>
            <article className="tickets-step">
              <div className="tickets-step-num">02</div>
              <div className="tickets-step-art"><div className="tickets-art-bars"><i /><i /><i /><i /></div></div>
              <h3>Pick your tier</h3>
              <p>Artists can offer categories with their own prices and inventory. You choose what fits the night.</p>
            </article>
            <article className="tickets-step">
              <div className="tickets-step-num">03</div>
              <div className="tickets-step-art"><div className="tickets-art-scan" /></div>
              <h3>Pay with clarity</h3>
              <p>Demo mode for testing, or Paystack bank transfer for real tickets. Exact amount. Verified before issue.</p>
            </article>
            <article className="tickets-step">
              <div className="tickets-step-num">04</div>
              <div className="tickets-step-art"><div className="tickets-art-check"><BadgeCheck size={22} /></div></div>
              <h3>Show your QR</h3>
              <p>Confirmed tickets live in My tickets with downloadable QR codes for door check-in.</p>
            </article>
          </div>
        </section>

        <section className="tickets-section" data-reveal>
          <div className="tickets-section-head">
            <span className="tickets-chip">02 · What you get</span>
            <h2>Everything that matters, nothing that clutters.</h2>
            <p>Tickets on Wiloplay are built for trust between artists and the people who show up.</p>
          </div>
          <div className="tickets-grid">
            <article className="tickets-panel">
              <h3>For listeners</h3>
              <ul>
                <li>Clear pricing in Nigerian naira</li>
                <li>Booking reference you can trust</li>
                <li>QR entry codes after payment confirms</li>
                <li>Countdown to showtime in one place</li>
              </ul>
            </article>
            <article className="tickets-panel">
              <h3>For artists</h3>
              <ul>
                <li>Ticket categories with separate inventory</li>
                <li>Verified payments before tickets issue</li>
                <li>Door check-in by QR or code</li>
                <li>Updates emailed to paid holders</li>
              </ul>
            </article>
            <article className="tickets-panel">
              <h3>Fees, stated plainly</h3>
              <p>
                Event prices are set by artists. Each paid order includes Wiloplay&apos;s existing 10% fee in the exact transfer amount.
                No surprise add-ons at the door.
              </p>
            </article>
          </div>
        </section>

        <section className="tickets-section" id="shows" data-reveal>
          <div className="tickets-section-head">
            <span className="tickets-chip">03 · On the board</span>
            <h2>Nights you can still catch.</h2>
            <p>Live upcoming shows from Wiloplay. Tap through to book on the home experience.</p>
          </div>
          {loading && <p className="tickets-status">Finding the next rooms…</p>}
          {!loading && error && <p className="tickets-status">{error}</p>}
          {!loading && !error && !events.length && (
            <p className="tickets-empty">No upcoming shows yet. Artists are still setting the rooms.</p>
          )}
          <div className="tickets-shows">
            {events.map((event) => {
              const soldOut = event.ticketsSold >= event.capacity;
              return (
                <Link
                  key={event.id}
                  href={`/app?event=${encodeURIComponent(event.id)}#shows`}
                  className="tickets-show"
                >
                  {event.coverUrl
                    ? <img className="tickets-show-cover" src={mediaUrl(event.coverUrl)} alt="" />
                    : <div className="tickets-show-cover" aria-hidden="true" />}
                  <div className="tickets-show-meta">
                    <strong>{event.title}</strong>
                    <span>
                      {event.artistName} · {event.city} · {formatDate(event.startsAt)} · {formatPrice(event.priceCents)}
                      {event.priceCents ? " +" : ""}{event.priceCents ? " 10% fee" : ""}
                    </span>
                  </div>
                  <span className="tickets-cta">
                    {soldOut ? "Sold out" : "Get tickets"} <ArrowRight size={14} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="tickets-section" data-reveal>
          <div className="tickets-section-head">
            <span className="tickets-chip">04 · Good to know</span>
            <h2>Answers before you need them.</h2>
            <p>A few calm details so the night feels easy from the first tap.</p>
          </div>
          <div className="tickets-faq">
            <details open>
              <summary>When do I receive my QR code?</summary>
              <p>After payment is confirmed. In demo mode tickets are labeled clearly and issued for testing. With Paystack, tickets issue only after the exact amount is verified.</p>
            </details>
            <details>
              <summary>Where do my tickets live?</summary>
              <p>In My tickets on the home page. You can download each QR, keep the booking reference, and watch the countdown to showtime.</p>
            </details>
            <details>
              <summary>What happens after showtime?</summary>
              <p>Past shows leave the active lists at showtime. Ticket and payment records stay preserved for history and check-in records.</p>
            </details>
            <details>
              <summary>Can artists message ticket holders?</summary>
              <p>Yes. Artists can send email updates to paid ticket holders when SMTP is configured — useful for door times, venue notes, or schedule changes.</p>
            </details>
          </div>
        </section>

        <section className="tickets-finale" data-reveal>
          <div>
            <span className="tickets-chip">Ready when you are</span>
            <h2>Save the night. Keep the proof. Walk in calm.</h2>
            <p>Browse live shows, reserve your spot, and keep every QR where you can find it.</p>
            <div className="tickets-hero-actions">
              <Link className="tickets-cta" href="/#shows">Browse live shows <Ticket size={15} /></Link>
              <Link className="tickets-ghost" href="/#my-tickets"><QrCode size={15} /> Open my tickets</Link>
            </div>
          </div>
          <div className="tickets-finale-art" aria-hidden="true">
            <div className="tickets-orb" />
            <div className="tickets-card">
              <div className="tickets-card-top">
                <span className="tickets-card-badge">Wiloplay</span>
                <div className="tickets-qr" />
              </div>
              <h3>Your seat</h3>
              <p>Confirmed · Ready for entry</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
