import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { randomUUID } from "node:crypto";
import { extname, join } from "node:path";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from "@nestjs/swagger";
import { ArtistGuard } from "../auth/artist.guard";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MUSIC_GENRES, UpdateTrackDto, UploadTrackDto } from "./tracks.dto";
import { TracksService } from "./tracks.service";
import { AiTracksService } from "./ai-tracks.service";
import { RecordListenDto } from "./listen.dto";

const supportedAudio = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac"]);
const supportedImages = new Set([".jpg", ".jpeg", ".png", ".webp"]);

@Controller("tracks")
@ApiTags("Tracks")
export class TracksController {
  constructor(
    private readonly tracks: TracksService,
    private readonly aiTracks: AiTracksService,
  ) {}

  @Get()
  list() {
    return this.tracks.list();
  }

  @Get("mine")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ArtistGuard)
  listMine(@Req() request: AuthenticatedRequest) {
    return this.tracks.listMine(request.user.sub);
  }

  @Get("ai/config")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ArtistGuard)
  aiConfig() {
    return this.aiTracks.config();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.tracks.get(id);
  }

  @Post(":id/listens")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  recordListen(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: RecordListenDto,
  ) {
    return this.tracks.recordListen(request.user.sub, id, input.playbackId, input.city);
  }

  @Delete("listens/location")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  clearListenerLocation(@Req() request: AuthenticatedRequest) {
    return this.tracks.clearListenerLocation(request.user.sub);
  }

  @Post("upload")
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["artistName", "genre", "releaseType", "files"],
      properties: {
        title: { type: "string", maxLength: 100 },
        artistName: { type: "string", minLength: 1, maxLength: 100 },
        genre: { type: "string", enum: [...MUSIC_GENRES] },
        releaseType: { type: "string", enum: ["SINGLE", "ALBUM"] },
        albumTitle: { type: "string", maxLength: 100 },
        releaseDescription: { type: "string", maxLength: 500 },
        files: {
          type: "array",
          items: { type: "string", format: "binary" },
        },
        cover: { type: "string", format: "binary" },
      },
    },
  })
  @UseGuards(JwtAuthGuard, ArtistGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "files", maxCount: 12 },
        { name: "file", maxCount: 1 },
        { name: "cover", maxCount: 1 },
      ],
      {
      storage: diskStorage({
        destination: join(__dirname, "..", "..", "uploads"),
        filename: (_request, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 30 * 1024 * 1024, files: 14 },
      fileFilter: (_request, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();
        const validAudio = (file.fieldname === "files" || file.fieldname === "file")
          && supportedAudio.has(extension)
          && file.mimetype.startsWith("audio/");
        const validImage = file.fieldname === "cover"
          && supportedImages.has(extension)
          && file.mimetype.startsWith("image/");
        if (!validAudio && !validImage) {
          callback(new BadRequestException("Upload supported audio files and a JPG, PNG or WebP cover image."), false);
          return;
        }
        callback(null, true);
      },
      },
    ),
  )
  upload(
    @Req() request: AuthenticatedRequest,
    @UploadedFiles() uploaded: {
      files?: Express.Multer.File[];
      file?: Express.Multer.File[];
      cover?: Express.Multer.File[];
    },
    @Body() input: UploadTrackDto,
  ) {
    return this.tracks.create(
      request.user.sub,
      input,
      uploaded?.files ?? uploaded?.file ?? [],
      uploaded?.cover?.[0],
    );
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ArtistGuard)
  update(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: UpdateTrackDto,
  ) {
    return this.tracks.update(request.user.sub, id, input);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ArtistGuard)
  remove(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.tracks.remove(request.user.sub, id);
  }

  @Post(":id/ai/suggest")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ArtistGuard)
  suggest(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiTracks.suggest(request.user.sub, id);
  }

  @Post(":id/ai/cover")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ArtistGuard)
  generateCover(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiTracks.generateCover(request.user.sub, id);
  }

  @Post(":id/enhancement")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ArtistGuard)
  startEnhancement(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiTracks.startEnhancement(request.user.sub, id);
  }

  @Get(":id/enhancement")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ArtistGuard)
  checkEnhancement(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiTracks.checkEnhancement(request.user.sub, id);
  }
}
