import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";

export class CreatePlaylistDto {
  @ApiProperty({ example: "Late-night rotation", minLength: 1, maxLength: 80 })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ example: "Songs for the ride home.", maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}

export class UpdatePlaylistDto {
  @ApiPropertyOptional({ example: "Late-night rotation", minLength: 1, maxLength: 80 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: "Songs for the ride home.", maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}

export class LibraryTrackDto {
  @ApiProperty({ enum: ["UPLOAD", "DEEZER"] })
  @IsIn(["UPLOAD", "DEEZER"])
  source!: "UPLOAD" | "DEEZER";

  @ApiPropertyOptional({ example: "cm123trackid", maxLength: 100 })
  @ValidateIf((input: LibraryTrackDto) => input.source === "UPLOAD")
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  trackId?: string;

  @ApiPropertyOptional({ example: "123456789", maxLength: 80 })
  @ValidateIf((input: LibraryTrackDto) => input.source === "DEEZER")
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  externalTrackId?: string;

  @ApiPropertyOptional({ example: "Midnight City", maxLength: 120 })
  @ValidateIf((input: LibraryTrackDto) => input.source === "DEEZER")
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ example: "M83", maxLength: 120 })
  @ValidateIf((input: LibraryTrackDto) => input.source === "DEEZER")
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  artistName?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  albumTitle?: string;

  @ApiPropertyOptional({ format: "uri", maxLength: 1000 })
  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(1000)
  coverUrl?: string;

  @ApiPropertyOptional({ format: "uri", maxLength: 1000 })
  @ValidateIf((input: LibraryTrackDto) => input.source === "DEEZER")
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(1000)
  previewUrl?: string;

  @ApiPropertyOptional({ format: "uri", maxLength: 1000 })
  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(1000)
  deezerUrl?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 86400 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(86400)
  duration?: number;

  @ApiPropertyOptional({ example: "Afrobeats", maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  genre?: string;
}

export class AddPlaylistTrackDto extends LibraryTrackDto {}

export class LikeTrackDto extends LibraryTrackDto {}

export class RecordPlaybackDto extends LibraryTrackDto {
  @ApiProperty({ format: "uuid", example: "d3b07384-d9a0-4b2f-9f4b-6e8e4a9d8b27" })
  @IsUUID("4")
  playbackId!: string;
}
