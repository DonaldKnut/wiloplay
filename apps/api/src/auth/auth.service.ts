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
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendEmailVerificationDto,
  ResetPasswordDto,
} from "./auth.dto";
import { EmailVerificationService } from "./email-verification.service";

const emailVerificationCodeLifetimeMs = 10 * 60 * 1000;
const emailVerificationResendDelayMs = 60 * 1000;
const emailVerificationMaxAttempts = 5;
const passwordResetCodeLifetimeMs = 10 * 60 * 1000;
const passwordResetResendDelayMs = 60 * 1000;
const passwordResetMaxAttempts = 5;

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
    if (existing) {
      if (existing.emailVerifiedAt) {
        throw new ConflictException("An account with this email already exists. Please log in.");
      }
      if (!(await compare(input.password, existing.passwordHash))) {
        throw new ConflictException(
          "An account with this email already exists. Log in with your password to continue verification.",
        );
      }
      if (existing.name !== input.name.trim()) {
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { name: input.name.trim() },
        });
      }
      return this.requestEmailVerification({
        id: existing.id,
        email: existing.email,
        name: input.name.trim(),
      });
    }

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

  async resendEmailVerification(input: ResendEmailVerificationDto) {
    return this.login(input);
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

  async forgotPassword(input: ForgotPasswordDto) {
    const email = input.email.trim().toLowerCase();
    const accepted = {
      accepted: true as const,
      email,
      message: "If an account exists for that email, a reset code is on the way.",
    };
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return accepted;

    const now = new Date();
    const resendBefore = new Date(now.getTime() - passwordResetResendDelayMs);
    if (user.passwordResetLastSentAt && user.passwordResetLastSentAt > resendBefore) {
      return {
        ...accepted,
        expiresInSeconds: user.passwordResetExpiresAt && user.passwordResetExpiresAt > now
          ? Math.ceil((user.passwordResetExpiresAt.getTime() - now.getTime()) / 1000)
          : passwordResetCodeLifetimeMs / 1000,
        sent: false,
      };
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const codeHash = await hash(code, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetCodeHash: codeHash,
        passwordResetExpiresAt: new Date(now.getTime() + passwordResetCodeLifetimeMs),
        passwordResetLastSentAt: now,
        passwordResetAttempts: 0,
      },
    });

    try {
      await this.emailVerification.sendPasswordResetCode({
        email: user.email,
        name: user.name,
        code,
      });
    } catch (error) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetCodeHash: null,
          passwordResetExpiresAt: null,
          passwordResetLastSentAt: null,
          passwordResetAttempts: 0,
        },
      });
      throw error;
    }

    return {
      ...accepted,
      expiresInSeconds: passwordResetCodeLifetimeMs / 1000,
      sent: true,
    };
  }

  async resetPassword(input: ResetPasswordDto) {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordResetCodeHash || !user.passwordResetExpiresAt) {
      throw new UnauthorizedException("Email or reset code is incorrect.");
    }

    const now = new Date();
    if (user.passwordResetExpiresAt <= now) {
      await this.clearPasswordResetCode(user.id, user.passwordResetCodeHash);
      throw new BadRequestException("That code has expired. Request a new one.");
    }
    if (user.passwordResetAttempts >= passwordResetMaxAttempts) {
      await this.clearPasswordResetCode(user.id, user.passwordResetCodeHash);
      throw new HttpException(
        "Too many incorrect codes. Request a new one.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const matches = await compare(input.code, user.passwordResetCodeHash);
    if (!matches) {
      const attempt = await this.prisma.user.updateMany({
        where: {
          id: user.id,
          passwordResetCodeHash: user.passwordResetCodeHash,
          passwordResetExpiresAt: { gt: now },
          passwordResetAttempts: { lt: passwordResetMaxAttempts },
        },
        data: { passwordResetAttempts: { increment: 1 } },
      });
      if (attempt.count === 0) {
        throw new BadRequestException("That code has expired or is no longer valid.");
      }
      if (user.passwordResetAttempts + 1 >= passwordResetMaxAttempts) {
        await this.clearPasswordResetCode(user.id, user.passwordResetCodeHash);
        throw new HttpException(
          "Too many incorrect codes. Request a new one.",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new BadRequestException("The reset code is incorrect.");
    }

    const passwordHash = await hash(input.password, 12);
    const updated = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        passwordResetCodeHash: user.passwordResetCodeHash,
        passwordResetExpiresAt: { gt: now },
        passwordResetAttempts: { lt: passwordResetMaxAttempts },
      },
      data: {
        passwordHash,
        emailVerifiedAt: user.emailVerifiedAt ?? now,
        passwordResetCodeHash: null,
        passwordResetExpiresAt: null,
        passwordResetLastSentAt: null,
        passwordResetAttempts: 0,
        emailVerificationCodeHash: null,
        emailVerificationExpiresAt: null,
        emailVerificationLastSentAt: null,
        emailVerificationAttempts: 0,
      },
    });
    if (updated.count === 0) {
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

  private async clearPasswordResetCode(userId: string, codeHash: string) {
    await this.prisma.user.updateMany({
      where: { id: userId, passwordResetCodeHash: codeHash },
      data: {
        passwordResetCodeHash: null,
        passwordResetExpiresAt: null,
        passwordResetAttempts: 0,
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
