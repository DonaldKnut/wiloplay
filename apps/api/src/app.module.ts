import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { ArtistsModule } from "./artists/artists.module";
import { DeezerModule } from "./deezer/deezer.module";
import { EventsModule } from "./events/events.module";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { TracksModule } from "./tracks/tracks.module";

@Module({
  controllers: [HealthController],
  imports: [PrismaModule, AuthModule, ArtistsModule, DeezerModule, TracksModule, EventsModule],
})
export class AppModule {}
