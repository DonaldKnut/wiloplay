import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ArtistsService {
  constructor(private readonly prisma: PrismaService) {}

  async profile(artistId: string) {
    const artist = await this.prisma.user.findFirst({
      where: { id: artistId, role: "ARTIST" },
      select: {
        id: true,
        name: true,
        _count: { select: { followers: true } },
        tracks: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            artistName: true,
            genre: true,
            coverUrl: true,
            createdAt: true,
            _count: { select: { listens: true } },
          },
        },
      },
    });
    if (!artist) throw new NotFoundException("Artist not found.");

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const listenWhere = { track: { artistId } };
    const [totalListens, monthlyListens, topCities] = await Promise.all([
      this.prisma.trackListen.count({ where: listenWhere }),
      this.prisma.trackListen.count({
        where: { ...listenWhere, createdAt: { gte: monthStart } },
      }),
      this.prisma.trackListen.groupBy({
        by: ["city"],
        where: { ...listenWhere, city: { not: null } },
        _count: { city: true },
        orderBy: { _count: { city: "desc" } },
        take: 5,
      }),
    ]);

    return {
      id: artist.id,
      name: artist.name,
      followers: artist._count.followers,
      totalListens,
      monthlyListens,
      tracks: artist.tracks.map((track) => ({
        id: track.id,
        title: track.title,
        artistName: track.artistName,
        genre: track.genre,
        coverUrl: track.coverUrl,
        listens: track._count.listens,
      })),
      topCities: topCities.flatMap((item) =>
        item.city ? [{ city: item.city, listens: item._count.city }] : [],
      ),
    };
  }

  search(query: string) {
    const term = query.trim().slice(0, 100);
    if (!term) return [];
    return this.prisma.user.findMany({
      where: {
        role: "ARTIST",
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { tracks: { some: { artistName: { contains: term, mode: "insensitive" } } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        name: true,
        _count: { select: { followers: true, tracks: true } },
        tracks: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { coverUrl: true, artistName: true },
        },
      },
    }).then((artists) =>
      artists.map((artist) => ({
        id: artist.id,
        name: artist.name,
        followers: artist._count.followers,
        trackCount: artist._count.tracks,
        coverUrl: artist.tracks[0]?.coverUrl ?? null,
        artistName: artist.tracks[0]?.artistName ?? artist.name,
      })),
    );
  }

  async isFollowing(listenerId: string, artistId: string) {
    await this.requireArtist(artistId);
    const follow = await this.prisma.artistFollow.findUnique({
      where: { artistId_listenerId: { artistId, listenerId } },
      select: { id: true },
    });
    return { following: Boolean(follow) };
  }

  async follow(listenerId: string, artistId: string) {
    if (listenerId === artistId) {
      throw new BadRequestException("You cannot follow your own artist profile.");
    }
    await this.requireArtist(artistId);
    await this.prisma.artistFollow.upsert({
      where: { artistId_listenerId: { artistId, listenerId } },
      create: { artistId, listenerId },
      update: {},
    });
    return {
      following: true,
      followers: await this.prisma.artistFollow.count({ where: { artistId } }),
    };
  }

  async unfollow(listenerId: string, artistId: string) {
    await this.requireArtist(artistId);
    await this.prisma.artistFollow.deleteMany({
      where: { artistId, listenerId },
    });
    return {
      following: false,
      followers: await this.prisma.artistFollow.count({ where: { artistId } }),
    };
  }

  private async requireArtist(artistId: string) {
    const artist = await this.prisma.user.findFirst({
      where: { id: artistId, role: "ARTIST" },
      select: { id: true },
    });
    if (!artist) throw new NotFoundException("Artist not found.");
  }
}
