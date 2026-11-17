import { Injectable, Logger } from "@nestjs/common";
import type { MusicProvider } from "../music-provider";
import {
  catalogTrackId,
  type CatalogBrowseInput,
  type CatalogProviderStatus,
  type CatalogSearchInput,
  type CatalogTrack,
} from "../catalog.types";

type ITunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
  trackViewUrl?: string;
  primaryGenreName?: string;
};

type ITunesResponse = {
  results?: ITunesTrack[];
};

@Injectable()
export class ItunesProvider implements MusicProvider {
  readonly id = "itunes" as const;
  readonly label = "iTunes";
  private readonly logger = new Logger(ItunesProvider.name);

  status(): CatalogProviderStatus {
    return {
      id: this.id,
      label: this.label,
      enabled: true,
      playback: "preview",
      requiresKey: false,
      configured: true,
    };
  }

  async search(input: CatalogSearchInput): Promise<CatalogTrack[]> {
    const term = [input.query, input.genre].filter(Boolean).join(" ").trim();
    if (!term) return [];
    const limit = Math.min(input.limit ?? 20, 30);
    const params = new URLSearchParams({
      term,
      media: "music",
      entity: "song",
      limit: String(limit),
    });
    const payload = await this.fetchJson<ITunesResponse>(`https://itunes.apple.com/search?${params}`);
    return (payload?.results ?? [])
      .filter((track) => track.trackId && track.trackName)
      .map((track) => this.mapTrack(track));
  }

  async browseGenre(input: CatalogBrowseInput): Promise<CatalogTrack[]> {
    return this.search({ query: input.genre, genre: input.genre, limit: input.limit });
  }

  async trending(limit = 20): Promise<CatalogTrack[]> {
    return this.search({ query: "top hits", limit });
  }

  private mapTrack(track: ITunesTrack): CatalogTrack {
    const providerTrackId = String(track.trackId);
    return {
      id: catalogTrackId(this.id, providerTrackId),
      provider: this.id,
      providerTrackId,
      title: track.trackName,
      artist: track.artistName,
      album: track.collectionName || undefined,
      cover: track.artworkUrl100?.replace("100x100bb", "300x300bb") || track.artworkUrl100,
      duration: track.trackTimeMillis ? Math.round(track.trackTimeMillis / 1000) : undefined,
      genres: track.primaryGenreName ? [track.primaryGenreName.toLowerCase()] : [],
      previewUrl: track.previewUrl || undefined,
      externalUrl: track.trackViewUrl || undefined,
      playback: "preview",
      attribution: "Preview via Apple iTunes Search",
    };
  }

  private async fetchJson<T>(url: string): Promise<T | null> {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        this.logger.warn(`iTunes request failed with status ${response.status}`);
        return null;
      }
      return (await response.json()) as T;
    } catch (error) {
      this.logger.warn(`iTunes request failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
}
