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
import { ArtistGuard } from "../auth/artist.guard";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UpdateTrackDto, UploadTrackDto } from "./tracks.dto";
import { TracksService } from "./tracks.service";
import { AiTracksService } from "./ai-tracks.service";
import { RecordListenDto } from "./listen.dto";

const supportedAudio = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac"]);
const supportedImages = new Set([".jpg", ".jpeg", ".png", ".webp"]);

@Controller("tracks")
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
  @UseGuards(JwtAuthGuard, ArtistGuard)
  listMine(@Req() request: AuthenticatedRequest) {
    return this.tracks.listMine(request.user.sub);
  }

  @Get("ai/config")
  @UseGuards(JwtAuthGuard, ArtistGuard)
  aiConfig() {
    return this.aiTracks.config();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.tracks.get(id);
  }

  @Post(":id/listens")
  @UseGuards(JwtAuthGuard)
  recordListen(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: RecordListenDto,
  ) {
    return this.tracks.recordListen(request.user.sub, id, input.playbackId, input.city);
  }

  @Delete("listens/location")
  @UseGuards(JwtAuthGuard)
  clearListenerLocation(@Req() request: AuthenticatedRequest) {
    return this.tracks.clearListenerLocation(request.user.sub);
  }

  @Post("upload")
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
  @UseGuards(JwtAuthGuard, ArtistGuard)
  update(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: UpdateTrackDto,
  ) {
    return this.tracks.update(request.user.sub, id, input);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, ArtistGuard)
  remove(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.tracks.remove(request.user.sub, id);
  }

  @Post(":id/ai/suggest")
  @UseGuards(JwtAuthGuard, ArtistGuard)
  suggest(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiTracks.suggest(request.user.sub, id);
  }

  @Post(":id/ai/cover")
  @UseGuards(JwtAuthGuard, ArtistGuard)
  generateCover(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiTracks.generateCover(request.user.sub, id);
  }

  @Post(":id/enhancement")
  @UseGuards(JwtAuthGuard, ArtistGuard)
  startEnhancement(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiTracks.startEnhancement(request.user.sub, id);
  }

  @Get(":id/enhancement")
  @UseGuards(JwtAuthGuard, ArtistGuard)
  checkEnhancement(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiTracks.checkEnhancement(request.user.sub, id);
  }
}
