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

export class CreateEventDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  artistName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  venue!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @IsDateString()
  startsAt!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000000)
  priceCents!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  capacity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  ticketCategories?: string;
}

export class AddEventCapacityDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  additionalTickets!: number;
}

export class EventNotificationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  message!: string;
}

export class ReserveTicketDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoryId?: string;
}

export class CheckInTicketDto {
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  code!: string;
}

