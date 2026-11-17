import { Module } from "@nestjs/common";
import { ArtistsModule } from "../artists/artists.module";
import { DeezerModule } from "../deezer/deezer.module";
import { EventsModule } from "../events/events.module";
import { TracksModule } from "../tracks/tracks.module";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";

@Module({
  imports: [TracksModule, ArtistsModule, EventsModule, DeezerModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
