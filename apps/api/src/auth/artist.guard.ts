import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthenticatedRequest } from "./jwt-auth.guard";

@Injectable()
export class ArtistGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user.role !== "ARTIST") {
      throw new ForbiddenException("Create your artist profile before continuing.");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: request.user.sub },
      select: { role: true, emailVerifiedAt: true },
    });
    if (user?.role !== "ARTIST") {
      throw new ForbiddenException("Create your artist profile before continuing.");
    }
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException("Verify your email address before using artist features.");
    }

    return true;
  }
}
