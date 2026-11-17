import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Service")
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: "Show API status and available documentation" })
  @ApiOkResponse({ description: "Wiloplay API information and entry points." })
  getStatus() {
    return {
      status: "ok",
      service: "Wiloplay API",
      message: "The Wiloplay backend is running.",
      links: {
        documentation: "/docs",
        openapi: "/docs-json",
        health: "/health",
      },
    };
  }
}
