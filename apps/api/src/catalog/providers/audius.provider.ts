import { Injectable, Logger } from "@nestjs/common";
import type { MusicProvider } from "../music-provider";
import {
  catalogTrackId,
  type CatalogBrowseInput,
  type CatalogProviderStatus,
  type CatalogSearchInput,
  type CatalogTrack,
} from "../catalog.types";

type AudiusTrack = {
  id: string;
  title: string;
  duration?: number;
  genre?: string;
  mood?: string;
  permalink?: string;
  artwork?: { "150x150"?: string; "480x480"?: string } | null;
  user?: { name?: string; handle?: string };
};

type AudiusResponse = {
  data?: AudiusTrack[];
};

const AUDIUS_HOSTS = [
  "https://discoveryprovider.audius.co",
  "https://api.audius.co",
];

@Injectable()
export class AudiusProvider implements MusicProvider {
  readonly id = "audius" as const;
  readonly label = "Audius";
  private readonly logger = new Logger(AudiusProvider.name);
  private readonly appName = encodeURIComponent("wiloplay");

  status(): CatalogProviderStatus {
    return {
      id: this.id,
      label: this.label,
      enabled: true,
      playback: "full",
      requiresKey: false,
      configured: true,
    };
  }

  async search(input: CatalogSearchInput): Promise<CatalogTrack[]> {
    const query = [input.query, input.genre].filter(Boolean).join(" ").trim();
    if (!query) return [];
    const limit = Math.min(input.limit ?? 20, 30);
    const path = `/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&app_name=${this.appName}`;
    const payload = await this.fetchJson<AudiusResponse>(path);
    return (payload?.data ?? []).map((track) => this.mapTrack(track));
  }

  async browseGenre(input: CatalogBrowseInput): Promise<CatalogTrack[]> {
    return this.search({ query: input.genre, genre: input.genre, limit: input.limit });
  }

  async trending(limit = 20): Promise<CatalogTrack[]> {
    const path = `/v1/tracks/trending?limit=${Math.min(limit, 30)}&app_name=${this.appName}`;
    const payload = await this.fetchJson<AudiusResponse>(path);
    return (payload?.data ?? []).map((track) => this.mapTrack(track));
  }

  private mapTrack(track: AudiusTrack): CatalogTrack {
    const providerTrackId = String(track.id);
    const genres = [track.genre, track.mood]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.trim().toLowerCase());
    return {
      id: catalogTrackId(this.id, providerTrackId),
      provider: this.id,
      providerTrackId,
      title: track.title,
      artist: track.user?.name || track.user?.handle || "Unknown artist",
      cover: track.artwork?.["480x480"] || track.artwork?.["150x150"] || undefined,
      duration: track.duration,
      genres,
      streamUrl: `https://api.audius.co/v1/tracks/${encodeURIComponent(providerTrackId)}/stream?app_name=${this.appName}`,
      externalUrl: track.permalink ? `https://audius.co${track.permalink}` : undefined,
      playback: "full",
      attribution: "Streamed via Audius",
    };
  }

  private async fetchJson<T>(path: string): Promise<T | null> {
    for (const host of AUDIUS_HOSTS) {
      try {
        const response = await fetch(`${host}${path}`, {
          signal: AbortSignal.timeout(8000),
          headers: { Accept: "application/json" },
        });
        if (!response.ok) continue;
        return (await response.json()) as T;
      } catch (error) {
        this.logger.warn(`Audius host failed (${host}): ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return null;
  }
}
