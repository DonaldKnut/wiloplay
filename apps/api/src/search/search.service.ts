import { BadRequestException, Injectable } from "@nestjs/common";
import { ArtistsService } from "../artists/artists.service";
import { CatalogService } from "../catalog/catalog.service";
import { EventsService } from "../events/events.service";
import { TracksService } from "../tracks/tracks.service";

@Injectable()
export class SearchService {
  constructor(
    private readonly tracks: TracksService,
    private readonly artists: ArtistsService,
    private readonly events: EventsService,
    private readonly catalog: CatalogService,
  ) {}

  async lookup(query: string) {
    const term = query.trim().slice(0, 100);
    if (!term) {
      throw new BadRequestException("Enter something to search for.");
    }

    const [tracks, artists, events, catalogResult] = await Promise.all([
      this.tracks.search(term),
      this.artists.search(term),
      this.events.search(term),
      this.catalog.search({ query: term, limit: 24 }).catch(() => ({
        tracks: [] as Awaited<ReturnType<CatalogService["search"]>>["tracks"],
        totals: { tracks: 0, byProvider: {} as Record<string, number> },
      })),
    ]);

    const catalogTracks = catalogResult.tracks;
    const deezerTracks = catalogTracks
      .filter((track) => track.provider === "deezer")
      .map((track) => ({
        id: Number(track.providerTrackId),
        title: track.title,
        artist: track.artist,
        album: track.album ?? "",
        cover: track.cover ?? "",
        preview: track.previewUrl ?? "",
        duration: track.duration ?? 30,
        deezerUrl: track.externalUrl ?? "",
      }));

    return {
      query: term,
      tracks,
      artists,
      events,
      catalogTracks,
      deezerTracks,
      totals: {
        tracks: tracks.length,
        artists: artists.length,
        events: events.length,
        catalogTracks: catalogTracks.length,
        deezerTracks: deezerTracks.length,
        all: tracks.length + artists.length + events.length + catalogTracks.length,
      },
    };
  }
}
