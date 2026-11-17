import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SearchService } from "./search.service";

@ApiTags("Search")
@Controller("search")
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  lookup(@Query("q") query = "") {
    return this.search.lookup(query);
  }
}
