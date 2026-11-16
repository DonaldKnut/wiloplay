import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { AuthenticatedRequest } from "../auth/jwt-auth.guard";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const administrators = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (!administrators.includes(request.user.email.toLowerCase())) {
      throw new ForbiddenException("Only a configured Wiloplay administrator can verify artists.");
    }
    return true;
  }
}
