import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RecordListenDto {
  @ApiProperty({ format: "uuid", example: "d3b07384-d9a0-4b2f-9f4b-6e8e4a9d8b27" })
  @IsUUID("4")
  playbackId!: string;

  @ApiPropertyOptional({ example: "Lagos", maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;
}
