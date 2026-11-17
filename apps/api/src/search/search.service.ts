import { BadRequestException, Injectable } from "@nestjs/common";
import { ArtistsService } from "../artists/artists.service";
import { DeezerService } from "../deezer/deezer.service";
import { EventsService } from "../events/events.service";
import { TracksService } from "../tracks/tracks.service";

@Injectable()
export class SearchService {
  constructor(
    private readonly tracks: TracksService,
    private readonly artists: ArtistsService,
    private readonly events: EventsService,
    private readonly deezer: DeezerService,
  ) {}

  async lookup(query: string) {
    const term = query.trim().slice(0, 100);
    if (!term) {
      throw new BadRequestException("Enter something to search for.");
    }

    const [tracks, artists, events, deezerTracks] = await Promise.all([
      this.tracks.search(term),
      this.artists.search(term),
      this.events.search(term),
      this.deezer.search(term).catch(() => [] as Awaited<ReturnType<DeezerService["search"]>>),
    ]);

    return {
      query: term,
      tracks,
      artists,
      events,
      deezerTracks,
      totals: {
        tracks: tracks.length,
        artists: artists.length,
        events: events.length,
        deezerTracks: deezerTracks.length,
        all: tracks.length + artists.length + events.length + deezerTracks.length,
      },
    };
  }
}
