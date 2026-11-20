import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Disc3,
  Headphones,
  Mic2,
  Music2,
  Search,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";

const featureCards = [
  {
    icon: Search,
    number: "01",
    title: "Find the sound that finds you.",
    description:
      "Explore Wiloplay releases and connected music catalogs in one welcoming place.",
  },
  {
    icon: Users,
    number: "02",
    title: "Get closer to the artists.",
    description:
      "Follow the people behind the music, keep your favorites close, and discover what they share next.",
  },
  {
    icon: Ticket,
    number: "03",
    title: "Take the feeling offline.",
    description:
      "See live shows and ticket details, then meet the music where it happens.",
  },
];

const faqs = [
  {
    question: "What is Wiloplay?",
    answer:
      "Wiloplay is a place to discover music, follow artists, save tracks, and find live shows. The listening app is available from the Open the app button.",
  },
  {
    question: "Can I listen to every track in full?",
    answer:
      "Playback depends on the source. Some catalogs offer full streams, while others provide short previews. Availability and playback terms are set by each provider.",
  },
  {
    question: "How do artists get started?",
    answer:
      "Create a Wiloplay account, verify your email, and choose the artist tools in the app to set up a profile and share releases.",
  },
  {
    question: "Can I save music for later?",
    answer:
      "Yes. Sign in to like tracks and build playlists. Your library follows your account when you return to Wiloplay.",
  },
  {
    question: "Does Wiloplay work offline?",
    answer:
      "You can install Wiloplay as an app and get an offline fallback screen. Music catalogs, account features, ticket information, and streaming need an internet connection.",
  },
];

const waveformHeights = Array.from({ length: 32 }, (_, index) => 16 + ((index * 19) % 46));

