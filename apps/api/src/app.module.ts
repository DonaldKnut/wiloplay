import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { ArtistsModule } from "./artists/artists.module";
import { DeezerModule } from "./deezer/deezer.module";
import { EventsModule } from "./events/events.module";
import { AppController } from "./app.controller";
import { HealthController } from "./health.controller";
import { LibraryModule } from "./library/library.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SearchModule } from "./search/search.module";
import { TracksModule } from "./tracks/tracks.module";

@Module({
  controllers: [AppController, HealthController],
  imports: [PrismaModule, AuthModule, ArtistsModule, DeezerModule, TracksModule, EventsModule, LibraryModule, SearchModule],
})
export class AppModule {}
