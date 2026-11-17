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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from "@nestjs/swagger";
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
@ApiTags("Events and tickets")
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ArtistGuard)
  listArtistEvents(@Req() request: AuthenticatedRequest) {
    return this.events.listArtistEvents(request.user.sub);
  }

  @Get("my-tickets")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  listMyTickets(@Req() request: AuthenticatedRequest) {
    return this.events.listMyTickets(request.user.sub);
  }

  @Post()
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: [
        "title",
        "artistName",
        "venue",
        "city",
        "startsAt",
        "priceCents",
        "capacity",
      ],
      properties: {
        title: { type: "string", minLength: 2, maxLength: 100 },
        artistName: { type: "string", minLength: 2, maxLength: 100 },
        venue: { type: "string", minLength: 2, maxLength: 100 },
        city: { type: "string", minLength: 2, maxLength: 80 },
        startsAt: { type: "string", format: "date-time" },
        priceCents: { type: "integer", minimum: 0, description: "Price in kobo." },
        capacity: { type: "integer", minimum: 1 },
        ticketCategories: {
          type: "string",
          description: "JSON-encoded ticket category list.",
        },
        cover: { type: "string", format: "binary" },
      },
    },
  })
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ArtistGuard)
  addCapacity(
    @Req() request: AuthenticatedRequest,
    @Param("id") eventId: string,
    @Body() input: AddEventCapacityDto,
  ) {
    return this.events.addCapacity(request.user.sub, eventId, input.additionalTickets);
  }

  @Post(":id/notify")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ArtistGuard)
  notifyAttendees(
    @Req() request: AuthenticatedRequest,
    @Param("id") eventId: string,
    @Body() input: EventNotificationDto,
  ) {
    return this.events.notifyAttendees(request.user.sub, eventId, input.message);
  }

  @Post(":id/tickets")
  @ApiBearerAuth()
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ArtistGuard)
  checkIn(
    @Req() request: AuthenticatedRequest,
    @Param("id") eventId: string,
    @Body() input: CheckInTicketDto,
  ) {
    return this.events.checkIn(request.user.sub, eventId, input.code);
  }
}
