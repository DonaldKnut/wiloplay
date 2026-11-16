import { Module } from "@nestjs/common";
import { ArtistGuard } from "../auth/artist.guard";
import { AuthModule } from "../auth/auth.module";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TracksController } from "./tracks.controller";
import { TracksService } from "./tracks.service";
import { AiTracksService } from "./ai-tracks.service";

@Module({
  imports: [AuthModule],
  controllers: [TracksController],
  providers: [ArtistGuard, JwtAuthGuard, TracksService, AiTracksService],
})
export class TracksModule {}
