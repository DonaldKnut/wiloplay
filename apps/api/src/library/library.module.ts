import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { LibraryController, PlaylistsController } from "./library.controller";
import { LibraryService } from "./library.service";

@Module({
  imports: [AuthModule],
  controllers: [LibraryController, PlaylistsController],
  providers: [LibraryService],
})
export class LibraryModule {}
