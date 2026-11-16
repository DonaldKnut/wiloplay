import { Module } from "@nestjs/common";
import { ArtistGuard } from "../auth/artist.guard";
import { AuthModule } from "../auth/auth.module";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { AdminGuard } from "./admin.guard";
import { PaymentsController } from "./payments.controller";
import { PaystackService } from "./paystack.service";
import { TicketEmailService } from "./ticket-email.service";

@Module({
  imports: [AuthModule],
  controllers: [EventsController, PaymentsController],
  providers: [ArtistGuard, JwtAuthGuard, AdminGuard, EventsService, PaystackService, TicketEmailService],
})
export class EventsModule {}
