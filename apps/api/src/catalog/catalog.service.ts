import { Injectable, Logger } from "@nestjs/common";
import {
  CATALOG_GENRES,
  CATALOG_PROVIDERS,
  type CatalogBrowseInput,
  type CatalogProviderId,
  type CatalogProviderStatus,
  type CatalogSearchInput,
  type CatalogTrack,
} from "./catalog.types";
import type { MusicProvider } from "./music-provider";
import { AudiusProvider } from "./providers/audius.provider";
import { DeezerCatalogProvider } from "./providers/deezer.provider";
import { ItunesProvider } from "./providers/itunes.provider";
import { JamendoProvider } from "./providers/jamendo.provider";

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);
  private readonly providers: MusicProvider[];

  constructor(
    private readonly audius: AudiusProvider,
    private readonly jamendo: JamendoProvider,
    private readonly deezer: DeezerCatalogProvider,
    private readonly itunes: ItunesProvider,
  ) {
    this.providers = [this.audius, this.jamendo, this.deezer, this.itunes];
  }

  listProviders(): CatalogProviderStatus[] {
    return this.providers.map((provider) => provider.status());
  }

  listGenres() {
    return {
      genres: [...CATALOG_GENRES],
      providers: this.listProviders(),
    };
  }

  async search(input: CatalogSearchInput) {
    const providers = this.resolveProviders(input.providers);
    const limit = Math.min(input.limit ?? 20, 40);
    const perProvider = Math.max(6, Math.ceil(limit / Math.max(providers.length, 1)));
    const settled = await Promise.allSettled(
      providers.map((provider) =>
        provider.search({
          query: input.query,
          genre: input.genre,
          limit: perProvider,
        }),
      ),
    );

    const tracks = this.mergeTracks(
      settled.flatMap((result, index) => {
        if (result.status === "fulfilled") return result.value;
        this.logger.warn(`Catalog search failed for ${providers[index].id}: ${result.reason}`);
        return [];
      }),
      limit,
    );

    return {
      query: input.query,
      genre: input.genre ?? null,
      providers: providers.map((provider) => provider.status()),
      tracks,
      totals: {
        tracks: tracks.length,
        byProvider: this.countByProvider(tracks),
      },
    };
  }

  async browseGenre(input: CatalogBrowseInput) {
    const providers = this.resolveProviders(input.providers);
    const limit = Math.min(input.limit ?? 24, 40);
    const perProvider = Math.max(6, Math.ceil(limit / Math.max(providers.length, 1)));
    const settled = await Promise.allSettled(
      providers.map((provider) => {
        if (provider.browseGenre) {
          return provider.browseGenre({ genre: input.genre, limit: perProvider });
        }
        return provider.search({ query: input.genre, genre: input.genre, limit: perProvider });
      }),
    );

    const tracks = this.mergeTracks(
      settled.flatMap((result, index) => {
        if (result.status === "fulfilled") return result.value;
        this.logger.warn(`Catalog genre browse failed for ${providers[index].id}: ${result.reason}`);
        return [];
      }),
      limit,
    );

    return {
      genre: input.genre,
      providers: providers.map((provider) => provider.status()),
      tracks,
      totals: {
        tracks: tracks.length,
        byProvider: this.countByProvider(tracks),
      },
    };
  }

  async trending(limit = 24, providers?: CatalogProviderId[]) {
    const selected = this.resolveProviders(providers);
    const capped = Math.min(limit, 40);
    const perProvider = Math.max(6, Math.ceil(capped / Math.max(selected.length, 1)));
    const settled = await Promise.allSettled(
      selected.map((provider) => {
        if (provider.trending) return provider.trending(perProvider);
        return provider.search({ query: "trending", limit: perProvider });
      }),
    );

    const tracks = this.mergeTracks(
      settled.flatMap((result, index) => {
        if (result.status === "fulfilled") return result.value;
        this.logger.warn(`Catalog trending failed for ${selected[index].id}: ${result.reason}`);
        return [];
      }),
      capped,
    );

    return {
      providers: selected.map((provider) => provider.status()),
      tracks,
      totals: {
        tracks: tracks.length,
        byProvider: this.countByProvider(tracks),
      },
    };
  }

  private resolveProviders(requested?: CatalogProviderId[]) {
    const enabled = this.providers.filter((provider) => provider.status().enabled);
    if (!requested?.length) return enabled;
    const allowed = new Set(requested.filter((id) => CATALOG_PROVIDERS.includes(id)));
    return enabled.filter((provider) => allowed.has(provider.id));
  }

  private mergeTracks(tracks: CatalogTrack[], limit: number) {
    const seen = new Set<string>();
    const full: CatalogTrack[] = [];
    const preview: CatalogTrack[] = [];

    for (const track of tracks) {
      const key = `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
      if (seen.has(key) || seen.has(track.id)) continue;
      seen.add(key);
      seen.add(track.id);
      if (track.playback === "full") full.push(track);
      else preview.push(track);
    }

    // Prefer full streams first, then commercial previews.
    return [...full, ...preview].slice(0, limit);
  }

  private countByProvider(tracks: CatalogTrack[]) {
    return tracks.reduce<Record<string, number>>((acc, track) => {
      acc[track.provider] = (acc[track.provider] ?? 0) + 1;
      return acc;
    }, {});
  }
}
