import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto, RegisterDto } from "./auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
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

  async becomeArtist(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: "ARTIST" },
    });
    return this.session(user);
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
