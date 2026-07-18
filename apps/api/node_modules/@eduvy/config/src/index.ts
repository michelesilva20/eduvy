import { z } from "zod";

const nodeEnvSchema = z.enum(["development", "test", "staging", "production"]);

export const apiEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema.default("development"),
  EDUVY_SERVICE: z.string().default("api"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  DATABASE_MIGRATION_URL: z.string().url().optional(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
  COOKIE_DOMAIN: z.string().optional(),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET_QUARANTINE: z.string().default("eduvy-quarantine"),
  S3_BUCKET_PRIVATE: z.string().default("eduvy-private"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value : undefined))
    .pipe(z.string().url().optional()),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  BFF_SHARED_SECRET: z.string().min(32),
});

export const webAuthEnvSchema = z.object({
  EDUVY_API_URL: z.string().url().default("http://localhost:4000/api/v1"),
  EDUVY_BFF_SECRET: z.string().min(32),
  JWT_ACCESS_SECRET: z.string().min(32),
  NODE_ENV: nodeEnvSchema.default("development"),
});

export type WebAuthEnv = z.infer<typeof webAuthEnvSchema>;

export function loadWebAuthEnv(input: NodeJS.ProcessEnv = process.env): WebAuthEnv {
  const parsed = webAuthEnvSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid web auth environment:\n${message}`);
  }
  return parsed.data;
}

export const workerEnvSchema = apiEnvSchema.extend({
  EDUVY_SERVICE: z.literal("worker").default("worker"),
  PORT: z.coerce.number().int().positive().default(4001),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function loadApiEnv(input: NodeJS.ProcessEnv = process.env): ApiEnv {
  const parsed = apiEnvSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid API environment:\n${message}`);
  }
  return parsed.data;
}

export function loadWorkerEnv(input: NodeJS.ProcessEnv = process.env): WorkerEnv {
  const parsed = workerEnvSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid worker environment:\n${message}`);
  }
  return parsed.data;
}

export function parseCorsOrigins(origins: string): string[] {
  return origins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
