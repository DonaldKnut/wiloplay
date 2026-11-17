import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

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
  @ApiPropertyOptional({ example: "Sunrise" })
  @IsOptional()
  @ApiProperty({ example: "Amina Bello" })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  artistName!: string;

  @ApiProperty({ enum: MUSIC_GENRES })
  @IsIn([...MUSIC_GENRES])
  genre!: (typeof MUSIC_GENRES)[number];

  @ApiProperty({ enum: ["SINGLE", "ALBUM"] })
  @IsIn(["SINGLE", "ALBUM"])
  releaseType!: "SINGLE" | "ALBUM";

  @ApiPropertyOptional({ example: "Morning Light" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  albumTitle?: string;

  @ApiPropertyOptional({ example: "A collection of songs for the new season." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  releaseDescription?: string;
}

export class UpdateTrackDto {
  @ApiPropertyOptional({ example: "Sunrise (Remastered)" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ enum: MUSIC_GENRES })
  @IsOptional()
  @IsIn([...MUSIC_GENRES])
  genre?: (typeof MUSIC_GENRES)[number];

  @ApiPropertyOptional({ example: "Morning Light" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  albumTitle?: string;

  @ApiPropertyOptional({ example: "Updated release description." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  releaseDescription?: string;
}
