import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class RecordListenDto {
  @IsUUID("4")
  playbackId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;
}
