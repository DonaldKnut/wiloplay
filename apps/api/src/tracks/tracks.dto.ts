import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export const MUSIC_GENRES = [
  "Afrobeats",
  "Amapiano",
  "Afropop",
  "Afro-fusion",
  "Gospel",
  "Hip-hop",
  "R&B",
  "Pop",
  "Dancehall",
  "Highlife",
  "Jazz",
  "Alternative",
  "Electronic",
  "Other",
] as const;

export class UploadTrackDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  artistName!: string;

  @IsIn([...MUSIC_GENRES])
  genre!: (typeof MUSIC_GENRES)[number];

  @IsIn(["SINGLE", "ALBUM"])
  releaseType!: "SINGLE" | "ALBUM";

  @IsOptional()
  @IsString()
  @MaxLength(100)
  albumTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  releaseDescription?: string;
}

export class UpdateTrackDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsIn([...MUSIC_GENRES])
  genre?: (typeof MUSIC_GENRES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  albumTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  releaseDescription?: string;
}
