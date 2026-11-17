import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { unlink } from "node:fs/promises";
import { basename, join, parse } from "node:path";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateTrackDto, UploadTrackDto } from "./tracks.dto";

export const trackSelect = {
  id: true,
  artistId: true,
  title: true,
  artistName: true,
  audioUrl: true,
  coverUrl: true,
  genre: true,
  releaseType: true,
  albumTitle: true,
  releaseDescription: true,
  enhancedAudioUrl: true,
  aiProductionStatus: true,
  duration: true,
  createdAt: true,
} as const;

function uploadPath(url: string | null) {
  if (!url?.startsWith("/uploads/")) return null;
  const filename = url.slice("/uploads/".length);
  if (!filename || basename(filename) !== filename) return null;
  return join(__dirname, "..", "..", "uploads", filename);
}

@Injectable()
export class TracksService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.track.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: trackSelect,
    });
  }

  search(query: string) {
    const term = query.trim().slice(0, 100);
    if (!term) return [];
    return this.prisma.track.findMany({
      where: {
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { artistName: { contains: term, mode: "insensitive" } },
          { genre: { contains: term, mode: "insensitive" } },
          { albumTitle: { contains: term, mode: "insensitive" } },
          { releaseDescription: { contains: term, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 24,
      select: trackSelect,
    });
  }

  listMine(artistId: string) {
    return this.prisma.track.findMany({
      where: { artistId },
      orderBy: { createdAt: "desc" },
      select: trackSelect,
    });
  }

  async get(trackId: string) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      select: trackSelect,
    });
    if (!track) throw new NotFoundException("Track not found.");
    return track;
  }

  async listAlbums() {
    const tracks = await this.prisma.track.findMany({
      where: { releaseType: "ALBUM", albumTitle: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: trackSelect,
    });
    const albums = new Map<string, {
      id: string;
      artistId: string;
      title: string;
      artistName: string;
      coverUrl: string | null;
      releaseDescription: string | null;
      trackCount: number;
      createdAt: Date;
    }>();

    for (const track of tracks) {
      if (!track.albumTitle) continue;
      const key = `${track.artistId}\0${track.albumTitle}`;
      const album = albums.get(key);
      if (album) {
        album.trackCount += 1;
      } else {
        albums.set(key, {
          id: track.id,
          artistId: track.artistId,
          title: track.albumTitle,
          artistName: track.artistName,
          coverUrl: track.coverUrl,
          releaseDescription: track.releaseDescription,
          trackCount: 1,
          createdAt: track.createdAt,
        });
      }
    }

    return [...albums.values()];
  }

  async getAlbum(trackId: string) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      select: { artistId: true, albumTitle: true, releaseType: true },
    });
    if (!track || track.releaseType !== "ALBUM" || !track.albumTitle) {
      throw new NotFoundException("Album not found.");
    }

    const tracks = await this.prisma.track.findMany({
      where: {
        artistId: track.artistId,
        albumTitle: track.albumTitle,
        releaseType: "ALBUM",
      },
      orderBy: { createdAt: "asc" },
      select: trackSelect,
    });
    if (!tracks.length) throw new NotFoundException("Album not found.");
    return {
      id: tracks[0].id,
      artistId: tracks[0].artistId,
      title: track.albumTitle,
      artistName: tracks[0].artistName,
      coverUrl: tracks[0].coverUrl,
      releaseDescription: tracks[0].releaseDescription,
      tracks,
    };
  }

  async recordListen(userId: string, trackId: string, playbackId: string, city?: string) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true },
    });
    if (!track) throw new NotFoundException("Track not found.");

    const result = await this.prisma.trackListen.createMany({
      data: [{
        trackId,
        userId,
        playbackId,
        city: city?.trim() || null,
      }],
      skipDuplicates: true,
    });
    return { counted: result.count === 1 };
  }

  async clearListenerLocation(userId: string) {
    const result = await this.prisma.trackListen.updateMany({
      where: { userId, city: { not: null } },
      data: { city: null },
    });
    return { cleared: result.count };
  }

  async create(
    artistId: string,
    input: UploadTrackDto,
    files: Express.Multer.File[],
    cover?: Express.Multer.File,
  ) {
    const uploads = [...files, ...(cover ? [cover] : [])];
    try {
      if (files.length === 0 || !cover) {
        throw new BadRequestException("Upload at least one audio file and an album or single cover.");
      }
      if (input.releaseType === "SINGLE" && files.length !== 1) {
        throw new BadRequestException("A single release must contain exactly one audio file.");
      }
      if (input.releaseType === "ALBUM" && !input.albumTitle?.trim()) {
        throw new BadRequestException("Enter an album title.");
      }
      if (input.releaseType === "SINGLE" && !input.title?.trim()) {
        throw new BadRequestException("Enter a track title.");
      }
      if (cover.size > 5 * 1024 * 1024) {
        throw new BadRequestException("The cover image must be 5 MB or smaller.");
      }

      const tracks = await this.prisma.$transaction(
        files.map((file, index) => this.prisma.track.create({
          data: {
            artistId,
            title: input.releaseType === "SINGLE"
              ? input.title!.trim()
              : parse(file.originalname).name.trim().slice(0, 100) || `Track ${index + 1}`,
            artistName: input.artistName.trim(),
            audioUrl: `/uploads/${file.filename}`,
            coverUrl: `/uploads/${cover.filename}`,
            genre: input.genre,
            releaseType: input.releaseType,
            albumTitle: input.releaseType === "ALBUM" ? input.albumTitle!.trim() : null,
            releaseDescription: input.releaseDescription?.trim() || null,
          },
          select: trackSelect,
        })),
      );
      return tracks;
    } catch (error) {
      await Promise.all(uploads.map((file) => unlink(file.path)));
      throw error;
    }
  }

  async update(artistId: string, trackId: string, input: UpdateTrackDto) {
    const track = await this.prisma.track.findFirst({
      where: { id: trackId, artistId },
    });
    if (!track) throw new NotFoundException("Track not found.");

    return this.prisma.track.update({
      where: { id: trackId },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.genre !== undefined && { genre: input.genre }),
        ...(input.albumTitle !== undefined && { albumTitle: input.albumTitle.trim() || null }),
        ...(input.releaseDescription !== undefined && {
          releaseDescription: input.releaseDescription.trim() || null,
        }),
      },
      select: trackSelect,
    });
  }

  async remove(artistId: string, trackId: string) {
    const track = await this.prisma.track.findFirst({
      where: { id: trackId, artistId },
      select: { id: true, audioUrl: true, coverUrl: true, enhancedAudioUrl: true },
    });
    if (!track) throw new NotFoundException("Track not found.");

    await this.prisma.track.delete({ where: { id: track.id } });
    const coverStillUsed = track.coverUrl
      ? await this.prisma.track.count({ where: { coverUrl: track.coverUrl } })
      : 0;
    const paths = [uploadPath(track.audioUrl), uploadPath(track.enhancedAudioUrl)];
    if (coverStillUsed === 0) paths.push(uploadPath(track.coverUrl));
    await Promise.all(paths.filter((path): path is string => path !== null).map((path) => unlink(path)));
    return { deleted: true };
  }
}
