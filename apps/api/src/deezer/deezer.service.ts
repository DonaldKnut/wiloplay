import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";

type DeezerTrack = {
  id: number;
  title: string;
  duration: number;
  link: string;
  preview: string;
  artist: { name: string };
  album: { title: string; cover_medium: string };
};

type DeezerArtist = {
  id: number;
  name: string;
  picture_medium: string;
  link: string;
};

type DeezerAlbum = {
  id: number;
  title: string;
  cover_medium: string;
  link: string;
  artist: { name: string };
};

type DeezerArtistDetails = DeezerArtist & {
  nb_fan: number;
};

@Injectable()
export class DeezerService {
  async search(query: string) {
    const term = query.trim().slice(0, 100);
    if (!term) throw new BadRequestException("Enter something to search for.");
    let response: Response;
    try {
      response = await fetch(
        `https://api.deezer.com/search?q=${encodeURIComponent(term)}&limit=20`,
        { signal: AbortSignal.timeout(8000) },
      );
    } catch {
      throw new ServiceUnavailableException("Music search is temporarily unavailable.");
    }
    if (!response.ok) {
      throw new ServiceUnavailableException("Music search is temporarily unavailable.");
    }
    const payload = (await response.json()) as { data?: DeezerTrack[]; error?: { message?: string } };
    if (payload.error) {
      throw new ServiceUnavailableException(payload.error.message ?? "Deezer could not complete this search.");
    }
    return (payload.data ?? []).map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist.name,
      album: track.album.title,
      cover: track.album.cover_medium,
      preview: track.preview || undefined,
      duration: track.duration,
      deezerUrl: track.link,
    }));
  }

  async chart() {
    const [tracks, artists, albums] = await Promise.all([
      this.fetchChart<DeezerTrack>("tracks"),
      this.fetchChart<DeezerArtist>("artists"),
      this.fetchChart<DeezerAlbum>("albums"),
    ]);

    return {
      tracks: tracks.map((track) => ({
        id: track.id,
        title: track.title,
        artist: track.artist.name,
        album: track.album.title,
        cover: track.album.cover_medium,
        preview: track.preview || undefined,
        duration: track.duration,
        deezerUrl: track.link,
      })),
      artists: artists.map((artist) => ({
        id: artist.id,
        name: artist.name,
        picture: artist.picture_medium,
        deezerUrl: artist.link,
      })),
      albums: albums.map((album) => ({
        id: album.id,
        title: album.title,
        artist: album.artist.name,
        cover: album.cover_medium,
        deezerUrl: album.link,
      })),
    };
  }

  async artistDetails(id: string) {
    const artistId = Number(id);
    if (!Number.isSafeInteger(artistId) || artistId < 1) {
      throw new BadRequestException("Enter a valid Deezer artist ID.");
    }

    const [artist, tracks] = await Promise.all([
      this.fetchItem<DeezerArtistDetails>(`artist/${artistId}`),
      this.fetchCollection<DeezerTrack>(`artist/${artistId}/top`),
    ]);

    return {
      artist: {
        id: artist.id,
        name: artist.name,
        picture: artist.picture_medium,
        deezerUrl: artist.link,
        fans: artist.nb_fan,
      },
      tracks: tracks.map((track) => ({
        id: track.id,
        title: track.title,
        artist: track.artist.name,
        album: track.album.title,
        cover: track.album.cover_medium,
        preview: track.preview || undefined,
        duration: track.duration,
        deezerUrl: track.link,
      })),
    };
  }

  private async fetchChart<T>(category: "tracks" | "artists" | "albums") {
    return this.fetchCollection<T>(`chart/0/${category}`);
  }

  private async fetchCollection<T>(path: string) {
    const payload = await this.fetchDeezerPayload<{ data?: T[] }>(path);
    if (!Array.isArray(payload.data)) {
      throw new ServiceUnavailableException("Deezer returned an invalid chart response.");
    }
    return payload.data;
  }

  private async fetchItem<T>(path: string) {
    const payload = await this.fetchDeezerPayload<T>(path);
    if (!payload || typeof payload !== "object" || "error" in payload) {
      throw new ServiceUnavailableException("Deezer could not load this artist.");
    }
    return payload;
  }

  private async fetchDeezerPayload<T>(path: string): Promise<T & { error?: { message?: string } }> {
    let response: Response;
    try {
      response = await fetch(`https://api.deezer.com/${path}?limit=10`, {
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new ServiceUnavailableException("Deezer is temporarily unavailable.");
    }
    if (!response.ok) {
      throw new ServiceUnavailableException("Deezer is temporarily unavailable.");
    }

    let payload: T & { error?: { message?: string } };
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      throw new ServiceUnavailableException("Deezer returned an invalid response.");
    }
    if (!payload || typeof payload !== "object") {
      throw new ServiceUnavailableException("Deezer returned an invalid response.");
    }
    if (payload.error) {
      throw new ServiceUnavailableException(payload.error.message ?? "Deezer could not complete this request.");
    }
    return payload;
  }
}
