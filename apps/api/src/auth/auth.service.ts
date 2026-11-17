import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { randomInt } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto, RegisterDto } from "./auth.dto";
import { EmailVerificationService } from "./email-verification.service";

const emailVerificationCodeLifetimeMs = 10 * 60 * 1000;
const emailVerificationResendDelayMs = 60 * 1000;
const emailVerificationMaxAttempts = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly emailVerification: EmailVerificationService,
  ) {}

  async register(input: RegisterDto) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("An account with this email already exists.");
    const user = await this.prisma.user.create({
      data: {
        email,
        name: input.name.trim(),
        passwordHash: await hash(input.password, 12),
      },
    });
    try {
      return await this.requestEmailVerification(user);
    } catch (error) {
      await this.prisma.user.deleteMany({
        where: { id: user.id, emailVerifiedAt: null },
      });
      throw error;
    }
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
    });
    if (!user || !(await compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Email or password is incorrect.");
    }
    if (!user.emailVerifiedAt) return this.requestEmailVerification(user);
    return this.session(user);
  }

  async requestEmailVerificationForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, emailVerifiedAt: true },
    });
    if (!user) throw new UnauthorizedException("Please sign in again.");
    if (user.emailVerifiedAt) {
      return { emailVerifiedAt: user.emailVerifiedAt.toISOString() };
    }
    return this.requestEmailVerification(user);
  }

  async becomeArtist(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    });
    if (!user) throw new UnauthorizedException("Please sign in again.");
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException("Verify your email address before creating an artist profile.");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: "ARTIST" },
    });
    return this.session(updatedUser);
  }

  async verifyEmail(emailInput: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: emailInput.trim().toLowerCase() },
    });
    if (!user) throw new UnauthorizedException("Email or verification code is incorrect.");
    if (user.emailVerifiedAt) {
      throw new ConflictException("This email is already verified. Please sign in.");
    }
    if (!user.emailVerificationCodeHash || !user.emailVerificationExpiresAt) {
      throw new BadRequestException("Request a new verification code to continue.");
    }

    const now = new Date();
    if (user.emailVerificationExpiresAt <= now) {
      await this.clearEmailVerificationCode(user.id, user.emailVerificationCodeHash);
      throw new BadRequestException("That code has expired. Request a new one.");
    }
    if (user.emailVerificationAttempts >= emailVerificationMaxAttempts) {
      await this.clearEmailVerificationCode(user.id, user.emailVerificationCodeHash);
      throw new HttpException(
        "Too many incorrect codes. Request a new one.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const matches = await compare(code, user.emailVerificationCodeHash);
    if (!matches) {
      const attemptedAt = new Date();
      const attempt = await this.prisma.user.updateMany({
        where: {
          id: user.id,
          emailVerificationCodeHash: user.emailVerificationCodeHash,
          emailVerificationExpiresAt: { gt: attemptedAt },
          emailVerificationAttempts: { lt: emailVerificationMaxAttempts },
          emailVerifiedAt: null,
        },
        data: { emailVerificationAttempts: { increment: 1 } },
      });
      if (attempt.count === 0) {
        throw new BadRequestException("That code has expired or is no longer valid.");
      }
      if (user.emailVerificationAttempts + 1 >= emailVerificationMaxAttempts) {
        await this.clearEmailVerificationCode(user.id, user.emailVerificationCodeHash);
        throw new HttpException(
          "Too many incorrect codes. Request a new one.",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new BadRequestException("The verification code is incorrect.");
    }

    const verifiedAt = new Date();
    const verified = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        emailVerificationCodeHash: user.emailVerificationCodeHash,
        emailVerificationExpiresAt: { gt: verifiedAt },
        emailVerificationAttempts: { lt: emailVerificationMaxAttempts },
        emailVerifiedAt: null,
      },
      data: {
        emailVerifiedAt: verifiedAt,
        emailVerificationCodeHash: null,
        emailVerificationExpiresAt: null,
        emailVerificationLastSentAt: null,
        emailVerificationAttempts: 0,
      },
    });
    if (verified.count === 0) {
      throw new BadRequestException("That code has expired or is no longer valid.");
    }
    const updatedUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return this.session(updatedUser);
  }

  private async requestEmailVerification(user: { id: string; email: string; name: string }) {
    const now = new Date();
    const resendBefore = new Date(now.getTime() - emailVerificationResendDelayMs);
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const codeHash = await hash(code, 10);
    const claimed = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        emailVerifiedAt: null,
        OR: [
          { emailVerificationLastSentAt: null },
          { emailVerificationLastSentAt: { lte: resendBefore } },
        ],
      },
      data: {
        emailVerificationCodeHash: codeHash,
        emailVerificationExpiresAt: new Date(now.getTime() + emailVerificationCodeLifetimeMs),
        emailVerificationLastSentAt: now,
        emailVerificationAttempts: 0,
      },
    });
    if (claimed.count === 0) {
      const current = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          emailVerifiedAt: true,
          emailVerificationCodeHash: true,
          emailVerificationExpiresAt: true,
          emailVerificationAttempts: true,
          role: true,
          email: true,
          name: true,
        },
      });
      if (!current) throw new UnauthorizedException("Please sign in again.");
      if (current.emailVerifiedAt) return this.session(current);
      if (
        current.emailVerificationCodeHash
        && current.emailVerificationExpiresAt
        && current.emailVerificationExpiresAt > now
        && current.emailVerificationAttempts < emailVerificationMaxAttempts
      ) {
        return {
          verificationRequired: true as const,
          email: user.email,
          expiresInSeconds: Math.ceil((current.emailVerificationExpiresAt.getTime() - now.getTime()) / 1000),
          sent: false,
        };
      }
      throw new HttpException(
        "Please wait a minute before requesting another code.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      await this.emailVerification.sendCode({
        email: user.email,
        name: user.name,
        code,
      });
    } catch (error) {
      await this.prisma.user.updateMany({
        where: { id: user.id, emailVerificationCodeHash: codeHash },
        data: {
          emailVerificationCodeHash: null,
          emailVerificationExpiresAt: null,
          emailVerificationLastSentAt: null,
          emailVerificationAttempts: 0,
        },
      });
      throw error;
    }

    return {
      verificationRequired: true as const,
      email: user.email,
      expiresInSeconds: emailVerificationCodeLifetimeMs / 1000,
      sent: true,
    };
  }

  private async clearEmailVerificationCode(userId: string, codeHash: string) {
    await this.prisma.user.updateMany({
      where: { id: userId, emailVerificationCodeHash: codeHash },
      data: {
        emailVerificationCodeHash: null,
        emailVerificationExpiresAt: null,
        emailVerificationAttempts: 0,
      },
    });
  }

  private session(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerifiedAt?: Date | null;
  }) {
    return {
      accessToken: this.jwt.sign({ sub: user.id, email: user.email, role: user.role }),
      user: this.publicUser(user),
    };
  }

  private publicUser(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerifiedAt?: Date | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    };
  }
}
