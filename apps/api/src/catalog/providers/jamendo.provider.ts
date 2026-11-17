import { Injectable, Logger } from "@nestjs/common";
import type { MusicProvider } from "../music-provider";
import {
  catalogTrackId,
  type CatalogBrowseInput,
  type CatalogProviderStatus,
  type CatalogSearchInput,
  type CatalogTrack,
} from "../catalog.types";

type JamendoTrack = {
  id: string;
  name: string;
  duration: number;
  artist_name: string;
  album_name?: string;
  image?: string;
  audio?: string;
  shareurl?: string;
  license_ccurl?: string;
  musicinfo?: { tags?: { genres?: string[] } };
};

type JamendoResponse = {
  results?: JamendoTrack[];
};

@Injectable()
export class JamendoProvider implements MusicProvider {
  readonly id = "jamendo" as const;
  readonly label = "Jamendo";
  private readonly logger = new Logger(JamendoProvider.name);

  status(): CatalogProviderStatus {
    const configured = Boolean(process.env.JAMENDO_CLIENT_ID?.trim());
    return {
      id: this.id,
      label: this.label,
      enabled: configured,
      playback: "full",
      requiresKey: true,
      configured,
    };
  }

  async search(input: CatalogSearchInput): Promise<CatalogTrack[]> {
    if (!this.status().configured) return [];
    const clientId = process.env.JAMENDO_CLIENT_ID!.trim();
    const limit = Math.min(input.limit ?? 20, 30);
    const params = new URLSearchParams({
      client_id: clientId,
      format: "json",
      limit: String(limit),
      include: "musicinfo",
      audioformat: "mp32",
    });
    if (input.query.trim()) params.set("search", input.query.trim());
    if (input.genre?.trim()) params.set("tags", input.genre.trim().toLowerCase());
    const payload = await this.fetchJson<JamendoResponse>(`tracks/?${params.toString()}`);
    return (payload?.results ?? []).map((track) => this.mapTrack(track));
  }

  async browseGenre(input: CatalogBrowseInput): Promise<CatalogTrack[]> {
    return this.search({ query: "", genre: input.genre, limit: input.limit });
  }

  async trending(limit = 20): Promise<CatalogTrack[]> {
    if (!this.status().configured) return [];
    const clientId = process.env.JAMENDO_CLIENT_ID!.trim();
    const params = new URLSearchParams({
      client_id: clientId,
      format: "json",
      limit: String(Math.min(limit, 30)),
      order: "popularity_total",
      include: "musicinfo",
      audioformat: "mp32",
    });
    const payload = await this.fetchJson<JamendoResponse>(`tracks/?${params.toString()}`);
    return (payload?.results ?? []).map((track) => this.mapTrack(track));
  }

  private mapTrack(track: JamendoTrack): CatalogTrack {
    const providerTrackId = String(track.id);
    const genres = (track.musicinfo?.tags?.genres ?? []).map((genre) => genre.toLowerCase());
    return {
      id: catalogTrackId(this.id, providerTrackId),
      provider: this.id,
      providerTrackId,
      title: track.name,
      artist: track.artist_name,
      album: track.album_name || undefined,
      cover: track.image || undefined,
      duration: track.duration,
      genres,
      streamUrl: track.audio || undefined,
      previewUrl: track.audio || undefined,
      externalUrl: track.shareurl || undefined,
      playback: "full",
      attribution: track.license_ccurl
        ? `Jamendo · ${track.license_ccurl}`
        : "Creative Commons via Jamendo",
    };
  }

  private async fetchJson<T>(path: string): Promise<T | null> {
    try {
      const response = await fetch(`https://api.jamendo.com/v3.0/${path}`, {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        this.logger.warn(`Jamendo request failed with status ${response.status}`);
        return null;
      }
      return (await response.json()) as T;
    } catch (error) {
      this.logger.warn(`Jamendo request failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
}
