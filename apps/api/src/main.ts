import "dotenv/config";
import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { static as serveStatic } from "express";
import { join } from "node:path";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

function parseWebOrigins() {
  const raw = process.env.WEB_ORIGIN ?? "http://localhost:3000";
  return [
    ...new Set(
      raw
        .split(",")
        .map((value) => value.trim().replace(/\/+$/, ""))
        .filter(Boolean),
    ),
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const allowedOrigins = parseWebOrigins();
  app.enableCors({
    origin(origin, callback) {
      // Non-browser clients (curl, server-to-server) often omit Origin.
      if (!origin) {
        callback(null, true);
        return;
      }
      // Always echo a single matching origin — never the raw comma-separated env string.
      if (allowedOrigins.includes(origin)) {
        callback(null, origin);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Wiloplay API")
    .setDescription(
      "Backend API for Wiloplay music discovery, artist releases, and live events.",
    )
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, openApiDocument);

  app.use("/uploads", serveStatic(join(__dirname, "..", "uploads")));
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`Wiloplay API listening on http://localhost:${port}`);
}

void bootstrap();
