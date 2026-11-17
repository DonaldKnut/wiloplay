import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import { CatalogService } from "./catalog.service";
import { CATALOG_PROVIDERS, type CatalogProviderId } from "./catalog.types";

@ApiTags("Music catalog")
@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("providers")
  providers() {
    return { providers: this.catalog.listProviders() };
  }

  @Get("genres")
  genres() {
    return this.catalog.listGenres();
  }

  @Get("genres/:genre")
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "providers", required: false, description: "Comma-separated provider ids" })
  browseGenre(
    @Param("genre") genre: string,
    @Query("limit") limit?: string,
    @Query("providers") providers?: string,
  ) {
    return this.catalog.browseGenre({
      genre: genre.trim().toLowerCase(),
      limit: this.parseLimit(limit, 24),
      providers: this.parseProviders(providers),
    });
  }

  @Get("search")
  @ApiQuery({ name: "q", required: true, example: "afrobeats" })
  @ApiQuery({ name: "genre", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "providers", required: false })
  search(
    @Query("q") query = "",
    @Query("genre") genre?: string,
    @Query("limit") limit?: string,
    @Query("providers") providers?: string,
  ) {
    return this.catalog.search({
      query: query.trim(),
      genre: genre?.trim().toLowerCase() || undefined,
      limit: this.parseLimit(limit, 20),
      providers: this.parseProviders(providers),
    });
  }

  @Get("trending")
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "providers", required: false })
  trending(@Query("limit") limit?: string, @Query("providers") providers?: string) {
    return this.catalog.trending(this.parseLimit(limit, 24), this.parseProviders(providers));
  }

  private parseLimit(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(Math.floor(parsed), 40);
  }

  private parseProviders(value?: string): CatalogProviderId[] | undefined {
    if (!value?.trim()) return undefined;
    const ids = value
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter((part): part is CatalogProviderId =>
        (CATALOG_PROVIDERS as readonly string[]).includes(part),
      );
    return ids.length ? ids : undefined;
  }
}
