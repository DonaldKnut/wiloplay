import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendEmailVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from "./auth.dto";
import { AuthenticatedRequest, JwtAuthGuard } from "./jwt-auth.guard";

@ApiTags("Authentication")
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

  @Post("resend-email-verification")
  resendEmailVerification(@Body() input: ResendEmailVerificationDto) {
    return this.auth.resendEmailVerification(input);
  }

  @Post("request-email-verification")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  requestEmailVerification(@Req() request: AuthenticatedRequest) {
    return this.auth.requestEmailVerificationForUser(request.user.sub);
  }

  @Post("forgot-password")
  forgotPassword(@Body() input: ForgotPasswordDto) {
    return this.auth.forgotPassword(input);
  }

  @Post("reset-password")
  resetPassword(@Body() input: ResetPasswordDto) {
    return this.auth.resetPassword(input);
  }

  @Post("become-artist")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  becomeArtist(@Req() request: AuthenticatedRequest) {
    return this.auth.becomeArtist(request.user.sub);
  }

  @Post("verify-email")
  verifyEmail(@Body() input: VerifyEmailDto) {
    return this.auth.verifyEmail(input.email, input.code);
  }
}
