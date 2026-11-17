import {
  BadRequestException,
  ConflictException,
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
import { ArtistVerificationEmailService } from "./artist-verification-email.service";

const artistVerificationCodeLifetimeMs = 10 * 60 * 1000;
const artistVerificationResendDelayMs = 60 * 1000;
const artistVerificationMaxAttempts = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly artistVerificationEmail: ArtistVerificationEmailService,
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
    return this.session(user);
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
    });
    if (!user || !(await compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Email or password is incorrect.");
    }
    return this.session(user);
  }

  async requestArtistVerification(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        artistEmailVerifiedAt: true,
      },
    });
    if (!user) throw new UnauthorizedException("Please sign in again.");
    if (user.artistEmailVerifiedAt) {
      throw new ConflictException("Your artist email is already verified.");
    }

    const now = new Date();
    const resendBefore = new Date(now.getTime() - artistVerificationResendDelayMs);
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const codeHash = await hash(code, 10);
    const claimed = await this.prisma.user.updateMany({
      where: {
        id: userId,
        artistEmailVerifiedAt: null,
        OR: [
          { artistVerificationLastSentAt: null },
          { artistVerificationLastSentAt: { lte: resendBefore } },
        ],
      },
      data: {
        artistVerificationCodeHash: codeHash,
        artistVerificationExpiresAt: new Date(now.getTime() + artistVerificationCodeLifetimeMs),
        artistVerificationLastSentAt: now,
        artistVerificationAttempts: 0,
      },
    });
    if (claimed.count === 0) {
      const current = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          artistEmailVerifiedAt: true,
          artistVerificationCodeHash: true,
          artistVerificationExpiresAt: true,
          artistVerificationAttempts: true,
        },
      });
      if (current?.artistEmailVerifiedAt) {
        throw new ConflictException("Your artist email is already verified.");
      }
      if (
        current?.artistVerificationCodeHash
        && current.artistVerificationExpiresAt
        && current.artistVerificationExpiresAt > now
        && current.artistVerificationAttempts < artistVerificationMaxAttempts
      ) {
        return {
          email: user.email,
          expiresInSeconds: Math.ceil((current.artistVerificationExpiresAt.getTime() - now.getTime()) / 1000),
          sent: false,
        };
      }
      throw new HttpException(
        "Please wait a minute before requesting another code.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      await this.artistVerificationEmail.sendCode({
        email: user.email,
        name: user.name,
        code,
      });
    } catch (error) {
      await this.prisma.user.updateMany({
        where: { id: userId, artistVerificationCodeHash: codeHash },
        data: {
          artistVerificationCodeHash: null,
          artistVerificationExpiresAt: null,
          artistVerificationLastSentAt: null,
          artistVerificationAttempts: 0,
        },
      });
      throw error;
    }

    return {
      email: user.email,
      expiresInSeconds: artistVerificationCodeLifetimeMs / 1000,
      sent: true,
    };
  }

  async verifyArtistEmail(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("Please sign in again.");
    if (user.artistEmailVerifiedAt) return this.session(user);
    if (!user.artistVerificationCodeHash || !user.artistVerificationExpiresAt) {
      throw new BadRequestException("Request a new verification code to continue.");
    }

    const now = new Date();
    if (user.artistVerificationExpiresAt <= now) {
      await this.clearArtistVerificationCode(userId, user.artistVerificationCodeHash);
      throw new BadRequestException("That code has expired. Request a new one.");
    }
    if (user.artistVerificationAttempts >= artistVerificationMaxAttempts) {
      await this.clearArtistVerificationCode(userId, user.artistVerificationCodeHash);
      throw new HttpException(
        "Too many incorrect codes. Request a new one.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const matches = await compare(code, user.artistVerificationCodeHash);
    if (!matches) {
      const attemptedAt = new Date();
      const attempt = await this.prisma.user.updateMany({
        where: {
          id: userId,
          artistVerificationCodeHash: user.artistVerificationCodeHash,
          artistVerificationExpiresAt: { gt: attemptedAt },
          artistVerificationAttempts: { lt: artistVerificationMaxAttempts },
          artistEmailVerifiedAt: null,
        },
        data: { artistVerificationAttempts: { increment: 1 } },
      });
      if (attempt.count === 0) {
        throw new BadRequestException("That code has expired or is no longer valid.");
      }
      if (user.artistVerificationAttempts + 1 >= artistVerificationMaxAttempts) {
        await this.clearArtistVerificationCode(userId, user.artistVerificationCodeHash);
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
        id: userId,
        artistVerificationCodeHash: user.artistVerificationCodeHash,
        artistVerificationExpiresAt: { gt: verifiedAt },
        artistVerificationAttempts: { lt: artistVerificationMaxAttempts },
        artistEmailVerifiedAt: null,
      },
      data: {
        role: "ARTIST",
        artistEmailVerifiedAt: verifiedAt,
        artistVerificationCodeHash: null,
        artistVerificationExpiresAt: null,
        artistVerificationLastSentAt: null,
        artistVerificationAttempts: 0,
      },
    });
    if (verified.count === 0) {
      throw new BadRequestException("That code has expired or is no longer valid.");
    }
    const updatedUser = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.session(updatedUser);
  }

  private async clearArtistVerificationCode(userId: string, codeHash: string) {
    await this.prisma.user.updateMany({
      where: { id: userId, artistVerificationCodeHash: codeHash },
      data: {
        artistVerificationCodeHash: null,
        artistVerificationExpiresAt: null,
        artistVerificationAttempts: 0,
      },
    });
  }

  private session(user: { id: string; email: string; name: string; role: string }) {
    return {
      accessToken: this.jwt.sign({ sub: user.id, email: user.email, role: user.role }),
      user: this.publicUser(user),
    };
  }

  private publicUser(user: { id: string; email: string; name: string; role: string }) {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
}
