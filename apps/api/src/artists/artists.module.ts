import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ArtistsController } from "./artists.controller";
import { ArtistsService } from "./artists.service";

@Module({
  imports: [AuthModule],
  controllers: [ArtistsController],
  providers: [JwtAuthGuard, ArtistsService],
})
export class ArtistsModule {}
