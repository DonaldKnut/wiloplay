import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { AuthenticatedRequest } from "./jwt-auth.guard";

@Injectable()
export class ArtistGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user.role !== "ARTIST") {
      throw new ForbiddenException("Create your artist profile before continuing.");
    }
    return true;
  }
}
