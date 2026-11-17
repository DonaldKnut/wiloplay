import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  AddPlaylistTrackDto,
  CreatePlaylistDto,
  LikeTrackDto,
  RecordPlaybackDto,
  UpdatePlaylistDto,
} from "./library.dto";
import { LibraryService } from "./library.service";

@ApiTags("Listener library")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("library")
export class LibraryController {
  constructor(private readonly library: LibraryService) {}

  @Get("likes")
  likes(@Req() request: AuthenticatedRequest) {
    return this.library.listLikes(request.user.sub);
  }

  @Put("likes")
  like(
    @Req() request: AuthenticatedRequest,
    @Body() input: LikeTrackDto,
  ) {
    return this.library.likeTrack(request.user.sub, input);
  }

  @Delete("likes/:source/:sourceTrackId")
  unlike(
    @Req() request: AuthenticatedRequest,
    @Param("source") source: string,
    @Param("sourceTrackId") sourceTrackId: string,
  ) {
    return this.library.unlikeTrack(request.user.sub, source, sourceTrackId);
  }

  @Get("history")
  history(@Req() request: AuthenticatedRequest) {
    return this.library.listHistory(request.user.sub);
  }

  @Post("history")
  recordHistory(
    @Req() request: AuthenticatedRequest,
    @Body() input: RecordPlaybackDto,
  ) {
    return this.library.recordPlayback(request.user.sub, input);
  }

  @Get("recommendations")
  recommendations(@Req() request: AuthenticatedRequest) {
    return this.library.recommendations(request.user.sub);
  }
}

@ApiTags("Playlists")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("playlists")
export class PlaylistsController {
  constructor(private readonly library: LibraryService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.library.listPlaylists(request.user.sub);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreatePlaylistDto,
  ) {
    return this.library.createPlaylist(request.user.sub, input);
  }

  @Get(":id")
  get(
    @Req() request: AuthenticatedRequest,
    @Param("id") playlistId: string,
  ) {
    return this.library.getPlaylist(request.user.sub, playlistId);
  }

  @Patch(":id")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("id") playlistId: string,
    @Body() input: UpdatePlaylistDto,
  ) {
    return this.library.updatePlaylist(request.user.sub, playlistId, input);
  }

  @Delete(":id")
  delete(
    @Req() request: AuthenticatedRequest,
    @Param("id") playlistId: string,
  ) {
    return this.library.deletePlaylist(request.user.sub, playlistId);
  }

  @Post(":id/tracks")
  addTrack(
    @Req() request: AuthenticatedRequest,
    @Param("id") playlistId: string,
    @Body() input: AddPlaylistTrackDto,
  ) {
    return this.library.addTrackToPlaylist(request.user.sub, playlistId, input);
  }

  @Delete(":id/tracks/:source/:sourceTrackId")
  removeTrack(
    @Req() request: AuthenticatedRequest,
    @Param("id") playlistId: string,
    @Param("source") source: string,
    @Param("sourceTrackId") sourceTrackId: string,
  ) {
    return this.library.removeTrackFromPlaylist(
      request.user.sub,
      playlistId,
      source,
      sourceTrackId,
    );
  }
}
