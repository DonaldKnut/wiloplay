import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Service")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Check whether the API process is responding" })
  @ApiOkResponse({ description: "The API process is healthy." })
  getHealth() {
    return {
      status: "ok",
      service: "wiloplay-api",
      timestamp: new Date().toISOString(),
    };
  }
}
