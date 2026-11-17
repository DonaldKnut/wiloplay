import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto, VerifyArtistEmailDto } from "./auth.dto";
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

  @Post("become-artist")
  @UseGuards(JwtAuthGuard)
  becomeArtist(@Req() request: AuthenticatedRequest) {
    return this.auth.requestArtistVerification(request.user.sub);
  }

  @Post("verify-artist-email")
  @UseGuards(JwtAuthGuard)
  verifyArtistEmail(
    @Req() request: AuthenticatedRequest,
    @Body() input: VerifyArtistEmailDto,
  ) {
    return this.auth.verifyArtistEmail(request.user.sub, input.code);
  }
}