export default function MarketingHomePage() {
  return (
    <main className="marketing-page">
      <a className="marketing-skip-link" href="#marketing-main">
        Skip to content
      </a>
      <header className="marketing-nav">
        <Link className="marketing-brand" href="/" aria-label="Wiloplay home">
          <span className="marketing-brand-mark"><AudioLines size={19} /></span>
          <span>wiloplay<span className="marketing-brand-dot">.</span></span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#why-wiloplay">Why Wiloplay</a>
          <a href="#for-artists">For artists</a>
          <a href="#questions">FAQs</a>
        </nav>
        <Link className="marketing-nav-cta" href="/app">
          Open the app <ArrowUpRight size={15} />
        </Link>
      </header>

      <div id="marketing-main">
        <section className="marketing-hero" aria-labelledby="marketing-title">
          <div className="marketing-hero-copy">
            <span className="marketing-eyebrow"><span /> A HOME FOR MUSIC PEOPLE</span>
            <h1 id="marketing-title">Music finds<br />its <em>people.</em></h1>
            <p>
              Less scrolling, more feeling. Find your next favorite, get closer
              to the artists you love, and meet us at the show.
            </p>
            <div className="marketing-hero-actions">
              <Link className="marketing-primary-cta" href="/app">
                Open Wiloplay <ArrowRight size={16} />
              </Link>
              <a className="marketing-secondary-cta" href="#why-wiloplay">
                See what you can do
              </a>
            </div>
            <div className="marketing-hero-proof">
              <span className="marketing-proof-icons" aria-hidden="true">
                <Music2 size={15} /><Headphones size={15} /><Mic2 size={15} />
              </span>
              <span>Discover. Connect. Show up.</span>
            </div>
          </div>

          <div className="marketing-visual" aria-hidden="true">
            <div className="marketing-visual-orbit orbit-one" />
            <div className="marketing-visual-orbit orbit-two" />
            <div className="marketing-disc">
              <div className="marketing-disc-grooves" />
              <div className="marketing-disc-label"><AudioLines size={29} /></div>
            </div>
            <div className="marketing-now-card">
              <div className="marketing-now-card-top"><span>WILOPLAY RADIO</span><span className="marketing-live-dot" /></div>
              <div className="marketing-now-art"><Disc3 size={25} /></div>
              <div className="marketing-now-title">Good things, on repeat.</div>
              <div className="marketing-now-subtitle">A new favorite is waiting</div>
              <div className="marketing-waveform">
                {waveformHeights.map((height, index) => (
                  <span
                    key={index}
                    style={{ height: `${height}px`, animationDelay: `${index * 32}ms` }}
                  />
                ))}
              </div>
            </div>
            <div className="marketing-float-card float-card-left">
              <span className="marketing-float-icon"><Sparkles size={15} /></span>
              <span><small>YOUR NEXT REPEAT</small><strong>Made for your mood</strong></span>
            </div>
            <div className="marketing-float-card float-card-right">
              <span className="marketing-float-icon"><Mic2 size={15} /></span>
              <span><small>MADE BY PEOPLE</small><strong>Closer to the artist</strong></span>
            </div>
            <span className="marketing-star star-one"><Sparkles size={16} /></span>
            <span className="marketing-star star-two"><Sparkles size={13} /></span>
          </div>

          <div className="marketing-hero-bottom">
            <span>INDEPENDENT SOUNDS, OPEN DOORS</span>
            <a href="#why-wiloplay">Scroll to explore <ArrowDown size={13} /></a>
          </div>
        </section>

        <section className="marketing-ticker" aria-label="Wiloplay highlights">
          <div className="marketing-ticker-track">
            {Array.from({ length: 2 }, (_, repeat) => (
              <span className="marketing-ticker-group" key={repeat} aria-hidden={repeat === 1}>
                <span>DISCOVER</span><AudioLines size={17} />
                <span>FOLLOW THE FEELING</span><Disc3 size={17} />
                <span>MEET AT THE SHOW</span><Music2 size={17} />
                <span>FIND YOUR PEOPLE</span><AudioLines size={17} />
              </span>
            ))}
          </div>
        </section>

        <section className="marketing-features" id="why-wiloplay">
          <div className="marketing-section-heading">
            <span className="marketing-eyebrow">A DIFFERENT KIND OF MUSIC APP</span>
            <h2>More than a playlist.<br /><em>A place to belong.</em></h2>
            <p>
              Built around the feeling music gives you — and the people who make
              it.
            </p>
          </div>
          <div className="marketing-feature-grid">
            {featureCards.map(({ icon: Icon, number, title, description }) => (
              <article className="marketing-feature-card" key={number}>
                <div className="marketing-feature-card-top">
                  <span>{number} / THE WILOPLAY WAY</span>
                  <Icon size={20} />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="marketing-feature-line" />
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-artist" id="for-artists">
          <div className="marketing-artist-art" aria-hidden="true">
            <span className="artist-art-ring ring-one" />
            <span className="artist-art-ring ring-two" />
            <span className="artist-art-disc"><AudioLines size={30} /></span>
            <span className="artist-art-spark"><Sparkles size={21} /></span>
          </div>
          <div className="marketing-artist-copy">
            <span className="marketing-eyebrow">FOR THE ONES MAKING THE MUSIC</span>
            <h2>Your music deserves<br />to be <em>out there.</em></h2>
            <p>
              Build your artist presence, share your releases, and bring your
              community closer to what you create.
            </p>
            <Link className="marketing-primary-cta" href="/app">
              Start your artist journey <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="marketing-faq" id="questions">
          <div className="marketing-section-heading">
            <span className="marketing-eyebrow">GOOD QUESTIONS</span>
            <h2>Before the first song.</h2>
            <p>Everything you need to know before you find your next favorite.</p>
          </div>
          <div className="marketing-faq-list">
            {faqs.map(({ question, answer }) => (
              <details className="marketing-faq-item" key={question}>
                <summary>{question}<span aria-hidden="true" /></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="marketing-last-call">
          <div className="marketing-last-glow" aria-hidden="true" />
          <span className="marketing-eyebrow">YOUR NEXT FAVORITE IS OUT THERE</span>
          <h2>Come find it.</h2>
          <p>Good music. Good people. That&apos;s it.</p>
          <Link className="marketing-primary-cta" href="/app">
            Step inside Wiloplay <ArrowRight size={16} />
          </Link>
          <div className="marketing-last-note" aria-hidden="true"><AudioLines size={18} /></div>
        </section>
      </div>

      <footer className="marketing-footer">
        <Link className="marketing-brand" href="/" aria-label="Wiloplay home">
          <span className="marketing-brand-mark"><AudioLines size={18} /></span>
          <span>wiloplay<span className="marketing-brand-dot">.</span></span>
        </Link>
        <span>Made for music people. Wherever you find them.</span>
        <nav aria-label="Legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/app">Open the app <ArrowUpRight size={13} /></Link>
        </nav>
      </footer>
    </main>
  );
}
