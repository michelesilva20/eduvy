import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { loadApiEnv, parseCorsOrigins } from "@eduvy/config";
import { createLogger } from "@eduvy/logger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { RequestIdInterceptor } from "./common/interceptors/request-id.interceptor";

async function bootstrap() {
  const env = loadApiEnv();
  const logger = createLogger({
    service: env.EDUVY_SERVICE,
    environment: env.NODE_ENV,
    level: env.LOG_LEVEL,
    pretty: env.NODE_ENV === "development",
  });

  const app = await NestFactory.create(AppModule, { logger: false });
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: parseCorsOrigins(env.CORS_ORIGINS),
    credentials: true,
  });
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.useGlobalInterceptors(new RequestIdInterceptor());

  const swagger = new DocumentBuilder()
    .setTitle("Eduvy API")
    .setDescription("Plataforma SaaS modular de aprendizagem")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, swagger));

  await app.listen(env.PORT);
  logger.info({ port: env.PORT }, "Eduvy API started");
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
