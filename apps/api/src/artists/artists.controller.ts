import {
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ArtistsService } from "./artists.service";

@ApiTags("Artists")
@Controller("artists")
export class ArtistsController {
  constructor(private readonly artists: ArtistsService) {}

  @Get(":id")
  profile(@Param("id") artistId: string) {
    return this.artists.profile(artistId);
  }

  @Get(":id/follow")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  isFollowing(
    @Req() request: AuthenticatedRequest,
    @Param("id") artistId: string,
  ) {
    return this.artists.isFollowing(request.user.sub, artistId);
  }

  @Put(":id/follow")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  follow(
    @Req() request: AuthenticatedRequest,
    @Param("id") artistId: string,
  ) {
    return this.artists.follow(request.user.sub, artistId);
  }

  @Delete(":id/follow")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  unfollow(
    @Req() request: AuthenticatedRequest,
    @Param("id") artistId: string,
  ) {
    return this.artists.unfollow(request.user.sub, artistId);
  }
}
