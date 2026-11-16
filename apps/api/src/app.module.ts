import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { ArtistsModule } from "./artists/artists.module";
import { DeezerModule } from "./deezer/deezer.module";
import { EventsModule } from "./events/events.module";
import { PrismaModule } from "./prisma/prisma.module";
import { TracksModule } from "./tracks/tracks.module";

@Module({
  imports: [PrismaModule, AuthModule, ArtistsModule, DeezerModule, TracksModule, EventsModule],
})
export class AppModule {}
