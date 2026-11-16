import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { randomUUID } from "node:crypto";
import { extname, join } from "node:path";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ArtistGuard } from "../auth/artist.guard";
import {
  CheckInTicketDto,
  AddEventCapacityDto,
  CreateEventDto,
  EventNotificationDto,
  ReserveTicketDto,
} from "./events.dto";
import { EventsService } from "./events.service";

const supportedCoverExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

@Controller("events")
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list() {
    return this.events.list();
  }

  @Get("payment-mode")
  getPaymentMode() {
    return this.events.getPaymentMode();
  }

  @Get("mine")
  @UseGuards(JwtAuthGuard, ArtistGuard)
  listArtistEvents(@Req() request: AuthenticatedRequest) {
    return this.events.listArtistEvents(request.user.sub);
  }

  @Get("my-tickets")
  @UseGuards(JwtAuthGuard)
  listMyTickets(@Req() request: AuthenticatedRequest) {
    return this.events.listMyTickets(request.user.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard, ArtistGuard)
  @UseInterceptors(
    FileInterceptor("cover", {
      storage: diskStorage({
        destination: join(__dirname, "..", "..", "uploads"),
        filename: (_request, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();
        if (!supportedCoverExtensions.has(extension) || !file.mimetype.startsWith("image/")) {
          callback(new BadRequestException("Choose a JPG, PNG or WebP event cover."), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateEventDto,
    @UploadedFile() cover?: Express.Multer.File,
  ) {
    return this.events.create(request.user.sub, input, cover);
  }

  @Patch(":id/capacity")
  @UseGuards(JwtAuthGuard, ArtistGuard)
  addCapacity(
    @Req() request: AuthenticatedRequest,
    @Param("id") eventId: string,
    @Body() input: AddEventCapacityDto,
  ) {
    return this.events.addCapacity(request.user.sub, eventId, input.additionalTickets);
  }

  @Post(":id/notify")
  @UseGuards(JwtAuthGuard, ArtistGuard)
  notifyAttendees(
    @Req() request: AuthenticatedRequest,
    @Param("id") eventId: string,
    @Body() input: EventNotificationDto,
  ) {
    return this.events.notifyAttendees(request.user.sub, eventId, input.message);
  }

  @Post(":id/tickets")
  @UseGuards(JwtAuthGuard)
  reserve(
    @Req() request: AuthenticatedRequest,
    @Param("id") eventId: string,
    @Body() input: ReserveTicketDto,
  ) {
    return this.events.purchase(
      request.user.sub,
      eventId,
      input.quantity,
      input.categoryId,
    );
  }

  @Post(":id/check-in")
  @UseGuards(JwtAuthGuard, ArtistGuard)
  checkIn(
    @Req() request: AuthenticatedRequest,
    @Param("id") eventId: string,
    @Body() input: CheckInTicketDto,
  ) {
    return this.events.checkIn(request.user.sub, eventId, input.code);
  }
}
