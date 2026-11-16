import {
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ArtistsService } from "./artists.service";

@Controller("artists")
export class ArtistsController {
  constructor(private readonly artists: ArtistsService) {}

  @Get(":id")
  profile(@Param("id") artistId: string) {
    return this.artists.profile(artistId);
  }

  @Get(":id/follow")
  @UseGuards(JwtAuthGuard)
  isFollowing(
    @Req() request: AuthenticatedRequest,
    @Param("id") artistId: string,
  ) {
    return this.artists.isFollowing(request.user.sub, artistId);
  }

  @Put(":id/follow")
  @UseGuards(JwtAuthGuard)
  follow(
    @Req() request: AuthenticatedRequest,
    @Param("id") artistId: string,
  ) {
    return this.artists.follow(request.user.sub, artistId);
  }

  @Delete(":id/follow")
  @UseGuards(JwtAuthGuard)
  unfollow(
    @Req() request: AuthenticatedRequest,
    @Param("id") artistId: string,
  ) {
    return this.artists.unfollow(request.user.sub, artistId);
  }
}
