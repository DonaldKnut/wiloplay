import { Type } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateEventDto {
  @ApiProperty({ example: "Summer Live" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title!: string;

  @ApiProperty({ example: "Amina Bello" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  artistName!: string;

  @ApiProperty({ example: "The New Afrika Shrine" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  venue!: string;

  @ApiProperty({ example: "Lagos" })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @ApiProperty({ format: "date-time", example: "2026-12-01T19:00:00.000Z" })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({
    description: "Ticket price in kobo.",
    minimum: 0,
    maximum: 100000000,
    example: 500000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000000)
  priceCents!: number;

  @ApiProperty({ minimum: 1, maximum: 100000, example: 250 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  capacity!: number;

  @ApiPropertyOptional({
    description: "JSON-encoded ticket category list for multipart form submissions.",
    example: "[{\"name\":\"VIP\",\"price\":1000000,\"capacity\":50}]",
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  ticketCategories?: string;
}

export class AddEventCapacityDto {
  @ApiProperty({ minimum: 1, maximum: 100000, example: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  additionalTickets!: number;
}

export class EventNotificationDto {
  @ApiProperty({ example: "Doors open at 7 PM." })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  message!: string;
}

export class ReserveTicketDto {
  @ApiProperty({ minimum: 1, maximum: 10, example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  quantity!: number;

  @ApiPropertyOptional({ maxLength: 100, example: "regular-tier-id" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoryId?: string;
}

export class CheckInTicketDto {
  @ApiProperty({ minLength: 8, maxLength: 100, example: "ticket-code" })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  code!: string;
}

