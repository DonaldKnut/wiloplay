import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { trackSelect } from "../tracks/tracks.service";
import {
  AddPlaylistTrackDto,
  CreatePlaylistDto,
  LibraryTrackDto,
  RecordPlaybackDto,
  UpdatePlaylistDto,
} from "./library.dto";

type TrackSnapshot = {
  source: "UPLOAD" | "DEEZER";
  sourceTrackId: string;
  trackId?: string;
  title: string;
  artistName: string;
  albumTitle?: string | null;
  coverUrl?: string | null;
  previewUrl?: string | null;
  deezerUrl?: string | null;
  duration?: number | null;
  genre?: string | null;
};

const historySelect = {
  id: true,
  playbackId: true,
  source: true,
  externalTrackId: true,
  title: true,
  artistName: true,
  albumTitle: true,
  coverUrl: true,
  previewUrl: true,
  deezerUrl: true,
  duration: true,
  playedAt: true,
  track: { select: trackSelect },
} as const;

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  listLikes(userId: string) {
    return this.prisma.likedTrack.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { track: { select: trackSelect } },
    });
  }

  async likeTrack(userId: string, input: LibraryTrackDto) {
    const snapshot = await this.resolveTrack(input);
    await this.prisma.likedTrack.upsert({
      where: {
        userId_source_sourceTrackId: {
          userId,
          source: snapshot.source,
          sourceTrackId: snapshot.sourceTrackId,
        },
      },
      create: { userId, ...snapshot },
      update: {
        trackId: snapshot.trackId,
        title: snapshot.title,
        artistName: snapshot.artistName,
        albumTitle: snapshot.albumTitle,
        coverUrl: snapshot.coverUrl,
        previewUrl: snapshot.previewUrl,
        deezerUrl: snapshot.deezerUrl,
        duration: snapshot.duration,
        genre: snapshot.genre,
      },
    });
    return { liked: true };
  }

  async unlikeTrack(userId: string, source: string, sourceTrackId: string) {
    this.validateSource(source);
    await this.prisma.likedTrack.deleteMany({
      where: { userId, source, sourceTrackId },
    });
    return { liked: false };
  }

  listHistory(userId: string) {
    return this.prisma.trackPlay.findMany({
      where: { userId },
      orderBy: { playedAt: "desc" },
      take: 50,
      select: historySelect,
    });
  }

  async recordPlayback(userId: string, input: RecordPlaybackDto) {
    const snapshot = await this.resolveTrack(input);
    const { sourceTrackId, ...trackData } = snapshot;
    return this.prisma.trackPlay.upsert({
      where: { userId_playbackId: { userId, playbackId: input.playbackId } },
      create: {
        userId,
        playbackId: input.playbackId,
        ...trackData,
        externalTrackId: snapshot.source === "DEEZER" ? sourceTrackId : null,
      },
      update: {},
      select: historySelect,
    });
  }

  listPlaylists(ownerId: string) {
    return this.prisma.playlist.findMany({
      where: { ownerId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { tracks: true } } },
    });
  }

  async createPlaylist(ownerId: string, input: CreatePlaylistDto) {
    const name = input.name.trim();
    if (!name) throw new BadRequestException("Enter a playlist name.");
    return this.prisma.playlist.create({
      data: {
        ownerId,
        name,
        description: input.description?.trim() || null,
      },
      include: { _count: { select: { tracks: true } } },
    });
  }

  async getPlaylist(ownerId: string, playlistId: string) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { id: playlistId, ownerId },
      include: {
        tracks: {
          orderBy: [{ position: "asc" }, { addedAt: "asc" }],
          include: { track: { select: trackSelect } },
        },
      },
    });
    if (!playlist) throw new NotFoundException("Playlist not found.");
    return playlist;
  }

  async updatePlaylist(
    ownerId: string,
    playlistId: string,
    input: UpdatePlaylistDto,
  ) {
    const current = await this.prisma.playlist.findFirst({
      where: { id: playlistId, ownerId },
      select: { id: true },
    });
    if (!current) throw new NotFoundException("Playlist not found.");
    if (input.name === undefined && input.description === undefined) {
      throw new BadRequestException("Provide a playlist name or description to update.");
    }
    const name = input.name?.trim();
    if (input.name !== undefined && !name) {
      throw new BadRequestException("Enter a playlist name.");
    }

    return this.prisma.playlist.update({
      where: { id: playlistId },
      data: {
        ...(name !== undefined && { name }),
        ...(input.description !== undefined && {
          description: input.description.trim() || null,
        }),
      },
      include: { _count: { select: { tracks: true } } },
    });
  }

  async deletePlaylist(ownerId: string, playlistId: string) {
    const result = await this.prisma.playlist.deleteMany({
      where: { id: playlistId, ownerId },
    });
    if (!result.count) throw new NotFoundException("Playlist not found.");
    return { deleted: true };
  }

  async addTrackToPlaylist(
    ownerId: string,
    playlistId: string,
    input: AddPlaylistTrackDto,
  ) {
    await this.requirePlaylist(ownerId, playlistId);
    const snapshot = await this.resolveTrack(input);
    const { _max } = await this.prisma.playlistTrack.aggregate({
      where: { playlistId },
      _max: { position: true },
    });
    const result = await this.prisma.playlistTrack.createMany({
      data: [{
        playlistId,
        ...snapshot,
        position: (_max.position ?? -1) + 1,
      }],
      skipDuplicates: true,
    });
    if (result.count) {
      await this.prisma.playlist.update({
        where: { id: playlistId },
        data: { updatedAt: new Date() },
      });
    }
    return { added: result.count === 1 };
  }

  async removeTrackFromPlaylist(
    ownerId: string,
    playlistId: string,
    source: string,
    sourceTrackId: string,
  ) {
    await this.requirePlaylist(ownerId, playlistId);
    this.validateSource(source);
    const result = await this.prisma.playlistTrack.deleteMany({
      where: { playlistId, source, sourceTrackId },
    });
    if (result.count) {
      await this.prisma.playlist.update({
        where: { id: playlistId },
        data: { updatedAt: new Date() },
      });
    }
    return { removed: result.count === 1 };
  }

  async recommendations(userId: string) {
    const [liked, recent, follows] = await Promise.all([
      this.prisma.likedTrack.findMany({
        where: { userId },
        select: {
          genre: true,
          track: { select: { id: true, genre: true, artistId: true } },
        },
      }),
      this.prisma.trackPlay.findMany({
        where: { userId, trackId: { not: null } },
        orderBy: { playedAt: "desc" },
        take: 50,
        select: { track: { select: { id: true, genre: true, artistId: true } } },
      }),
      this.prisma.artistFollow.findMany({
        where: { listenerId: userId },
        select: { artistId: true },
      }),
    ]);

    const signals = [...liked, ...recent]
      .flatMap((item) => item.track ? [item.track] : []);
    const genres = new Map<string, number>();
    for (const item of liked) {
      const genre = item.genre ?? item.track?.genre;
      if (genre) genres.set(genre, (genres.get(genre) ?? 0) + 2);
    }
    for (const item of recent) {
      if (item.track) {
        genres.set(item.track.genre, (genres.get(item.track.genre) ?? 0) + 1);
      }
    }

    const excludedIds = [...new Set(signals.map((track) => track.id))];
    const followedArtistIds = new Set(follows.map((follow) => follow.artistId));
    const loadCandidates = (exclude: string[]) => this.prisma.track.findMany({
      where: exclude.length ? { id: { notIn: exclude } } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
      select: trackSelect,
    });
    let candidates = await loadCandidates(excludedIds);
    if (!candidates.length && excludedIds.length) {
      candidates = await loadCandidates([]);
    }

    return candidates
      .map((track) => ({
        ...track,
        score: (genres.get(track.genre) ?? 0) * 2
          + (followedArtistIds.has(track.artistId) ? 5 : 0),
      }))
      .sort((a, b) => b.score - a.score || b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20)
      .map(({ score: _score, ...track }) => track);
  }

  private async resolveTrack(input: LibraryTrackDto): Promise<TrackSnapshot> {
    this.validateSource(input.source);
    if (input.source === "UPLOAD") {
      if (!input.trackId) throw new BadRequestException("Choose an uploaded track.");
      const track = await this.prisma.track.findUnique({
        where: { id: input.trackId },
        select: trackSelect,
      });
      if (!track) throw new NotFoundException("Track not found.");
      return {
        source: "UPLOAD",
        sourceTrackId: track.id,
        trackId: track.id,
        title: track.title,
        artistName: track.artistName,
        albumTitle: track.albumTitle,
        coverUrl: track.coverUrl,
        duration: track.duration,
        genre: track.genre,
      };
    }

    if (!input.externalTrackId || !/^\d+$/.test(input.externalTrackId)) {
      throw new BadRequestException("Enter a valid Deezer track ID.");
    }
    if (!input.previewUrl) {
      throw new BadRequestException("This Deezer track does not have a playable preview.");
    }
    const previewUrl = new URL(input.previewUrl);
    if (
      previewUrl.protocol !== "https:"
      || !previewUrl.hostname.endsWith(".dzcdn.net")
    ) {
      throw new BadRequestException("The Deezer preview URL is invalid.");
    }
    if (!input.title || !input.artistName) {
      throw new BadRequestException("Track title and artist are required.");
    }

    return {
      source: "DEEZER",
      sourceTrackId: input.externalTrackId,
      title: input.title,
      artistName: input.artistName,
      albumTitle: input.albumTitle,
      coverUrl: input.coverUrl,
      previewUrl: input.previewUrl,
      deezerUrl: input.deezerUrl,
      duration: input.duration,
      genre: input.genre,
    };
  }

  private validateSource(source: string): asserts source is "UPLOAD" | "DEEZER" {
    if (source !== "UPLOAD" && source !== "DEEZER") {
      throw new BadRequestException("Choose a supported music source.");
    }
  }

  private async requirePlaylist(ownerId: string, playlistId: string) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { id: playlistId, ownerId },
      select: { id: true },
    });
    if (!playlist) throw new NotFoundException("Playlist not found.");
  }
}
