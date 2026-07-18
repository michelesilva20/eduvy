import pino, { type Logger, type LoggerOptions } from "pino";

const REDACT_PATHS = [
  "password",
  "token",
  "authorization",
  "cookie",
  "secret",
  "apiKey",
  "refreshToken",
  "accessToken",
  "req.headers.authorization",
  "req.headers.cookie",
];

export interface CreateLoggerOptions {
  service: string;
  environment: string;
  level?: string;
  pretty?: boolean;
}

export function createLogger(options: CreateLoggerOptions): Logger {
  const base: LoggerOptions = {
    level: options.level ?? "info",
    base: {
      service: options.service,
      environment: options.environment,
    },
    redact: {
      paths: REDACT_PATHS,
      censor: "[REDACTED]",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  if (options.pretty && options.environment === "development") {
    return pino({
      ...base,
      transport: {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard" },
      },
    });
  }

  return pino(base);
}

export type { Logger };
