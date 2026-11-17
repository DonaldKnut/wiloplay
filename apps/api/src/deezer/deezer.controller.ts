import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import { DeezerService } from "./deezer.service";

@ApiTags("Music catalog")
@Controller("deezer")
export class DeezerController {
  constructor(private readonly deezer: DeezerService) {}

  @Get("search")
  @ApiQuery({ name: "q", required: false, example: "indie chill" })
  search(@Query("q") query = "indie chill") {
    return this.deezer.search(query);
  }

  @Get("chart")
  chart() {
    return this.deezer.chart();
  }

  @Get("artists/:id")
  artistDetails(@Param("id") id: string) {
    return this.deezer.artistDetails(id);
  }
}
