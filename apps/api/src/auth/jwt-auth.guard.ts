import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";

export type AuthenticatedRequest = Request & {
  user: { sub: string; email: string; role: string };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers["authorization"];
    const [scheme, token] = authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Sign in to continue.");
    }
    try {
      request.user = this.jwt.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException("Your session has expired. Please sign in again.");
    }
  }
}
