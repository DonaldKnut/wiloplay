import "dotenv/config";
import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { static as serveStatic } from "express";
import { join } from "node:path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use("/uploads", serveStatic(join(__dirname, "..", "uploads")));
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`Wiloplay API listening on http://localhost:${port}`);
}

void bootstrap();
