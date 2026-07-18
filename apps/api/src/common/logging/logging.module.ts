import { Global, Inject, Module } from "@nestjs/common";
import { createLogger, type Logger } from "@eduvy/logger";
import { API_ENV } from "../config/config.module";
import type { ApiEnv } from "@eduvy/config";

export const APP_LOGGER = Symbol("APP_LOGGER");

@Global()
@Module({
  providers: [
    {
      provide: APP_LOGGER,
      inject: [API_ENV],
      useFactory: (env: ApiEnv): Logger =>
        createLogger({
          service: env.EDUVY_SERVICE,
          environment: env.NODE_ENV,
          level: env.LOG_LEVEL,
          pretty: env.NODE_ENV === "development",
        }),
    },
  ],
  exports: [APP_LOGGER],
})
export class LoggingModule {}

export const InjectLogger = () => Inject(APP_LOGGER);
