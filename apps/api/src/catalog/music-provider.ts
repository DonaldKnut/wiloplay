import type {
  CatalogBrowseInput,
  CatalogProviderId,
  CatalogProviderStatus,
  CatalogSearchInput,
  CatalogTrack,
} from "./catalog.types";

export interface MusicProvider {
  readonly id: CatalogProviderId;
  readonly label: string;
  status(): CatalogProviderStatus;
  search(input: CatalogSearchInput): Promise<CatalogTrack[]>;
  browseGenre?(input: CatalogBrowseInput): Promise<CatalogTrack[]>;
  trending?(limit?: number): Promise<CatalogTrack[]>;
}
