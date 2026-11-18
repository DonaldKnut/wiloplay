"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Music2,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import "./sound.css";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type CatalogTrack = {
  id: string;
  provider: string;
  title: string;
  artist: string;
  cover?: string;
  previewUrl?: string;
  streamUrl?: string;
  playback: "full" | "preview";
  genres: string[];
  attribution?: string;
};

type Mood = {
  id: string;
  label: string;
  sub: string;
  query: string;
  color: string;
};

const MOODS: Mood[] = [
  { id: "sunrise", label: "Sunrise soft", sub: "Warm openings and gentle lift", query: "indie chill acoustic", color: "#d7b27c" },
  { id: "pulse", label: "Night pulse", sub: "Electronic pressure and glow", query: "electronic house", color: "#7fd0ff" },
  { id: "heart", label: "Heart first", sub: "Soul, R&B, and late confessions", query: "soul rnb", color: "#ff8f8f" },
  { id: "velocity", label: "Main character", sub: "Pop voltage for the montage", query: "pop hits", color: "#b5ff72" },
  { id: "earth", label: "Rooted rhythm", sub: "Afrobeats and global bounce", query: "afrobeats", color: "#f0c35a" },
  { id: "depth", label: "Deep focus", sub: "Ambient lanes that hold still", query: "ambient focus", color: "#8fb7ff" },
  { id: "storm", label: "Storm mode", sub: "Rock and metal edge", query: "rock metal", color: "#ffb27a" },
  { id: "jazz", label: "After hours jazz", sub: "Smoke, brass, and low light", query: "jazz late night", color: "#9ad0a2" },
];

function playUrl(track: CatalogTrack) {
  return track.streamUrl || track.previewUrl || "";
}

function providerLabel(provider: string) {
  if (provider === "audius") return "Audius";
  if (provider === "jamendo") return "Jamendo";
  if (provider === "itunes") return "iTunes";
  if (provider === "deezer") return "Deezer";
  return provider;
}

