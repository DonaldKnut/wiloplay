import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { ArtistGuard } from "../auth/artist.guard";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "./admin.guard";
import { EventsService } from "./events.service";

type WebhookRequest = Request & { rawBody?: Buffer };

@Controller("payments")
@ApiTags("Payments")
export class PaymentsController {
  constructor(private readonly events: EventsService) {}

  @Get("artist-bank-account")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ArtistGuard)
  artistBankAccount(@Req() request: AuthenticatedRequest) {
    return this.events.getArtistBankAccount(request.user.sub);
  }

  @Post("artists/:artistId/verify")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  verifyArtist(@Param("artistId") artistId: string) {
    return this.events.verifyArtist(artistId);
  }

  @Post("paystack/webhook")
  @HttpCode(200)
  paystackWebhook(@Req() request: WebhookRequest) {
    return this.events.handlePaystackWebhook(
      request.rawBody,
      request.headers["x-paystack-signature"],
      request.body,
    );
  }
}
