import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto, VerifyEmailDto } from "./auth.dto";
import { AuthenticatedRequest, JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup")
  signup(@Body() input: RegisterDto) {
    return this.auth.register(input);
  }

  @Post("login")
  login(@Body() input: LoginDto) {
    return this.auth.login(input);
  }

  @Post("request-email-verification")
  @UseGuards(JwtAuthGuard)
  requestEmailVerification(@Req() request: AuthenticatedRequest) {
    return this.auth.requestEmailVerificationForUser(request.user.sub);
  }

  @Post("become-artist")
  @UseGuards(JwtAuthGuard)
  becomeArtist(@Req() request: AuthenticatedRequest) {
    return this.auth.becomeArtist(request.user.sub);
  }

  @Post("verify-email")
  verifyEmail(@Body() input: VerifyEmailDto) {
    return this.auth.verifyEmail(input.email, input.code);
  }
}