export default function SoundPage() {
  const [genres, setGenres] = useState<string[]>([]);
  const [activeMood, setActiveMood] = useState(MOODS[0]);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [tracks, setTracks] = useState<CatalogTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const loadTracks = useCallback(async (query: string, genre?: string | null) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ q: query, limit: "12" });
      if (genre) params.set("genre", genre);
      const response = await fetch(`${API}/catalog/search?${params.toString()}`);
      if (!response.ok) throw new Error("Discovery is catching its breath.");
      const payload = (await response.json()) as { tracks?: CatalogTrack[] };
      setTracks((payload.tracks ?? []).filter((track) => playUrl(track)));
    } catch (reason) {
      setTracks([]);
      setError(reason instanceof Error ? reason.message : "Discovery is catching its breath.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch(`${API}/catalog/genres`)
      .then((response) => response.json())
      .then((payload: { genres?: string[] }) => setGenres(payload.genres ?? []))
      .catch(() => setGenres(["afrobeats", "electronic", "indie", "jazz", "pop", "rock", "soul", "hiphop"]));
  }, []);

  useEffect(() => {
    void loadTracks(activeMood.query, activeGenre);
  }, [activeMood, activeGenre, loadTracks]);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("is-in");
        }
      },
      { threshold: 0.16 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      setPlaying(false);
      setCurrentId(null);
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  function onStageMove(event: ReactMouseEvent<HTMLDivElement>) {
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 18;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 14;
    setParallax({ x, y });
  }

  async function toggleTrack(track: CatalogTrack) {
    const audio = audioRef.current;
    const url = playUrl(track);
    if (!audio || !url) return;
    if (currentId === track.id) {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        await audio.play();
        setPlaying(true);
      }
      return;
    }
    audio.src = url;
    setCurrentId(track.id);
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setError("This track could not start. Try another.");
    }
  }

  return (
    <main className="sound-page">
      <div className="sound-stars" aria-hidden="true" />
      <div className="sound-grain" aria-hidden="true" />
      <audio ref={audioRef} preload="none" />

      <div className="sound-shell">
        <header className="sound-nav">
          <Link href="/app" className="sound-brand" aria-label="Wiloplay app">
            <span className="sound-brand-mark"><AudioLines size={18} /></span>
            <span>wiloplay<span className="sound-brand-dot">.</span></span>
          </Link>
          <div className="sound-nav-actions">
            <Link href="/app" className="sound-nav-link"><ArrowLeft size={15} /><span>Back to music</span></Link>
            <a href="#listening" className="sound-cta">Start listening <ArrowRight size={15} /></a>
          </div>
        </header>

        <section className="sound-hero">
          <div className="sound-hero-copy">
            <p className="sound-kicker">A listening journey</p>
            <h1>
              Find your
              <br />
              <em>sound.</em>
            </h1>
            <p className="sound-hero-lead">
              Less endless scroll. More instinct. Follow a mood, catch a genre current, and land on music that actually feels like you.
            </p>
            <div className="sound-hero-actions">
              <a className="sound-cta" href="#moods">Enter the atlas <Sparkles size={15} /></a>
              <Link className="sound-ghost" href="/#shows">Meet us at the show</Link>
            </div>
          </div>

          <div
            className="sound-stage"
            ref={stageRef}
            onMouseMove={onStageMove}
            onMouseLeave={() => setParallax({ x: 0, y: 0 })}
            aria-hidden="true"
          >
            <div className="sound-orb" style={{ transform: `translate3d(${parallax.x * 0.4}px, ${parallax.y * 0.4}px, 0)` }} />
            <div className="sound-ring sound-ring-a" />
            <div className="sound-ring sound-ring-b" />
            <div className="sound-ring sound-ring-c" />
            <div
              className="sound-vinyl"
              style={{
                transform: `rotateX(${18 + parallax.y * 0.4}deg) rotateY(${-18 + parallax.x * 0.45}deg)`,
              }}
            >
              <div className="sound-vinyl-label">WP</div>
            </div>
            <div className="sound-wave" aria-hidden="true">
              <span /><span /><span /><span /><span /><span /><span />
            </div>
            <Music2 className="sound-note sound-note-1" size={28} />
            <Music2 className="sound-note sound-note-2" size={22} />
            <Music2 className="sound-note sound-note-3" size={24} />
            <span className="sound-satellite" />
          </div>
        </section>

        <section className="sound-section" id="moods" data-reveal>
          <div className="sound-section-head">
            <span className="sound-pill">01 · Mood atlas</span>
            <h2>Pick the weather inside your head.</h2>
            <p>Each mood opens a lane across free full streams and commercial previews. Tap one and the room rearranges around that feeling.</p>
          </div>
          <div className="sound-moods">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                type="button"
                className={`sound-mood${activeMood.id === mood.id ? " is-active" : ""}`}
                style={{ "--mood": mood.color } as CSSProperties}
                onMouseMove={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  event.currentTarget.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
                  event.currentTarget.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
                }}
                onClick={() => {
                  setActiveMood(mood);
                  setActiveGenre(null);
                  document.getElementById("listening")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="sound-mood-visual"><span className="sound-mood-orb" /></div>
                <div>
                  <strong>{mood.label}</strong>
                  <span>{mood.sub}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="sound-section" data-reveal>
          <div className="sound-section-head">
            <span className="sound-pill">02 · Genre current</span>
            <h2>Ride a genre current.</h2>
            <p>Layer a genre over your mood for sharper discovery. These come from Wiloplay&apos;s multi-provider catalog.</p>
          </div>
          <div className="sound-genres" aria-label="Browse genres">
            <button
              type="button"
              className={`sound-genre${!activeGenre ? " is-active" : ""}`}
              onClick={() => setActiveGenre(null)}
            >
              Any genre
            </button>
            {genres.map((genre) => (
              <button
                key={genre}
                type="button"
                className={`sound-genre${activeGenre === genre ? " is-active" : ""}`}
                onClick={() => {
                  setActiveGenre(genre);
                  document.getElementById("listening")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {genre}
              </button>
            ))}
          </div>
        </section>

        <section className="sound-section" id="listening" data-reveal>
          <div className="sound-section-head">
            <span className="sound-pill">03 · Now spinning</span>
            <h2>
              {activeMood.label}
              {activeGenre ? ` · ${activeGenre}` : ""}
            </h2>
            <p>Playable music from Audius, Jamendo, Deezer, and iTunes — normalized into one listening surface.</p>
          </div>
          {loading && <p className="sound-status">Tuning the room…</p>}
          {!loading && error && <p className="sound-status">{error}</p>}
          {!loading && !error && !tracks.length && (
            <p className="sound-empty">Nothing landed in this lane yet. Try another mood or genre.</p>
          )}
          <div className="sound-tracks">
            {tracks.map((track) => {
              const isCurrent = currentId === track.id;
              return (
                <article key={track.id} className={`sound-track${isCurrent ? " is-current" : ""}`}>
                  {track.cover
                    ? <img className="sound-cover" src={track.cover} alt="" />
                    : <div className="sound-cover" aria-hidden="true" />}
                  <div className="sound-track-meta">
                    <strong>{track.title}</strong>
                    <span>
                      {track.artist} · {providerLabel(track.provider)} · {track.playback === "full" ? "Full" : "Preview"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="sound-play"
                    aria-label={`${isCurrent && playing ? "Pause" : "Play"} ${track.title}`}
                    onClick={() => void toggleTrack(track)}
                  >
                    {isCurrent && playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="sound-section" data-reveal>
          <div className="sound-section-head">
            <span className="sound-pill">04 · The ritual</span>
            <h2>How the feeling finds you.</h2>
            <p>Three quiet moves. No dashboard chaos. Just a cleaner path from curiosity to play.</p>
          </div>
          <div className="sound-ritual">
            <article className="sound-step">
              <div className="sound-step-art"><div className="sound-illus-pulse" /></div>
              <h3>Sense</h3>
              <p>Start with mood, not metadata. Name the weather in your chest and let the atlas answer.</p>
            </article>
            <article className="sound-step">
              <div className="sound-step-art"><div className="sound-illus-bars"><i /><i /><i /><i /><i /></div></div>
              <h3>Hear</h3>
              <p>Full free streams and sharp previews arrive in one lane, so you can listen before you commit.</p>
            </article>
            <article className="sound-step">
              <div className="sound-step-art"><div className="sound-illus-orbit" /></div>
              <h3>Belong</h3>
              <p>When a track sticks, follow it home — artists, shows, and people who hear the same frequency.</p>
            </article>
          </div>
        </section>

        <section className="sound-finale" data-reveal>
          <div>
            <span className="sound-pill">Keep going</span>
            <h2>Your next favorite is already warming up.</h2>
            <p>Carry this feeling back into Wiloplay — save it, share it, or meet the room where it gets loud.</p>
            <div className="sound-hero-actions">
              <Link className="sound-cta" href="/?login=1">Open Wiloplay <ArrowRight size={15} /></Link>
              <Link className="sound-ghost" href="/#shows">Find a live show</Link>
            </div>
          </div>
          <div className="sound-finale-art" aria-hidden="true">
            <div className="sound-orb" />
            <div className="sound-ring sound-ring-a" />
            <div className="sound-ring sound-ring-b" />
            <div className="sound-vinyl">
              <div className="sound-vinyl-label">GO</div>
            </div>
            <div className="sound-wave"><span /><span /><span /><span /><span /><span /><span /></div>
          </div>
        </section>
      </div>
    </main>
  );
}
