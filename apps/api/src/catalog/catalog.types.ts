export const CATALOG_PROVIDERS = ["audius", "jamendo", "deezer", "itunes"] as const;

export type CatalogProviderId = (typeof CATALOG_PROVIDERS)[number];

export type CatalogPlayback = "full" | "preview";

export type CatalogTrack = {
  id: string;
  provider: CatalogProviderId;
  providerTrackId: string;
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  duration?: number;
  genres: string[];
  previewUrl?: string;
  streamUrl?: string;
  externalUrl?: string;
  playback: CatalogPlayback;
  attribution?: string;
};

export type CatalogSearchInput = {
  query: string;
  genre?: string;
  limit?: number;
  providers?: CatalogProviderId[];
};

export type CatalogBrowseInput = {
  genre: string;
  limit?: number;
  providers?: CatalogProviderId[];
};

export type CatalogProviderStatus = {
  id: CatalogProviderId;
  label: string;
  enabled: boolean;
  playback: CatalogPlayback;
  requiresKey: boolean;
  configured: boolean;
};

export const CATALOG_GENRES = [
  "afrobeats",
  "ambient",
  "blues",
  "classical",
  "country",
  "electronic",
  "folk",
  "hiphop",
  "house",
  "indie",
  "jazz",
  "latin",
  "metal",
  "pop",
  "rnb",
  "reggae",
  "rock",
  "soul",
  "techno",
  "world",
] as const;

export type CatalogGenre = (typeof CATALOG_GENRES)[number];

export function catalogTrackId(provider: CatalogProviderId, providerTrackId: string) {
  return `${provider}:${providerTrackId}`;
}
