import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { ArtistGuard } from "./artist.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { EmailVerificationService } from "./email-verification.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "local-development-secret-change-me",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ArtistGuard, JwtAuthGuard, EmailVerificationService],
  exports: [ArtistGuard, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
