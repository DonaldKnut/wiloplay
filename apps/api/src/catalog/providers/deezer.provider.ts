import { Injectable } from "@nestjs/common";
import { DeezerService } from "../../deezer/deezer.service";
import type { MusicProvider } from "../music-provider";
import {
  catalogTrackId,
  type CatalogBrowseInput,
  type CatalogProviderStatus,
  type CatalogSearchInput,
  type CatalogTrack,
} from "../catalog.types";

@Injectable()
export class DeezerCatalogProvider implements MusicProvider {
  readonly id = "deezer" as const;
  readonly label = "Deezer";

  constructor(private readonly deezer: DeezerService) {}

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
    const query = [input.query, input.genre].filter(Boolean).join(" ").trim() || "indie";
    const results = await this.deezer.search(query);
    return results.slice(0, input.limit ?? 20).map((track) => this.mapTrack(track, input.genre));
  }

  async browseGenre(input: CatalogBrowseInput): Promise<CatalogTrack[]> {
    return this.search({ query: input.genre, genre: input.genre, limit: input.limit });
  }

  async trending(limit = 20): Promise<CatalogTrack[]> {
    const chart = await this.deezer.chart();
    return chart.tracks.slice(0, limit).map((track) => this.mapTrack(track));
  }

  private mapTrack(
    track: {
      id: number;
      title: string;
      artist: string;
      album: string;
      cover: string;
      preview?: string;
      duration: number;
      deezerUrl: string;
    },
    genre?: string,
  ): CatalogTrack {
    const providerTrackId = String(track.id);
    return {
      id: catalogTrackId(this.id, providerTrackId),
      provider: this.id,
      providerTrackId,
      title: track.title,
      artist: track.artist,
      album: track.album,
      cover: track.cover,
      duration: Math.min(track.duration, 30),
      genres: genre ? [genre.toLowerCase()] : [],
      previewUrl: track.preview || undefined,
      externalUrl: track.deezerUrl,
      playback: "preview",
      attribution: "30-second preview via Deezer",
    };
  }
}
