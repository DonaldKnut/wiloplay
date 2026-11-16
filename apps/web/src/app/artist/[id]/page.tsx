"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Headphones, MapPin, Users } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ArtistProfile = {
  id: string;
  name: string;
  followers: number;
  totalListens: number;
  monthlyListens: number;
  tracks: {
    id: string;
    title: string;
    artistName: string;
    genre: string;
    coverUrl: string | null;
    listens: number;
  }[];
  topCities: { city: string; listens: number }[];
};

async function request<T>(path: string, token?: string) {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const response = await fetch(`${API}${path}`, { headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "The artist profile could not be loaded.");
  }
  return response.json() as Promise<T>;
}

export default function ArtistProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const savedToken = localStorage.getItem("sonora-token");
    setToken(savedToken);

    void request<ArtistProfile>(`/artists/${encodeURIComponent(id)}`)
      .then((result) => {
        if (active) setProfile(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "The artist profile could not be loaded.");
      });

    if (savedToken) {
      void request<{ following: boolean }>(
        `/artists/${encodeURIComponent(id)}/follow`,
        savedToken,
      ).then((result) => {
        if (active) setFollowing(result.following);
      }).catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Your follow status could not be checked.");
      });
    }

    return () => {
      active = false;
    };
  }, [id]);

  async function toggleFollow() {
    if (!token) {
      window.location.assign("/?login=1");
      return;
    }
    if (!profile || busy) return;
    setBusy(true);
    setError("");
    try {
      const method = following ? "DELETE" : "PUT";
      const result = await fetch(`${API}/artists/${encodeURIComponent(id)}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!result.ok) {
        const body = await result.json().catch(() => null);
        throw new Error(body?.message ?? "Your follow status could not be updated.");
      }
      const update = await result.json() as { following: boolean; followers: number };
      setFollowing(update.following);
      setProfile((current) => current ? { ...current, followers: update.followers } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your follow status could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  const maxCityListens = Math.max(1, ...((profile?.topCities ?? []).map((city) => city.listens)));

  return (
    <main className="artist-profile-page">
      <header className="artist-profile-topbar">
        <a href="/" className="brand" aria-label="Back to Wiloplay home">
          <span className="brand-mark"><Headphones size={19} /></span>
          <span>wiloplay<span className="brand-dot">.</span></span>
        </a>
        <a href="/" className="artist-profile-back"><ArrowLeft size={15} /> Back to music</a>
      </header>

      <div className="artist-profile-content">
        {error && !profile ? <div className="inline-error" role="alert">{error}</div> : null}
        {!profile && !error ? <p className="artist-profile-loading" role="status">Finding the artist…</p> : null}
        {profile && <>
          <section className="artist-profile-hero">
            <div className="artist-profile-art" aria-hidden="true"><span>♫</span></div>
            <div className="artist-profile-identity">
              <span className="section-kicker">WILOPLAY ARTIST</span>
              <h1>{profile.name}</h1>
              <p>Every listen brings your sound closer to someone new.</p>
            </div>
            <button className={`artist-follow-button${following ? " is-following" : ""}`} onClick={() => void toggleFollow()} disabled={busy}>
              <Users size={15} />
              {!token ? "Sign in to follow" : busy ? "Updating…" : following ? "Following" : "Follow artist"}
            </button>
          </section>

          {error && <div className="inline-error" role="alert">{error}</div>}

          <section className="artist-profile-metrics" aria-label="Artist statistics">
            <article><span>YOUR FANS</span><strong>{profile.followers.toLocaleString()}</strong><small>listeners following</small></article>
            <article><span>QUALIFIED LISTENS</span><strong>{profile.totalListens.toLocaleString()}</strong><small>2+ minutes · all time</small></article>
            <article><span>THIS MONTH</span><strong>{profile.monthlyListens.toLocaleString()}</strong><small>qualified listens</small></article>
            <article><span>YOUR CATALOG</span><strong>{profile.tracks.length.toLocaleString()}</strong><small>released tracks</small></article>
          </section>

          <section className="artist-profile-section">
            <div className="artist-profile-section-heading">
              <div><span className="section-kicker">WHERE THE SOUND TRAVELS</span><h2>Listener cities.</h2></div>
              <span className="artist-profile-privacy"><MapPin size={14} /> Shared by listeners</span>
            </div>
            {profile.topCities.length ? <div className="artist-city-list">
              {profile.topCities.map((item) => <div className="artist-city-row" key={item.city}>
                <span><MapPin size={14} />{item.city}</span>
                <div className="artist-city-bar"><i style={{ width: `${Math.max((item.listens / maxCityListens) * 100, 4)}%` }} /></div>
                <strong>{item.listens.toLocaleString()}</strong>
              </div>)}
            </div> : <p className="artist-profile-empty">City trends will show up when listeners choose to share their city. No precise location is collected.</p>}
          </section>

          <section className="artist-profile-section">
            <div className="artist-profile-section-heading">
              <div><span className="section-kicker">THE MUSIC</span><h2>Tracks finding their people.</h2></div>
              <span className="artist-profile-privacy"><Headphones size={14} /> Plays count after 2 minutes</span>
            </div>
            {profile.tracks.length ? <div className="artist-profile-tracks">
              {profile.tracks.map((track, index) => <article className="artist-profile-track" key={track.id}>
                <span className="artist-track-rank">{String(index + 1).padStart(2, "0")}</span>
                <div className="artist-profile-cover" style={track.coverUrl ? { backgroundImage: `url("${API}${track.coverUrl}")` } : undefined} aria-hidden="true"><Headphones size={18} /></div>
                <div className="artist-profile-track-info"><strong>{track.title}</strong><span>{track.genre} · {track.artistName}</span></div>
                <strong className="artist-track-listens">{track.listens.toLocaleString()} <small>listens</small></strong>
                <a className="artist-track-link" href={`/?track=${encodeURIComponent(track.id)}`} aria-label={`Listen to ${track.title}`}><ArrowUpRight size={17} /></a>
              </article>)}
            </div> : <p className="artist-profile-empty">Your releases will appear here after you upload your first track.</p>}
          </section>

          <p className="artist-profile-earnings">Play analytics are live. Artist payouts are not enabled yet; a per-listen rate still needs to be set.</p>
        </>}
      </div>
    </main>
  );
}
