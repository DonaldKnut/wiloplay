"use client";

import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Disc3,
  Pause,
  Play,
  RefreshCw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type AlbumTrack = {
  id: string;
  title: string;
  artistName: string;
  audioUrl: string;
  coverUrl: string | null;
  duration: number | null;
  genre: string;
};

type Album = {
  id: string;
  title: string;
  artistName: string;
  coverUrl: string | null;
  releaseDescription: string | null;
  tracks: AlbumTrack[];
};

function mediaUrl(path: string | null) {
  if (!path) return "";
  return /^https?:\/\//i.test(path) ? path : `${API}${path}`;
}

function formatTime(seconds?: number | null) {
  if (!seconds) return "—:—";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

async function loadAlbum(id: string) {
  const response = await fetch(`${API}/tracks/albums/${encodeURIComponent(id)}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "This album could not be loaded.");
  }
  return response.json() as Promise<Album>;
}

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const albumId = params.id;
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeTrack = album?.tracks.find((track) => track.id === activeTrackId) ?? null;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    loadAlbum(albumId).then((result) => {
      if (active) setAlbum(result);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "This album could not be loaded.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [albumId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) {
      audio?.pause();
      return;
    }
    if (audio.src !== mediaUrl(activeTrack.audioUrl)) {
      audio.src = mediaUrl(activeTrack.audioUrl);
      audio.load();
      setElapsed(0);
      setDuration(0);
    }
    if (playing) {
      void audio.play().catch(() => {
        setPlaying(false);
        setError("This track could not start. Please try another track.");
      });
    } else {
      audio.pause();
    }
  }, [activeTrack, playing]);

  function playTrack(track: AlbumTrack) {
    if (activeTrackId === track.id && audioRef.current) {
      if (playing) {
        setPlaying(false);
      } else {
        if (audioRef.current.ended) audioRef.current.currentTime = 0;
        setPlaying(true);
      }
      return;
    }
    setError("");
    setActiveTrackId(track.id);
    setPlaying(true);
  }

  function moveTrack(direction: -1 | 1) {
    if (!album?.tracks.length) return;
    const index = album.tracks.findIndex((track) => track.id === activeTrackId);
    const nextIndex = index < 0 ? 0 : (index + direction + album.tracks.length) % album.tracks.length;
    setActiveTrackId(album.tracks[nextIndex].id);
    setPlaying(true);
  }

  return (
    <main className="album-page">
      <header className="album-page-header">
        <a className="album-back-link" href="/app"><ArrowLeft size={15} /> Back to Wiloplay</a>
        <a className="album-brand" href="/app"><span><AudioLines size={17} /></span>wiloplay<span className="brand-dot">.</span></a>
      </header>
      {loading ? <div className="album-state"><AudioLines size={22} /><span>Opening the album…</span></div>
        : error && !album ? <div className="album-state album-error"><Disc3 size={28} /><h1>This album is taking a moment.</h1><p>{error}</p><button onClick={() => { setLoading(true); setError(""); loadAlbum(albumId).then(setAlbum).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "This album could not be loaded.")).finally(() => setLoading(false)); }}><RefreshCw size={14} /> Try again</button></div>
          : album ? <>
            <section className="album-hero">
              <div className="album-hero-glow" />
              <img className="album-cover-large" src={mediaUrl(album.coverUrl)} alt={`${album.title} cover`} />
              <div className="album-hero-copy"><span className="section-kicker">WILOPLAY RELEASE</span><p className="album-type-label">Album</p><h1>{album.title}</h1><strong>{album.artistName}</strong><p>{album.releaseDescription || `${album.tracks.length} ${album.tracks.length === 1 ? "track" : "tracks"} from ${album.artistName}.`}</p><div className="album-hero-actions"><button className="album-play-button" onClick={() => album.tracks[0] && playTrack(album.tracks[0])}><Play size={16} fill="currentColor" /> Play album</button><span><Disc3 size={14} /> {album.tracks.length} tracks · Full artist release</span></div></div>
            </section>
            <section className="album-tracks-section" aria-label="Album tracks">
              <div className="album-track-heading"><span>#</span><span>Track</span><span>Genre</span><span>Length</span></div>
              {album.tracks.map((track, index) => {
                const isCurrent = track.id === activeTrackId;
                return <article className={`album-track-row${isCurrent ? " is-current" : ""}`} key={track.id}>
                  <span className="album-track-number">{String(index + 1).padStart(2, "0")}</span>
                  <button className="album-track-play" onClick={() => playTrack(track)} aria-label={`${isCurrent && playing ? "Pause" : "Play"} ${track.title}`}><span className="album-track-overlay">{isCurrent && playing ? <Pause size={13} /> : <Play size={13} />}</span><span className="album-track-info"><strong>{track.title}</strong><small>{track.artistName}</small></span></button>
                  <span className="album-track-genre">{track.genre}</span><span className="album-track-length">{formatTime(track.duration)}</span>
                </article>;
              })}
            </section>
            <footer className="album-page-footer"><span>Full-length music, shared by the artists who made it.</span><a href="/app">Discover more on Wiloplay <ArrowRight size={14} /></a></footer>
          </> : null}
      <audio ref={audioRef} onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)} onDurationChange={(event) => { if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration); }} onEnded={() => { setElapsed(0); if (album && album.tracks.findIndex((track) => track.id === activeTrackId) < album.tracks.length - 1) moveTrack(1); else setPlaying(false); }} onError={() => { if (playing) { setPlaying(false); setError("This track could not be played. Try another track."); } }} />
      {activeTrack && <div className="album-mini-player" aria-label="Album player">
        <img src={mediaUrl(activeTrack.coverUrl ?? album?.coverUrl ?? null)} alt="" />
        <div className="album-mini-info"><strong>{activeTrack.title}</strong><span>{activeTrack.artistName}</span></div>
        <button aria-label="Previous track" onClick={() => moveTrack(-1)}><ArrowLeft size={14} /></button>
        <button className="album-mini-toggle" aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((value) => !value)}>{playing ? <Pause size={15} /> : <Play size={15} />}</button>
        <button aria-label="Next track" onClick={() => moveTrack(1)}><ArrowRight size={14} /></button>
        <div className="album-mini-progress"><span>{formatTime(elapsed)}</span><input aria-label="Seek through track" type="range" min="0" max={duration || 0} step="1" value={Math.min(elapsed, duration || 0)} disabled={!duration} onChange={(event) => { const time = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = time; setElapsed(time); }} /><span>{formatTime(duration || activeTrack.duration)}</span></div>
      </div>}
    </main>
  );
}
