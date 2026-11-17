import { Module } from "@nestjs/common";
import { DeezerModule } from "../deezer/deezer.module";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
import { AudiusProvider } from "./providers/audius.provider";
import { DeezerCatalogProvider } from "./providers/deezer.provider";
import { ItunesProvider } from "./providers/itunes.provider";
import { JamendoProvider } from "./providers/jamendo.provider";

@Module({
  imports: [DeezerModule],
  controllers: [CatalogController],
  providers: [AudiusProvider, JamendoProvider, DeezerCatalogProvider, ItunesProvider, CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
